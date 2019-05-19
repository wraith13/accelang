'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var accelang;
(function (accelang) {
    function assert(condition) {
        if (!condition) {
            throw {
                "&A": "error",
                "message": "internal accelang error",
                "code": stacktrace()
            };
        }
    }
    function practicalTypeof(obj) {
        if (undefined === obj) {
            return "undefined";
        }
        if (null === obj) {
            return "null";
        }
        if ("[object Array]" === Object.prototype.toString.call(obj)) {
            return "array";
        }
        return typeof obj;
    }
    accelang.practicalTypeof = practicalTypeof;
    function httpGet(url) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                const request = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
                request.open('GET', url, true);
                request.onreadystatechange = () => {
                    if (4 === request.readyState && 200 === request.status) {
                        resolve(request.responseText);
                    }
                };
                request.send(null);
            }));
        });
    }
    accelang.httpGet = httpGet;
    function stacktrace() {
        return new Error().stack;
    }
    accelang.stacktrace = stacktrace;
    function debug_out_json(data) {
        console.log(JSON.stringify(data));
    }
    accelang.debug_out_json = debug_out_json;
    function deepCopy(source) {
        return JSON.parse(JSON.stringify(source));
    }
    accelang.deepCopy = deepCopy;
    function objectAssign(target, ...sources) {
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
    accelang.objectAssign = objectAssign;
    class AmpVersion {
        constructor(major, minor, build) {
            this.major = major;
            this.minor = minor;
            this.build = build;
        }
        isCompatible(target) {
            return this.major === target.major &&
                (parseInt(this.minor, 10) < parseInt(target.minor, 10) ||
                    (this.minor === target.minor &&
                        parseInt(this.build, 10) <= parseInt(target.build, 10)));
        }
    }
    class AmpCodeLocation {
        constructor(filepath, line = 1, row = 1, codepath = []) {
            this.filepath = filepath;
            this.line = line;
            this.row = row;
            this.codepath = codepath;
        }
        nextLine() {
            this.line++;
            this.row = 1;
            return this;
        }
    }
    accelang.AmpCodeLocation = AmpCodeLocation;
    class AmpCodeCursor {
        constructor(location, i = 0) {
            this.location = location;
            this.i = i;
        }
    }
    accelang.AmpCodeCursor = AmpCodeCursor;
    let AmpJsonParser;
    (function (AmpJsonParser) {
        class AmpParseCode {
            constructor(cursor, code) {
                this.cursor = cursor;
                this.code = code;
            }
            getChar() {
                return this.code.charAt(this.cursor.i);
            }
            getCharAndSeek() {
                const char = this.getChar();
                this.next();
                return char;
            }
            getSubStr(length) {
                return this.code.substr(this.cursor.i, length);
            }
            next() {
                assert(this.cursor.i < this.code.length);
                const char = this.getChar();
                ++this.cursor.i;
                if ("\r" === char || "\n" === char) {
                    this.cursor.location.nextLine();
                    const trail_char = this.getChar();
                    if (("\r" === trail_char || "\n" === trail_char) && trail_char !== char) {
                        ++this.cursor.i;
                    }
                }
                else {
                    ++this.cursor.location.row;
                }
                return this;
            }
            seek(length) {
                assert(this.cursor.i + length <= this.code.length);
                assert(this.getSubStr(length).indexOf("\r") < 0);
                assert(this.getSubStr(length).indexOf("\n") < 0);
                const aim = this.cursor.i + length;
                while (this.cursor.i < aim) {
                    this.next();
                }
                assert(this.cursor.i === aim);
                return this;
            }
            isWhiteSpace() {
                return 0 <= " \t\r\n".indexOf(this.getChar());
            }
            skipWhiteSpace() {
                while (!this.isEnd() && this.isWhiteSpace()) {
                    this.next();
                }
                return this;
            }
            isEnd() {
                return this.code.length <= this.cursor.i;
            }
            ifEndThenThrow(exception) {
                if (this.isEnd()) {
                    throw exception;
                }
                return this;
            }
            isMatch(word) {
                assert(word.indexOf("\r") < 0);
                assert(word.indexOf("\n") < 0);
                return this.getSubStr(word.length) === word;
            }
            isMatchAndSeek(word) {
                const result = this.isMatch(word);
                if (result) {
                    this.seek(word.length);
                }
                return result;
            }
            getReservedLiteralAndSeek(key, reviver = null) {
                const start_cursor = deepCopy(this.cursor);
                const reservedLiterals = [
                    "null",
                    "false",
                    "true"
                ];
                for (let i = 0; i < reservedLiterals.length; ++i) {
                    const reserved_literal = reservedLiterals[i];
                    if (this.isMatchAndSeek(reserved_literal)) {
                        const value = JSON.parse(reserved_literal);
                        return null === reviver ? value : reviver(key, value, start_cursor);
                    }
                }
                return undefined;
            }
            getStringAndSeek(key, reviver = null) {
                if ("\"" !== this.getChar()) {
                    return undefined;
                }
                const start_cursor = deepCopy(this.cursor);
                const endless_string_exception = {
                    "&A": "error",
                    "message": "endless string",
                    "location": start_cursor
                };
                this.next();
                while (true) {
                    const current_cursor = deepCopy(this.cursor);
                    let char = this.ifEndThenThrow(endless_string_exception).getCharAndSeek();
                    if ("\"" === char) {
                        break;
                    }
                    if ("\r" === char || "\n" === char) {
                        throw {
                            "&A": "error",
                            "message": "missing string end  ( expected: '\"' before new line )",
                            "code": start_cursor
                        };
                    }
                    if ("\\" === char) {
                        const trail_char = this.ifEndThenThrow(endless_string_exception).getCharAndSeek();
                        if ("\"\\/bfnrft".indexOf(trail_char) < 0) {
                            if ("u" === trail_char) {
                                const length = 4;
                                const hexCode = this.getSubStr(length).toLowerCase();
                                const illegal_u_escape_exception = {
                                    "&A": "error",
                                    "message": "illegal escape ( expected 4 hex dicimal chars after '\\u' )",
                                    "code": current_cursor
                                };
                                if (hexCode.length < length) {
                                    throw illegal_u_escape_exception;
                                }
                                const hex = "0123456789abcdef";
                                for (var i = 0; i < length; ++i) {
                                    if (hex.indexOf(hexCode.substr(i, 1)) < 0) {
                                        throw illegal_u_escape_exception;
                                    }
                                }
                            }
                            else {
                                throw {
                                    "&A": "error",
                                    "message": "illegal escape ( expected '\"', '\\', '/', 'b', 'f', 'n', 'f', 'r', 't', 'u' after '\\' )",
                                    "code": current_cursor
                                };
                            }
                        }
                    }
                }
                const value = JSON.parse(this.code.substr(start_cursor.i, this.cursor.i - start_cursor.i));
                return null === reviver ? value : reviver(key, value, start_cursor);
            }
            getNumberAndSeek(key, reviver = null) {
                const start_cursor = deepCopy(this.cursor);
                let char = this.getChar();
                if ("-" === char) // マイナスを受け付けるの最初のひと文字目だけ
                 {
                    char = this.next().getChar();
                }
                if ("0" === char) {
                    //  0 始まりの場合は小数点以上の数値はもうそれ以上受け付けない
                    char = this.next().getChar();
                }
                else if (0 <= "123456789".indexOf(char)) {
                    do {
                        char = this.next().getChar();
                    } while (0 <= "0123456789".indexOf(char));
                }
                else {
                    return undefined; // 数値ではないなにか
                }
                //  小数点以上の数値ここまで
                if ("." === char) // この位置でのみ小数点を受け付ける
                 {
                    do {
                        char = this.next().getChar();
                    } while (0 <= "0123456789".indexOf(char));
                }
                if ("e" === char || "E" === char) {
                    char = this.next().getChar();
                    if ("+" === char || "-" === char) {
                        char = this.next().getChar();
                    }
                    if ("0123456789".indexOf(char) < 0) {
                        return undefined;
                    }
                    do {
                        char = this.next().getChar();
                    } while (0 <= "0123456789".indexOf(char));
                }
                const value = JSON.parse(this.code.substr(start_cursor.i, this.cursor.i - start_cursor.i));
                return null === reviver ? value : reviver(key, value, start_cursor);
            }
            getValueAndSeek(key, reviver = null) {
                let result = undefined;
                const getValueMethods = [
                    () => this.getReservedLiteralAndSeek(key, reviver),
                    () => this.getStringAndSeek(key, reviver),
                    () => this.getNumberAndSeek(key, reviver),
                    () => this.getArayAndSeek(key, reviver),
                    () => this.getObjectAndSeek(key, reviver)
                ];
                for (let i = 0; i < getValueMethods.length && undefined === result; ++i) {
                    result = getValueMethods[i]();
                }
                return result;
            }
            getArayAndSeek(key, reviver = null) {
                if ("[" !== this.getChar()) {
                    return undefined;
                }
                let result = [];
                const start_cursor = deepCopy(this.cursor);
                const endless_array_exception = {
                    "&A": "error",
                    "message": "endless array",
                    "code": start_cursor
                };
                this.cursor.location.codepath.push(key);
                if ("]" !== this.next().skipWhiteSpace().ifEndThenThrow(endless_array_exception).getChar()) {
                    while (true) {
                        let i = this.getValueAndSeek(result.length.toString(), reviver);
                        if (undefined === i) {
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
                        if ("]" === char) {
                            break;
                        }
                        if ("," !== char) {
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
                return null === reviver ? result : reviver(key, result, start_cursor);
            }
            getObjectAndSeek(key, reviver = null) {
                if ("{" !== this.getChar()) {
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
                if ("}" !== this.next().skipWhiteSpace().ifEndThenThrow(endless_object_exception).getChar()) {
                    while (true) {
                        let key = this.getStringAndSeek("", null);
                        if (undefined === key) {
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
                        if (":" !== separator) {
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
                        if (undefined === value) {
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
                        if ("}" === char) {
                            break;
                        }
                        if ("," !== char) {
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
                return null === reviver ? result : reviver(key, result, start_cursor);
            }
        }
        AmpJsonParser.AmpParseCode = AmpParseCode;
    })(AmpJsonParser || (AmpJsonParser = {}));
    function parseFile(filepath, code) {
        const parser = new AmpJsonParser.AmpParseCode(new AmpCodeCursor(new AmpCodeLocation(filepath)), code);
        var codeLocationMap = {};
        const result = parser
            .skipWhiteSpace()
            .ifEndThenThrow({
            "&A": "error",
            "message": "empty json",
            "code": filepath
        })
            .getValueAndSeek("", (key, value, cursor) => {
            codeLocationMap[JSON.stringify(cursor.location.codepath.concat(key))]
                = deepCopy(cursor);
            return value;
        });
        parser.skipWhiteSpace();
        if (!parser.isEnd()) {
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
    accelang.parseFile = parseFile;
    class AmpPackage {
        get() {
            return __awaiter(this, void 0, void 0, function* () {
                return yield httpGet(this.url);
            });
        }
    }
    class AmpCache {
        static make_function_key(function_signature) {
            return JSON.stringify(function_signature);
        }
        static make_argument_key(args) {
            return JSON.stringify(args);
        }
        constructor(result, cost, now) {
            this.result = JSON.stringify(result);
            this.cost = cost;
            this.lastAccess = now;
        }
    }
    class AmpCacheOption {
        constructor() {
            this.disabled = false;
        }
    }
    accelang.AmpCacheOption = AmpCacheOption;
    class AmpMachine // このクラスが抱えるデータはポータブルな状態にする方向で(環境ごとにビュアーを用意する羽目になるのも馬鹿馬鹿しいし)
     {
        constructor(version = null) {
            this.code = [];
            this.cacheOption = new AmpCacheOption();
            this.cache = [];
            this.statement = [];
            this.profiling = [];
            this.footstamp = [];
            this.coverage = [];
            this.codeCursorMap = {};
            this.embedded = null;
            this.log = (text) => console.log(text);
            this.error = (text) => console.error(text);
            this.version = version;
        }
        init() {
            return __awaiter(this, void 0, void 0, function* () {
                const filepath = "./accelang/syntax.json";
                this.embedded = parseFile(filepath, yield httpGet(filepath));
            });
        }
        makeError(message, code = null, codepath = null) {
            console.trace();
            this.error(message);
            console.log("load: " + JSON.stringify(codepath));
            return {
                "&A": "error",
                "message": message,
                "code": code,
                "cursor": codepath && this.codeCursorMap[JSON.stringify(codepath)]
            };
        }
        get(pack) {
            return __awaiter(this, void 0, void 0, function* () {
                this.load(pack.url, yield pack.get());
            });
        }
        //    call(code : object) : object
        //    {
        //        const target = this.evaluate(code["target"]);
        //        const argument = this.evaluate(code["argument"]);
        //
        //        
        //    }
        typeValidation(codepath, code) {
            return __awaiter(this, void 0, void 0, function* () {
                let result = null;
                const type = code["&A"];
                if (undefined === type || null === type) {
                    result = this.makeError("format error(missing type)", code, codepath);
                }
                else {
                    switch (practicalTypeof(type)) {
                        case "string":
                            switch (type) {
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
                                    result = this.makeError(`uknown type error: ${type}`, code, codepath.concat("&A"));
                            }
                            break;
                        case "object":
                            {
                                //const complex_type = accelang.evaluate(type);
                                break;
                            }
                        default:
                            result = this.makeError(`format error(invalid type): ${practicalTypeof(type)}, ${JSON.stringify(type)}`, code, codepath.concat("&A"));
                    }
                }
                return result;
            });
        }
        loadCore(codepath, code) {
            return __awaiter(this, void 0, void 0, function* () {
                //  この関数の役割は全てのコードおよびデータをコードからアクセス可能な状態にすること。
                //  シンタックスエラーの類いの検出はこの関数内で行ってしまう。
                //  エラーを検出しても可能な限り最後まで処理を行う。
                //  この関数では例えそれが定数であっても評価は一切しない。(というかこの関数の処理が完了するまでは定数を評価する為に必要なコードやデータがアクセス可能な状態になっている保証がない。)
                let typeError = yield this.typeValidation(codepath, code);
                if (typeError) {
                    return typeError;
                }
                let result = code;
                const type = code["&A"];
                switch (practicalTypeof(type)) {
                    case "string":
                        switch (type) {
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
            });
        }
        preload(filepath, code) {
            return __awaiter(this, void 0, void 0, function* () {
                //  ここでは function が使える状態にしさえすればいいので load よりは少ない処理で済ませられるかもしれないがとりあえずいまは load に丸投げ。
                return yield this.loadCore([""], parseFile(filepath, code));
            });
        }
        preprocess(code, _context = null) {
            return __awaiter(this, void 0, void 0, function* () {
                return code;
            });
        }
        load(filepath, code) {
            return __awaiter(this, void 0, void 0, function* () {
                this.code.push(yield this.loadCore([""], yield this.preprocess(yield this.preload(filepath, code), this)));
                return this;
            });
        }
        execute() {
            return __awaiter(this, void 0, void 0, function* () {
                return yield this.evaluate(this.code);
            });
        }
        evaluate(code) {
            return __awaiter(this, void 0, void 0, function* () {
                if ("array" === practicalTypeof(code)) {
                    return yield Promise.all(code.map((i) => __awaiter(this, void 0, void 0, function* () { return yield this.evaluate(i); })));
                }
                const type = code["&A"];
                if (undefined === type || null === type) {
                    return this.makeError("format error(missing type)", code);
                }
                else {
                    switch (typeof (type)) {
                        case "string":
                            switch (type) {
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
                            return this.makeError(`format error(invalid type): ${typeof (type)}, ${JSON.stringify(type)}`, code);
                    }
                }
                return this.makeError("intenal error", code);
            });
        }
    }
    accelang.AmpMachine = AmpMachine;
})(accelang || (accelang = {}));
//# sourceMappingURL=accelang.js.map