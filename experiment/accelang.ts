'use strict';

var accelang = accelang ||
{
    "&A": "interpreter-implement",
    "log": (text : string) : void => console.log(text),
    "error": (text : string) : void => console.error(text),

    "make_error": (message : string) : object =>
    {
        accelang.error(message);
        return {
            "&A": "error",
            "message":message,
        };
    },
    
    "eval": (code : object) : any =>
    {
        if (null === code)
        {
            return null;
        }
        const type = code["&a"];
        if (undefined === type || null === type)
        {
            return accelang.make_error("format error(missing type)");
        }
        else
        {
            switch(typeof(type))
            {
            case "string":
                switch(type)
                {
                default:
                    return accelang.make_error(`uknown type error: ${type}`);
                }
                
            case "object":
                {
                    //const complex_type = accelang.eval(type);
                    break;
                }

            default:
                return accelang.make_error(`format error(invalid type): ${typeof(type)}, ${JSON.stringify(type)}`);
            }
        }
        return accelang.make_error("intenal error");
    }
};
