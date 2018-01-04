'use strict';

//  copy from https://stackoverflow.com/questions/36532307/rem-px-in-javascript
function convertRemToPixels(rem : number) :number
{
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

function getSourcodeElement() : HTMLTextAreaElement
{
    return <HTMLTextAreaElement>document.getElementsByTagName("textarea")[0];
}
function getIndicatorElement() : HTMLSpanElement
{
    return <HTMLSpanElement>document.getElementsByClassName("indicator")[0];
}
function getRunElement() : HTMLSpanElement
{
    return <HTMLSpanElement>document.getElementsByClassName("run")[0];
}
function getOutputElement() : HTMLElement
{
    return <HTMLElement>document.getElementsByClassName("xxx")[0];
}

class CreateElementArg
{
    tag : string;
    className ?: string;
    innerText ?: string;
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
        getOutputElement()
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

function run() : void
{
    getOutputElement().innerHTML = "";
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
}

function countLocation(text : string) : { line : number, row : number }
{
    const lines = text.replace("\r\n", "\n").replace("\r", "\n").split("\n");
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