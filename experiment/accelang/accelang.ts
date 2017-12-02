'use strict';

module accelang
{
    export var log : (text : string) => void = (text : string) => console.log(text);
    export var error : (text : string) => void = (text : string) => console.error(text);

    class Context // このクラスが抱えるデータはポータブルな状態にする方向で(環境ごとにビュアーを用意する羽目になるのも馬鹿馬鹿しいし)
    {
        code :object;
        cache : object[];
        statement : object[];
        profiling : object[];
        footstamp : object[];
        coverage : object[];
    }

    function make_error(message : string, code : object = null) : object
    {
        accelang.error(message);
        return {
            "&A": "error",
            "message":message,
            "code": code
        };
    }
    
//    export function call(code : object, context : object) : any
//    {
//        const target = evaluate(code["target"], context);
//        const argument = evaluate(code["argument"], context);
//
//        
//    }

    export function preload(code : object) : any
    {
        //  ここでは function が使える状態にしさえすればいいので load よりは少ない処理で済ませられるかもしれないがとりあえずいまは load に丸投げ。
        return load(code);
    }
    export function preprocess(code : object, _context : Context = null) : any
    {
        return code;
    }

    export function load(code : object) : any
    {
        //  この関数の役割は全てのコードおよびデータをコードからアクセス可能な状態にすること。
        //  シンタックスエラーの類いの検出はこの関数内で行ってしまう。
        //  エラーを検出しても可能な限り最後まで処理を行う。
        //  この関数では例えそれが定数であっても評価は一切しない。(というかこの関数の処理が完了するまでは定数を評価する為に必要なコードやデータがアクセス可能な状態になっている保証がない。)

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

    export function evaluate(code : object, context : Context = null) : any
    {
        if (null === code)
        {
            return null;
        }
        if (null === context)
        {
            context = new Context();
            context.cache = [];
            context.statement = [];
            context.profiling = [];
            context.footstamp = [];
            context.coverage = [];
            context.code = code = load(preprocess(preload(code), context));
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
