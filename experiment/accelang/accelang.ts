'use strict';

module accelang
{
    function assert(condition : boolean) : void
    {
        if (!condition)
        {
            throw {
                "&A": "error",
                "message": "internal accelang error",
                "code": stacktrace()
            };
        }
    }

    export function practicalTypeof(obj : any) : string
    {
        if (undefined === obj)
        {
            return "undefined";
        }
        if (null === obj)
        {
            return "null";
        }
        if ("[object Array]" === Object.prototype.toString.call(obj))
        {
            return "array";
        }

        return typeof obj;
    }

    export async function httpGet(url : string) :Promise<string>
    {
        return new Promise<string>
        (
            async (resolve) =>
            {
                const request = (<any>window).XMLHttpRequest ? new XMLHttpRequest(): new ActiveXObject("Microsoft.XMLHTTP");
    
                request.open('GET', url, true);
                request.onreadystatechange = () =>
                {
                    if (4 === request.readyState && 200 === request.status)
                    {
                        resolve(request.responseText);
                    }
                };
                request.send(null);
            }
        );
    }

    export function stacktrace() : string
    {
        return new Error().stack;
    }

    export function debug_out_json(data : object) : void
    {
        console.log(JSON.stringify(data));
    }

    export function deepCopy<T>(source : T) : T
    {
        return JSON.parse(JSON.stringify(source));
    }
    
    export function objectAssign(target : object, ... sources : object[]) : object
    {
        //  copy from https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
        if (typeof Object.assign !== 'function') {
            (function () {
                Object.assign = function (target) {
                'use strict';
                if (target === undefined || target === null) {
                    throw new TypeError('Cannot convert undefined or null to object');
                }
                var output = Object(target);
                for (var index = 1; index < arguments.length; index++) {
                    var source = arguments[index];
                    if (source !== undefined && source !== null) {
                        for (var nextKey in source) {
                            if (Object.prototype.hasOwnProperty.call(source, nextKey)) {
                                output[nextKey] = source[nextKey];
                            }
                        }
                    }
                }
                return output;
                };
            })();
        }

        sources.forEach(i => {
            Object.assign(target, i);
        });
        return target;
    }
        
    class AmpVersion
    {
        constructor
        (
            readonly major : string,
            readonly minor : string,
            readonly build : string
        )
        {
        }

        isCompatible(target : AmpVersion) : boolean
        {
            return this.major === target.major &&
            (
                parseInt(this.minor, 10) < parseInt(target.minor, 10) ||
                (
                    this.minor === target.minor &&
                    parseInt(this.build, 10) <= parseInt(target.build, 10)
                )
            );
        }
    }

    export class AmpCodeLocation
    {
        filepath : string;
        line : number;
        row : number;
        codepath : string[];

        constructor
        (
            filepath : string,
            line : number = 1,
            row : number = 1,
            codepath : string[] = []
        )
        {
            this.filepath = filepath;
            this.line = line;
            this.row = row;
            this.codepath = codepath;
        }

        nextLine() : AmpCodeLocation
        {
            this.line++;
            this.row = 1;
            return this;
        }
    }

    export class AmpCodeCursor
    {
        location : AmpCodeLocation;
        i : number;

        constructor
        (
            location : AmpCodeLocation,
            i : number = 0
        )
        {
            this.location = location;
            this.i = i;
        }
    }

    module AmpJsonParser
    {
        //  最初の２引数は標準の JSON.parse() の reviver への引数に合わせている
        type  reviver_type = (key : string, value : object, cursor : AmpCodeCursor) => any;

        export class AmpParseCode
        {
            cursor : AmpCodeCursor;
            code : string;

            constructor
            (
                cursor : AmpCodeCursor,
                code : string
            )
            {
                this.cursor = cursor;
                this.code = code;
            }

            getChar() : string
            {
                return this.code.charAt(this.cursor.i);
            }
            getCharAndSeek() : string
            {
                const char = this.getChar();
                this.next();
                return char;
            }
            getSubStr(length : number) : string
            {
                return this.code.substr(this.cursor.i, length);
            }

            next() : AmpParseCode
            {
                assert(this.cursor.i < this.code.length);

                const char = this.getChar();
                ++this.cursor.i;
                if ("\r" === char || "\n" === char)
                {
                    this.cursor.location.nextLine();
                    const trail_char = this.getChar();
                    if (("\r" === trail_char || "\n" === trail_char) && trail_char !== char) {
                        ++this.cursor.i;
                    }
                } else {
                    ++this.cursor.location.row;
                }
                return this;
            }
            seek(length : number) : AmpParseCode
            {
                assert(this.cursor.i +length <= this.code.length);
                assert(this.getSubStr(length).indexOf("\r") < 0);
                assert(this.getSubStr(length).indexOf("\n") < 0);
                const aim = this.cursor.i +length;
                while(this.cursor.i < aim)
                {
                    this.next();
                }
                assert(this.cursor.i === aim);
                return this;
            }

