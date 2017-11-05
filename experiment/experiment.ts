'use strict';

//  copy from https://stackoverflow.com/questions/36532307/rem-px-in-javascript
function convertRemToPixels(rem : number) :number
{
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
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
                    .map(i => `<li>${i.name}</li>`)
                    .join("")
        );
        fill_height();
        window.onresize = fill_height;
    },
    10
);

function fill_height() : void
{
    const list = [
        document.getElementsByTagName("textarea")[0],
        <HTMLElement>document.getElementsByClassName("xxx")[0]
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
