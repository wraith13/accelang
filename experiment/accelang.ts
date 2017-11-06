'use strict';

var accelang = accelang ||
{
    "run": (code : object, output : (text : string)=>void ) : void =>
    {
        if (!code || !code["&a"])
        {
            output("format error");
        }
    } 
};
