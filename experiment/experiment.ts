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

function http_get(url : string, callback : (response_body : string)=>void) :void
{
    var request = window.ActiveXObject ? new window.ActiveXObject('Microsoft.XMLHTTP') : new window.XMLHttpRequest();
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

setTimeout
(
    () =>
    {
        http_get
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
    http_get
    (
        url,
        sample => getSourcodeElement().value = sample
    );
}

function run() : void
{
    getOutputElement().innerHTML = "";
    accelang.log = (text : string) : void =>
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
    accelang.error = (text : string) : void =>
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
        accelang.log
        (
            JSON.stringify
            (
                accelang.eval
                (
                    JSON.parse(getSourcodeElement().value)
                ),
                null,
                4
            )
        );
    }
    catch(error)
    {
        accelang.error(JSON.stringify(error));
    }
}