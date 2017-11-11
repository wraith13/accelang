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
    
    export function evaluate(code : object) : any
    {
        if (null === code)
        {
            return null;
        }
        const type = code["&a"];
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
