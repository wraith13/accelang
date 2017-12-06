'use strict';

module accelang
{
    export function http_get(url : string, callback : (response_body : string)=>void) :void
    {
        var request = (<any>window).XMLHttpRequest ? new XMLHttpRequest(): new ActiveXObject("Microsoft.XMLHTTP");
    
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
        
    export var log : (text : string) => void = (text : string) => console.log(text);
    export var error : (text : string) => void = (text : string) => console.error(text);

    class AmpVersion
    {
        major : string;
        minor : string;
        build : string;
    }
    class AmpPackage
    {
        name : string;
        version : AmpVersion;
        url : string;

        get(callback : (code : object)=>void) :void
        {
            http_get
            (
                this.url,
                (response_body) => callback(JSON.parse(response_body))
            );
        }
        
    }

    class AmpContext // このクラスが抱えるデータはポータブルな状態にする方向で(環境ごとにビュアーを用意する羽目になるのも馬鹿馬鹿しいし)
    {
        code : object[] = [];
        cache : object[] = [];
        statement : object[] = [];
        profiling : object[] = [];
        footstamp : object[] = [];
        coverage : object[] = [];

        get(pack : AmpPackage) : void
        {
            pack.get
            (
                code => load(code)
            );
        }
        load(code : object) : void
        {
            this.code.push(load(preprocess(preload(code), this)));
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
                return make_error("format error(missing type)", code);
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
                        return make_error(`uknown type error: ${type}`, code);
                    }
                    
                case "object":
                    {
                        //const complex_type = accelang.evaluate(type);
                        break;
                    }
    
                default:
                    return make_error(`format error(invalid type): ${typeof(type)}, ${JSON.stringify(type)}`, code);
                }
            }
            return make_error("intenal error", code);
        }
    }

    function make_error(message : string, code : object = null) : object
    {
        console.trace();
        accelang.error(message);
        return {
            "&A": "error",
            "message":message,
            "code": code
        };
    }
    
//    export function call(code : object, context : object) : object
//    {
//        const target = evaluate(code["target"], context);
//        const argument = evaluate(code["argument"], context);
//
//        
//    }

    export function preload(code : object) : object
    {
        //  ここでは function が使える状態にしさえすればいいので load よりは少ない処理で済ませられるかもしれないがとりあえずいまは load に丸投げ。
        return load(code);
    }
    export function preprocess(code : object, _context : AmpContext = null) : object
    {
        return code;
    }

    export function load(code : object) : object
    {
        //  この関数の役割は全てのコードおよびデータをコードからアクセス可能な状態にすること。
        //  シンタックスエラーの類いの検出はこの関数内で行ってしまう。
        //  エラーを検出しても可能な限り最後まで処理を行う。
        //  この関数では例えそれが定数であっても評価は一切しない。(というかこの関数の処理が完了するまでは定数を評価する為に必要なコードやデータがアクセス可能な状態になっている保証がない。)

        var result = { };
        const type = code["&A"];
        if (undefined === type || null === type)
        {
            result = make_error("format error(missing type)", code);
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
                    result = make_error(`uknown type error: ${type}`, code);
                }
                break;
                
            case "object":
                {
                    //const complex_type = accelang.evaluate(type);
                    break;
                }

            default:
                result = make_error(`format error(invalid type): ${typeof(type)}, ${JSON.stringify(type)}`, code);
            }
        }
        return result;
    }

    export function evaluate(code : object) : object
    {
        var context = new AmpContext();
        context.load(code);
        return context.execute();
    }
}