            isWhiteSpace() : boolean
            {
                return 0 <= " \t\r\n".indexOf(this.getChar());
            }

            skipWhiteSpace() : AmpParseCode
            {
                while(!this.isEnd() && this.isWhiteSpace())
                {
                    this.next();
                }
                return this;
            }

            isEnd() : boolean
            {
                return this.code.length <= this.cursor.i;
            }

            ifEndThenThrow(exception : object) : AmpParseCode
            {
                if (this.isEnd())
                {
                    throw exception;
                }
                return this;
            }

            isMatch(word : string) : boolean
            {
                assert(word.indexOf("\r") < 0);
                assert(word.indexOf("\n") < 0);

                return this.getSubStr(word.length) === word;
            }
            isMatchAndSeek(word : string) : boolean
            {
                const result = this.isMatch(word);
                if (result)
                {
                    this.seek(word.length);
                }
                return result;
            }

            getReservedLiteralAndSeek(key : string, reviver : reviver_type = null) : any
            {
                const start_cursor = deepCopy(this.cursor);
                const reservedLiterals =
                [
                    "null",
                    "false",
                    "true"
                ];
                for (let i = 0; i < reservedLiterals.length; ++i)
                {
                    const reserved_literal = reservedLiterals[i];
                    if (this.isMatchAndSeek(reserved_literal))
                    {
                        const value = JSON.parse(reserved_literal);
                        return null === reviver ? value: reviver(key, value, start_cursor);
                    }
                }
            
                return undefined;
            }

            getStringAndSeek(key : string, reviver : reviver_type = null) : string
            {
                if ("\"" !== this.getChar())
                {
                    return undefined;
                }

                const start_cursor = deepCopy(this.cursor);
                const endless_string_exception =
                {
                    "&A": "error",
                    "message": "endless string",
                    "location": start_cursor
                };
                this.next();
                while(true)
                {
                    const current_cursor = deepCopy(this.cursor);
                    let char = this.ifEndThenThrow(endless_string_exception).getCharAndSeek();
                    if ("\"" === char)
                    {
                        break;
                    }
                    if ("\r" === char || "\n" === char)
                    {
                        throw {
                            "&A": "error",
                            "message": "missing string end  ( expected: '\"' before new line )",
                            "code": start_cursor
                        };
                    }
                    if ("\\" === char)
                    {
                        const trail_char = this.ifEndThenThrow(endless_string_exception).getCharAndSeek();
                        if ("\"\\/bfnrft".indexOf(trail_char) < 0)
                        {
                            if ("u" === trail_char)
                            {
                                const length = 4;
                                const hexCode = this.getSubStr(length).toLowerCase();
                                const illegal_u_escape_exception =
                                {
                                    "&A": "error",
                                    "message": "illegal escape ( expected 4 hex dicimal chars after '\\u' )",
                                    "code": current_cursor
                                };
                                if (hexCode.length < length)
                                {
                                    throw illegal_u_escape_exception;
                                }
                                const hex = "0123456789abcdef";
                                for(var i = 0; i < length; ++i)
                                {
                                    if (hex.indexOf(hexCode.substr(i, 1)) < 0)
                                    {
                                        throw illegal_u_escape_exception;
                                    }
                                }
                            }
                            else
                            {
                                throw {
                                    "&A": "error",
                                    "message": "illegal escape ( expected '\"', '\\', '/', 'b', 'f', 'n', 'f', 'r', 't', 'u' after '\\' )",
                                    "code": current_cursor
                                };
                            }
                        }
                    }
                }
                const value = JSON.parse(this.code.substr(start_cursor.i, this.cursor.i -start_cursor.i));
                return null === reviver ? value: reviver(key, value, start_cursor);
            }

