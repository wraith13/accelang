'use strict';

module accelang
{
    export function http_get(url : string, callback : (response_body : string)=>void) :void
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
        constructor
        (
            readonly filepath : string,
            readonly line : number = 1,
            readonly row : number = 1
        )
        {
        }
    }

    export function parseCode(location : AmpCodeLocation, code : string) : object
    {
        let line = location.line;
        let row = location.row;

        return JSON.parse(code);
    }

    class AmpPackage
    {
        name : string;
        version : AmpVersion;
        url : string;

        get(callback : (code : string)=>void) :void
        {
            http_get
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

        make_error(message : string, code : object = null) : object
        {
            console.trace();
            this.error(message);
            return {
                "&A": "error",
                "message":message,
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

        load_core(code : object) : object
        {
            //  この関数の役割は全てのコードおよびデータをコードからアクセス可能な状態にすること。
            //  シンタックスエラーの類いの検出はこの関数内で行ってしまう。
            //  エラーを検出しても可能な限り最後まで処理を行う。
            //  この関数では例えそれが定数であっても評価は一切しない。(というかこの関数の処理が完了するまでは定数を評価する為に必要なコードやデータがアクセス可能な状態になっている保証がない。)
    
            let result = { };
            const type = code["&A"];
            if (undefined === type || null === type)
            {
                result = this.make_error("format error(missing type)", code);
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
                        result = this.make_error(`uknown type error: ${type}`, code);
                    }
                    break;
                    
                case "object":
                    {
                        //const complex_type = accelang.evaluate(type);
                        break;
                    }
    
                default:
                    result = this.make_error(`format error(invalid type): ${typeof(type)}, ${JSON.stringify(type)}`, code);
                }
            }
            return result;
        }
    
        preload(filepath : string, code : string) : object
        {
            //  ここでは function が使える状態にしさえすればいいので load よりは少ない処理で済ませられるかもしれないがとりあえずいまは load に丸投げ。
            return this.load_core
            (
                parseCode(new AmpCodeLocation(filepath), code)
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
                this.load_core
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
                return this.make_error("format error(missing type)", code);
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
                        return this.make_error(`uknown type error: ${type}`, code);
                    }
                    
                case "object":
                    {
                        //const complex_type = accelang.evaluate(type);
                        break;
                    }
    
                default:
                    return this.make_error(`format error(invalid type): ${typeof(type)}, ${JSON.stringify(type)}`, code);
                }
            }
            return this.make_error("intenal error", code);
        }
    }
}
