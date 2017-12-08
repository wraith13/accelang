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
        accelang.http_get
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
        fill_height();
        window.onresize = fill_height;
        (<HTMLElement>document.getElementsByClassName("run")[0]).onclick = run;
    },
    10
);

function fill_height() : void
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
    accelang.http_get
    (
        url,
        sample => getSourcodeElement().value = sample
    );
}

function run() : void
{
    getOutputElement().innerHTML = "";
    const context = new accelang.AmpContext();
    
    context.log = (text : string) : void =>
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
    context.error = (text : string) : void =>
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
        context.log
        (
            JSON.stringify
            (
                context
                    .load(JSON.parse(getSourcodeElement().value))
                    .execute(),
                null,
                4
            )
        );
    }
    catch(error)
    {
        context.error(JSON.stringify(error));
    }
}