            getNumberAndSeek(key : string, reviver : reviver_type = null) : string
            {
                const start_cursor = deepCopy(this.cursor);
                let char = this.getChar();
                if ("-" === char) // マイナスを受け付けるの最初のひと文字目だけ
                {
                    char = this.next().getChar();
                }
                if ("0" === char)
                {
                    //  0 始まりの場合は小数点以上の数値はもうそれ以上受け付けない
                    char = this.next().getChar();
                }
                else
                if (0 <= "123456789".indexOf(char))
                {
                    do
                    {
                        char = this.next().getChar();
                    }
                    while(0 <= "0123456789".indexOf(char));
                }
                else
                {
                    return undefined; // 数値ではないなにか
                }
                //  小数点以上の数値ここまで

                if ("." === char) // この位置でのみ小数点を受け付ける
                {
                    do
                    {
                        char = this.next().getChar();
                    }
                    while(0 <= "0123456789".indexOf(char));
                }

                if ("e" === char || "E" === char)
                {
                    char = this.next().getChar();
                    if ("+" === char || "-" === char)
                    {
                        char = this.next().getChar();
                    }
                    
                    if ("0123456789".indexOf(char) < 0)
                    {
                        return undefined;
                    }

                    do
                    {
                        char = this.next().getChar();
                    }
                    while(0 <= "0123456789".indexOf(char));
                }

                const value = JSON.parse(this.code.substr(start_cursor.i, this.cursor.i -start_cursor.i));
                return null === reviver ? value: reviver(key, value, start_cursor);
            }

            getValueAndSeek(key : string, reviver : reviver_type = null) : any
            {
                let result = undefined;
                const getValueMethods =
                [
                    () => this.getReservedLiteralAndSeek(key, reviver),
                    () => this.getStringAndSeek(key, reviver),
                    () => this.getNumberAndSeek(key, reviver),
                    () => this.getArayAndSeek(key, reviver),
                    () => this.getObjectAndSeek(key, reviver)
                ];
                for (let i = 0; i < getValueMethods.length && undefined === result; ++i)
                {
                    result = getValueMethods[i]();
                }
                return result;
            }

            getArayAndSeek(key : string, reviver : reviver_type = null) : any
            {
                if ("[" !== this.getChar())
                {
                    return undefined;
                }

                let result = [];
                const start_cursor = deepCopy(this.cursor);
                const endless_array_exception =
                {
                    "&A": "error",
                    "message": "endless array",
                    "code": start_cursor
                };
                this.cursor.location.codepath.push(key);
                if ("]" !== this.next().skipWhiteSpace().ifEndThenThrow(endless_array_exception).getChar())
                {
                    while(true)
                    {
                        let i = this.getValueAndSeek(result.length.toString(), reviver);
                        if (undefined === i)
                        {
                            throw {
                                "&A": "error",
                                "message": "unexpected array element",
                                "code": {
                                    "element": this.getSubStr(32),
                                    "cursor": this.cursor
                                }
                            };
                        }
                        result.push(i);
                
                        const char = this.skipWhiteSpace().ifEndThenThrow(endless_array_exception).getChar();
                        if ("]" === char)
                        {
                            break;
                        }
                        if ("," !== char)
                        {
                            throw {
                                "&A": "error",
                                "message": "unexpected charactor ( expected: ']' or ',' )",
                                "code": {
                                    "char": char,
                                    "cursor": this.cursor
                                }
                            };
                        }
                        this.next().skipWhiteSpace().ifEndThenThrow(endless_array_exception);
                    }
                }
                this.next();
                this.cursor.location.codepath.pop();

                return null === reviver ? result: reviver(key, result, start_cursor);
            }

            getObjectAndSeek(key : string, reviver : reviver_type = null) : any
            {
                if ("{" !== this.getChar())
                {
                    return undefined;
                }

                let result = {};
                const start_cursor = deepCopy(this.cursor);
                const endless_object_exception = {
                    "&A": "error",
                    "message": "endless object",
                    "code": start_cursor
                };
                this.cursor.location.codepath.push(key);
                if ("}" !== this.next().skipWhiteSpace().ifEndThenThrow(endless_object_exception).getChar())
                {
                    while(true)
                    {
                        let key = this.getStringAndSeek("", null);
                        if (undefined === key)
                        {
                            throw {
                                "&A": "error",
                                "message": "unexpected object name",
                                "code": {
                                    "element": this.getSubStr(32),
                                    "cursor": this.cursor
                                }
                            };
                        }
                        const separator = this.skipWhiteSpace().ifEndThenThrow(endless_object_exception).getChar();
                        if (":" !== separator)
                        {
                            throw {
                                "&A": "error",
                                "message": "unexpected charactor ( expected: ':' )",
                                "code": {
                                    "char": separator,
                                    "cursor": this.cursor
                                }
                            };
                        }

                        let value = this.next().skipWhiteSpace().ifEndThenThrow(endless_object_exception).getValueAndSeek(key, reviver);
                        if (undefined === value)
                        {
                            throw {
                                "&A": "error",
                                "message": "unexpected object value",
                                "code": {
                                    "element": this.getSubStr(32),
                                    "cursor": this.cursor
                                }
                            };
                        }
                        result[key] = value;
                        
                        const char = this.skipWhiteSpace().ifEndThenThrow(endless_object_exception).getChar();
                        if ("}" === char)
                        {
                            break;
                        }
                        if ("," !== char)
                        {
                            throw {
                                "&A": "error",
                                "message": "unexpected charactor ( expected: ']' or ',' )",
                                "code": {
                                    "char": char,
                                    "cursor": this.cursor
                                }
                            };
                        }
                        this.next().skipWhiteSpace().ifEndThenThrow(endless_object_exception);
                    }
                }
                this.next();
                this.cursor.location.codepath.pop();

                return null === reviver ? result: reviver(key, result, start_cursor);
            }

        }
    }

