'use strict';

module accelang
{
    export var log : (text : string) => void = (text : string) => console.log(text);
    export var error : (text : string) => void = (text : string) => console.error(text);

    function make_error(message : string) : object
    {
        accelang.error(message);
        return {
            "&A": "error",
            "message":message,
        };
    }
    
//    export function call(code : object, context : object) : any
//    {
//        const target = evaluate(code["target"], context);
//        const argument = evaluate(code["argument"], context);
//
//        
//    }

    export function load(code : object) : any
    {
        //  この関数の役割は全てのコードおよびデータをコードからアクセス可能な状態にすること。
        //  シンタックスエラーの類いの検出はこの関数内で行ってしまう。
        //  エラーを検出しても可能な限り最後まで処理を行う。
        //  この関数では例えそれが定数であっても評価は一切しない。(というかこの関数の処理が完了するまでは定数を評価する為に必要なコードやデータがアクセス可能な状態になっている保証がない。)

        const type = code["&A"];
        if (undefined === type || null === type)
        {
            return make_error("format error(missing type)");
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

                default:
                    return make_error(`uknown type error: ${type}`);
                }
                
            case "object":
                {
                    //const complex_type = accelang.evaluate(type);
                    break;
                }

            default:
                return make_error(`format error(invalid type): ${typeof(type)}, ${JSON.stringify(type)}`);
            }
        }
        return make_error("intenal error");
    }
    
    export function evaluate(code : object, context : object = null) : any
    {
        if (null === code)
        {
            return null;
        }
        if (null === context)
        {
            code = context = load(code);
        }
        const type = code["&A"];
        if (undefined === type || null === type)
        {
            return make_error("format error(missing type)");
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

                default:
                    return make_error(`uknown type error: ${type}`);
                }
                
            case "object":
                {
                    //const complex_type = accelang.evaluate(type);
                    break;
                }

            default:
                return make_error(`format error(invalid type): ${typeof(type)}, ${JSON.stringify(type)}`);
            }
        }
        return make_error("intenal error");
    }
}
