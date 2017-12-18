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

    export function httpGet(url : string, callback : (response_body : string)=>void) :void
    {
        const request = (<any>window).XMLHttpRequest ? new XMLHttpRequest(): new ActiveXObject("Microsoft.XMLHTTP");
    
        request.open('GET', url, true);
        request.onreadystatechange = () =>
        {
            if (4 === request.readyState && 200 === request.status)
            {
                callback(request.responseText);
            }
        };
        request.send(null);
    }

    export function stacktrace() : string
    {
        //  copy from https://stackoverflow.com/questions/591857/how-can-i-get-a-javascript-stack-trace-when-i-throw-an-exception 
        function st2(f)
        {
            return !f ? [] : st2(f.caller).concat([f.toString().split('(')[0].substring(9) + '(' + f.arguments.join(',') + ')']);
        }
        return st2(arguments.callee.caller);
    }

    export function deepCopy<T>(source : T) : T
    {
        return JSON.parse(JSON.stringify(source));
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

    class AmpCodeLocation
    {
        filepath : string;
        line : number;
        row : number;

        constructor
        (
            filepath : string,
            line : number = 1,
            row : number = 1
        )
        {
            this.filepath = filepath;
            this.line = line;
            this.row = row;
        }
    }

    class AmpParseCodeCursor
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
    class AmpParseCode
    {
        cursor : AmpParseCodeCursor;
        code : string;

        constructor
        (
            cursor : AmpParseCodeCursor,
            code : string
        )
        {
            this.cursor = cursor;
            this.code =code;
        }

        getChar() : string
        {
            return this.code.charAt(this.cursor.i);
        }
        getSubStr(length : number) : string
        {
            return this.code.substr(this.cursor.i, length);
        }

        next()
        {
            assert(this.cursor.i < this.code.length);

            const char = this.getChar();
            if ("\r" === char || "\n" === char)
            {
                ++this.cursor.location.line;
                this.cursor.location.row = 0;
                ++this.cursor.i;
                const trail_char = this.getChar();
                if (("\r" === trail_char || "\n" === trail_char) && trail_char !== char) {
                    ++this.cursor.i;
                }
            } else {
                ++this.cursor.location.row;
                ++this.cursor.i;
            }
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

        getStringAndSeek() : string
        {
            if ("\"" !== this.getChar())
            {
                return null;
            }

            const start_cursor = deepCopy(this.cursor);
            this.next();
            
            while(!this.isEnd())
            {
                const char = this.getChar();
                this.next();
                if ("\"" === char)
                {
                    return JSON.parse(this.code.substr(start_cursor.i, this.cursor.i -start_cursor.i));
                }
                if ("\\" === char && !this.isEnd())
                {
                    this.next();
                }
            }

            throw {
                "&A": "error",
                "message": "endless string",
                "code": start_cursor
            };
        }

        getNumberAndSeek() : string
        {
            let char = this.getChar();
            if ("-0123456789".indexOf(char) < 0)
            {
                return null;
            }

            const start_cursor = deepCopy(this.cursor);

            if ("-" === char) // マイナスを受け付けるの最初のひと文字目だけ
            {
                this.next();
                char = this.getChar();
            }

            if ("0" === char)
            {
                //  0 始まりの場合は小数点以上の数値はもうそれ以上受け付けない
                this.next();
                char = this.getChar();
            }
            else
            if (0 <= "123456789".indexOf(char))
            {
                do
                {
                    this.next();
                    char = this.getChar();
                }
                while(0 <= "0123456789".indexOf(char));
            }
            else
            {
                return null; // 数値ではないなにか
            }
            //  小数点以上の数値ここまで

            if ("." === char) // この位置でのみ小数点を受け付ける
            {
                do
                {
                    this.next();
                    char = this.getChar();
                }
                while(0 <= "0123456789".indexOf(char));
            }

            if ("e" === char || "E" === char)
            {
                this.next();
                char = this.getChar();
                if ("+" === char || "-" === char)
                {
                    this.next();
                    char = this.getChar();
                }
                
                if ("0123456789".indexOf(char) < 0)
                {
                    return null;
                }

                do
                {
                    this.next();
                    char = this.getChar();
                }
                while(0 <= "0123456789".indexOf(char));
            }

            return JSON.parse(this.code.substr(start_cursor.i, this.cursor.i -start_cursor.i));
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

        getValueAndSeek() : any
        {
            const reservedLiterals =
            [
                "null",
                "false",
                "true"
            ];
            for (let i = 0; i < reservedLiterals.length; ++i) {
                const reserved_literal = reservedLiterals[i];
                if (this.isMatchAndSeek(reserved_literal))
                {
                    return JSON.parse(reserved_literal);
                }
            }

            const stringValue = this.getStringAndSeek();
            if (null !== stringValue)
            {
                return stringValue;
            }

            const numberValue = this.getNumberAndSeek();
            if (null !== numberValue)
            {
                return numberValue;
            }
            
            assert(false); // NYI
        }

        getArayAndSeek() : any
        {
            if ("[" !== this.getChar())
            {
                return null;
            }

            let result = [];
            const start_cursor = deepCopy(this.cursor);
            this.next();
            
            while(!this.isEnd())
            {
                assert(false); // NYI

                this.skipWhiteSpace();
                let i = this.getValueAndSeek();

                const char = this.getChar();
                this.next();
                if ("]" === char)
                {
                    return result;
                }
            }

            throw {
                "&A": "error",
                "message": "endless array",
                "code": start_cursor
            };
        }

        getObjectAndSeek() : any
        {
            if ("{" !== this.getChar())
            {
                return null;
            }

            const start_cursor = deepCopy(this.cursor);
            this.next();
            
            while(!this.isEnd())
            {
                assert(false); // NYI

                const char = this.getChar();
                this.next();
                if ("}" === char)
                {
                    return JSON.parse(this.code.substr(start_cursor.i, this.cursor.i -start_cursor.i));
                }
            }

            throw {
                "&A": "error",
                "message": "endless object",
                "code": start_cursor
            };
        }

    }

    export function parseCode(_cursor : AmpParseCodeCursor, code : string) : object
    {
        return JSON.parse(code);
    }
    export function parseFile(filepath : string, code : string) : object
    {
        return parseCode(new AmpParseCodeCursor(new AmpCodeLocation(filepath)), code);
    }

    class AmpPackage
    {
        name : string;
        version : AmpVersion;
        url : string;

        get(callback : (code : string)=>void) :void
        {
            httpGet
            (
                this.url,
                (response_body) => callback(response_body)
            );
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

        log : (text : string) => void = (text : string) => console.log(text);
        error : (text : string) => void = (text : string) => console.error(text);
            
        constructor(version : AmpVersion | null = null)
        {
            this.version = version;
        }

        makeError(message : string, code : object = null) : object
        {
            console.trace();
            this.error(message);
            return {
                "&A": "error",
                "message": message,
                "code": code
            };
        }

        get(pack : AmpPackage) : void
        {
            pack.get
            (
                code => this.load
                (
                    pack.url,
                    code
                )
            );
        }

//    call(code : object) : object
//    {
//        const target = this.evaluate(code["target"]);
//        const argument = this.evaluate(code["argument"]);
//
//        
//    }

        loadCore(code : object) : object
        {
            //  この関数の役割は全てのコードおよびデータをコードからアクセス可能な状態にすること。
            //  シンタックスエラーの類いの検出はこの関数内で行ってしまう。
            //  エラーを検出しても可能な限り最後まで処理を行う。
            //  この関数では例えそれが定数であっても評価は一切しない。(というかこの関数の処理が完了するまでは定数を評価する為に必要なコードやデータがアクセス可能な状態になっている保証がない。)
    
            let result = { };
            const type = code["&A"];
            if (undefined === type || null === type)
            {
                result = this.makeError("format error(missing type)", code);
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
                        result = code;
                        break;
    
                    default:
                        result = this.makeError(`uknown type error: ${type}`, code);
                    }
                    break;
                    
                case "object":
                    {
                        //const complex_type = accelang.evaluate(type);
                        break;
                    }
    
                default:
                    result = this.makeError(`format error(invalid type): ${typeof(type)}, ${JSON.stringify(type)}`, code);
                }
            }
            return result;
        }
    
        preload(filepath : string, code : string) : object
        {
            //  ここでは function が使える状態にしさえすればいいので load よりは少ない処理で済ませられるかもしれないがとりあえずいまは load に丸投げ。
            return this.loadCore
            (
                parseFile(filepath, code)
            );
        }
        preprocess(code : object, _context : AmpMachine = null) : object
        {
            return code;
        }
    
        load(filepath : string, code : string) : AmpMachine
        {
            this.code.push
            (
                this.loadCore
                (
                    this.preprocess
                    (
                        this.preload(filepath, code),
                        this
                    )
                )
            );
            return this;
        }
        execute() : object
        {
            return this.evaluate(this.code);
        }
        evaluate(code : object) : object
        {
            if (Array.isArray(code))
            {
                return code.map(i => this.evaluate(i));
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