    export function parseFile(filepath : string, code : string) : object
    {
        const parser = new AmpJsonParser.AmpParseCode(new AmpCodeCursor(new AmpCodeLocation(filepath)), code);
        var codeLocationMap : { [name: string] : AmpCodeCursor } = {};
        const result = parser
            .skipWhiteSpace()
            .ifEndThenThrow
            ({
                "&A": "error",
                "message": "empty json",
                "code": filepath
            })
            .getValueAndSeek
            (
                "",
                (key, value, cursor) =>
                {
                    codeLocationMap
                    [
                        JSON.stringify
                        (
                            cursor.location.codepath.concat(key)
                        )
                    ]
                    = deepCopy(cursor);
                    return value;
                }
            );
        parser.skipWhiteSpace();
        if (!parser.isEnd())
        {
            throw {
                "&A": "error",
                "message": "unexpected charactor ( expected: End of File )",
                "code": {
                    "char": parser.getChar(),
                    "cursor": parser.cursor
                }
            };
        }
        return {
            "&A": "file",
            "code": result,
            "codeLocationMap": codeLocationMap
        };
    }

    class AmpPackage
    {
        name : string;
        version : AmpVersion;
        url : string;

        async get() :Promise<string>
        {
            return await httpGet(this.url);
        }
    }

    class AmpCache
    {
        static make_function_key(function_signature : object) : string
        {
            return JSON.stringify(function_signature);
        }
        static make_argument_key(args : object) : string
        {
            return JSON.stringify(args);
        }

        readonly result : string;
        readonly cost : number;
        lastAccess : Date;
        constructor(result : object, cost : number, now : Date)
        {
            this.result = JSON.stringify(result);
            this.cost = cost;
            this.lastAccess = now;
        }
    }

    export class AmpCacheOption
    {
        disabled : boolean = false;
    }

    export class AmpMachine // このクラスが抱えるデータはポータブルな状態にする方向で(環境ごとにビュアーを用意する羽目になるのも馬鹿馬鹿しいし)
    {
        version : AmpVersion;
        code : object[] = [];
        cacheOption : AmpCacheOption = new AmpCacheOption();
        cache : AmpCache[] = [];
        statement : object[] = [];
        profiling : object[] = [];
        footstamp : object[] = [];
        coverage : object[] = [];
        codeCursorMap : { [name: string] : AmpCodeCursor } = {};
        embedded : object = null;

        onEmbeddedLoaded : (() => void)[] = [];

        log : (text : string) => void = (text : string) => console.log(text);
        error : (text : string) => void = (text : string) => console.error(text);
            
        constructor(version : AmpVersion | null = null)
        {
            this.version = version;
            
            const filepath = "./accelang/syntax.json";
            setTimeout(async () => {
                this.embedded = parseFile(filepath, await httpGet(filepath));
                this.onEmbeddedLoaded.forEach(f => f());
                this.onEmbeddedLoaded = [];
            }, 0);
        }
        async waitEmbeddedLoaded() : Promise<void>
        {
            return new Promise<void>
            (
                (resolve) =>
                {
                    if (this.embedded)
                    {
                        resolve();
                    }
                    else
                    {
                        this.onEmbeddedLoaded.push(resolve);
                    }
                }
            );
        }

        makeError(message : string, code : object = null, codepath : string[] = null) : object
        {
            console.trace();
            this.error(message);
            console.log("load: " +JSON.stringify(codepath));
            return {
                "&A": "error",
                "message": message,
                "code": code,
                "cursor": codepath && this.codeCursorMap[JSON.stringify(codepath)]
            };
        }

