'use strict';

//  copy from https://stackoverflow.com/questions/36532307/rem-px-in-javascript
function convertRemToPixels(rem : number) :number
{
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

function getSourcodeElement() : HTMLTextAreaElement
{
    return <HTMLTextAreaElement>document.getElementById("source");
}
function getIndicatorElement() : HTMLSpanElement
{
    return <HTMLSpanElement>document.getElementById("indicator");
}
function getRunElement() : HTMLSpanElement
{
    return <HTMLSpanElement>document.getElementById("run");
}
function getOutputElement() : HTMLElement
{
    return <HTMLElement>document.getElementById("output");
}
function getMachineElement() : HTMLElement
{
    return <HTMLElement>document.getElementById("machine");
}

class CreateElementArg
{
    tag : string;
    className ?: string;
    innerText ?: string;
    children ?: HTMLElement[];
}
function createElement(arg : CreateElementArg) : HTMLElement
{
    const element = document.createElement(arg.tag);
    if (undefined !== arg.className)
    {
        element.className = arg.className;
    }
    if (undefined !== arg.innerText)
    {
        element.innerText = arg.innerText;
    }
    if (undefined !== arg.children)
    {
        arg.children.forEach(i => {
            element.appendChild(i);
        });
    }
    return element;
}

setTimeout
(
    () =>
    {
        accelang.httpGet
        (
            "samples/index.json",
            samples => document
                .getElementsByClassName("sample-list")[0]
                .getElementsByClassName("container")[0]
                .getElementsByTagName("ul")[0].innerHTML = 
                    JSON.parse(samples)
                    .map(i => `<li onclick=select('${i.url}')>${i.name}</li>`)
                    .join("")
        );
        fillHeight();
        window.onresize = fillHeight;
        getRunElement().onclick = run;
        //getSourcodeElement().onchange = updateEditorIndicator;
        getSourcodeElement().onkeydown = updateEditorIndicator;
        getSourcodeElement().onkeyup = updateEditorIndicator;
        getSourcodeElement().onmousedown = updateEditorIndicator;
        getSourcodeElement().onmouseup = updateEditorIndicator;
    },
    10
);

function fillHeight() : void
{
    const list = [
        getSourcodeElement(),
        getOutputElement(),
        getMachineElement()
    ];
    if (convertRemToPixels(80) <= document.body.clientWidth)
    {
        list.forEach(element => element.style.width = "100%");
        list.forEach(element => element.style.height = (document.body.clientHeight -convertRemToPixels(7)) +"px");
    }
    else
    {
        list.forEach(element => element.style.width = (document.body.clientWidth -convertRemToPixels(1)) +"px");
        list.forEach(element => element.style.height = "30vh");
    }
}

function select(url : string) : void
{
    accelang.httpGet
    (
        url,
        sample => getSourcodeElement().value = sample
    );
}

function practical_typeof(obj : any) : string
{
    if (undefined === obj)
    {
        return "undefined";
    }
    if (null === obj)
    {
        return "null";
    }
    if ("[object Array]" === Object.prototype.toString.call(obj))
    {
        return "array";
    }

    return typeof obj;
}

function arrayToHtml(array : object[]): HTMLElement
{
    return createElement
    (
        {
            tag: "div",
            className: "array",
            children: array.map(i => anyToHtml(i))
        }
    );
}

function objectToHtml(obj : object): HTMLElement
{
    const children : HTMLElement[] = [];
    for(var key in obj)
    {
        if (obj.hasOwnProperty(key))
        {
            children.push
            (
                createElement
                (
                    {
                        tag:"div",
                        className:"property",
                        children:
                        [
                            createElement
                            (
                                {
                                    tag:"div",
                                    className:"key",
                                    innerText: JSON.stringify(key)
                                }
                            ),
                            anyToHtml(obj[key])
                        ]
                    }
                )
            );
        }
    }
    return createElement
    (
        {
            tag:"div",
            className:"object",
            children: children
        }
    );
}

function functionToHtml(obj : object): HTMLElement
{
    return createElement
    (
        {
            tag:"div",
            className: "function",
            //innerText: JSON.stringify(obj.toString(), null, 4)
            innerText: "(...)"
        }
    );
}

function valueToHtml(obj : object): HTMLElement
{
    return createElement
    (
        {
            tag:"div",
            className: practical_typeof(obj),
            innerText:JSON.stringify(obj, null, 4)
        }
    );
}

function anyToHtml(obj : any): HTMLElement
{
    switch(practical_typeof(obj))
    {
        case "array":
            return arrayToHtml(<object[]>obj);
        case "object":
            return objectToHtml(obj);
        case "function":
            return functionToHtml(obj);
        default:
            return valueToHtml(obj);
    }
}

function run() : void
{
    getOutputElement().innerHTML = "";
    getMachineElement().innerHTML = "";
    const machine = new accelang.AmpMachine();
    
    machine.log = (text : string) : void =>
    {
        getOutputElement().appendChild
        (
            createElement
            (
                {
                    tag:"div",
                    className:"log",
                    innerText:text
                }
            )
        );
    };
    machine.error = (text : string) : void =>
    {
        getOutputElement().appendChild
        (
            createElement
            (
                {
                    tag:"div",
                    className:"error",
                    innerText:text
                }
            )
        );
    };
    try
    {
        machine.log
        (
            JSON.stringify
            (
                machine
                    .load
                    (
                        "editor",
                        getSourcodeElement().value
                    )
                    .execute(),
                null,
                4
            )
        );
    }
    catch(error)
    {
        machine.error
        (
            JSON.stringify
            (
                error["&A"] ?
                    error:
                    {
                        "JavaScript.Error": {
                            "name": error.name,
                            "message": error.message,
                            "stack": error.stack.split("\n")
                        }
                    },
                null,
                4
            )
        );
    }
    getMachineElement().appendChild(objectToHtml(machine));
    console.log(JSON.stringify(machine, null, 4));
}

function countLocation(text : string) : { line : number, row : number }
{
    const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    return {
        line: lines.length,
        row: lines.pop().length +1
    };
}

function updateEditorIndicator() : void
{
    const location = countLocation
    (
        getSourcodeElement()
            .value
            .substr(0, getSourcodeElement().selectionStart)
    );
    getIndicatorElement().innerText = `${location.line},${location.row}`;
}