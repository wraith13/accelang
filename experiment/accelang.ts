'use strict';

var accelang = accelang ||
{
    "&A": "interpreter-implement",
    "log": (text : string) : void => console.log(text),
    "error": (text : string) : void => console.error(text),
    
    "run": (code : object) : void =>
    {
        accelang.eval(code);
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
            accelang.error("format error(missing type)");
        }
        else
        {
            switch(typeof(type))
            {
            case "string":
                switch(type)
                {
                default:
                    accelang.error(`uknown type error: ${type}`);
                }
                break;
                
            case "object":
                {
                    //const complex_type = accelang.eval(type);
                    break;
                }

            default:
                accelang.error(`format error(invalid type): ${typeof(type)}, ${JSON.stringify(type)}`);
            }
        }
    }
};