        async get(pack : AmpPackage) : Promise<void>
        {
            this.load(pack.url, await pack.get());
        }

//    call(code : object) : object
//    {
//        const target = this.evaluate(code["target"]);
//        const argument = this.evaluate(code["argument"]);
//
//        
//    }

        async typeValidation(codepath : string[], code : object) : Promise<object>
        {
            await this.waitEmbeddedLoaded();
            let result : object = null;
            const type = code["&A"];
            if (undefined === type || null === type)
            {
                result = this.makeError
                (
                    "format error(missing type)",
                    code,
                    codepath
                );
            }
            else
            {
                switch(practicalTypeof(type))
                {
                case "string":
                    switch(type)
                    {
    //                case "call":
    //                    return call(code, context);
    
                    case "error":
                        //result = code;
                        break;
    
                    case "file":
                        //result = code["code"];
                        //objectAssign(this.codeCursorMap, code["codeLocationMap"]);
                        break;
    
                    default:
                        result = this.makeError
                        (
                            `uknown type error: ${type}`,
                            code,
                            codepath.concat("&A")
                        );
                    }
                    break;
                    
                case "object":
                    {
                        //const complex_type = accelang.evaluate(type);
                        break;
                    }
    
                default:
                    result = this.makeError
                    (
                        `format error(invalid type): ${practicalTypeof(type)}, ${JSON.stringify(type)}`,
                        code,
                        codepath.concat("&A")
                    );
                }
            }
            return result;
        }

        async loadCore(codepath : string[], code : object) : Promise<object>
        {
            await this.waitEmbeddedLoaded();
            //  この関数の役割は全てのコードおよびデータをコードからアクセス可能な状態にすること。
            //  シンタックスエラーの類いの検出はこの関数内で行ってしまう。
            //  エラーを検出しても可能な限り最後まで処理を行う。
            //  この関数では例えそれが定数であっても評価は一切しない。(というかこの関数の処理が完了するまでは定数を評価する為に必要なコードやデータがアクセス可能な状態になっている保証がない。)
    
            let typeError = await this.typeValidation(codepath, code);
            if (typeError)
            {
                return typeError;
            }

            let result = code;
            const type = code["&A"];
            switch(practicalTypeof(type))
            {
            case "string":
                switch(type)
                {
//                case "call":
//                    return call(code, context);
                case "file":
                    result = code["code"];
                    objectAssign(this.codeCursorMap, code["codeLocationMap"]);
                    break;
                }
                break;
                
            case "object":
                {
                    //const complex_type = accelang.evaluate(type);
                    break;
                }
            }
            return result;
        }
    
        async preload(filepath : string, code : string) : Promise<object>
        {
            await this.waitEmbeddedLoaded();
            //  ここでは function が使える状態にしさえすればいいので load よりは少ない処理で済ませられるかもしれないがとりあえずいまは load に丸投げ。
            return await this.loadCore
            (
                [""],
                parseFile(filepath, code)
            );
        }
        async preprocess(code : object, _context : AmpMachine = null) : Promise<object>
        {
            await this.waitEmbeddedLoaded();
            return code;
        }
    
        async load(filepath : string, code : string) : Promise<AmpMachine>
        {
            await this.waitEmbeddedLoaded();
            this.code.push
            (
                await this.loadCore
                (
                    [""],
                    await this.preprocess
                    (
                        await this.preload(filepath, code),
                        this
                    )
                )
            );
            return this;
        }
        async execute() : Promise<object>
        {
            return await this.evaluate(this.code);
        }
        async evaluate(code : object) : Promise<object>
        {
            await this.waitEmbeddedLoaded();

            if ("array" === practicalTypeof(code))
            {
                return await Promise.all((<Array<object>>code).map(async i => await this.evaluate(i)));
            }
    
            const type = code["&A"];
            if (undefined === type || null === type)
            {
                return this.makeError("format error(missing type)", code);
            }
            else
            {
                switch(typeof(type))
                {
                case "string":
                    switch(type)
                    {
    //                case "call":
    //                    return call(code, context);
    
                    case "error":
                        return code;
    
                    default:
                        return this.makeError(`uknown type error: ${type}`, code);
                    }
                    
                case "object":
                    {
                        //const complex_type = accelang.evaluate(type);
                        break;
                    }
    
                default:
                    return this.makeError(`format error(invalid type): ${typeof(type)}, ${JSON.stringify(type)}`, code);
                }
            }
            return this.makeError("intenal error", code);
        }
    }
}
