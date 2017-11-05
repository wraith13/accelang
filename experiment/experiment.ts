'use strict';

//  copy from https://stackoverflow.com/questions/36532307/rem-px-in-javascript
function convertRemToPixels(rem : number) :number
{
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

setTimeout
(
    () =>
    {
        var request = window.ActiveXObject ? new window.ActiveXObject('Microsoft.XMLHTTP') : new window.XMLHttpRequest();
        request.open('GET', "samples.json", true);
        request.onreadystatechange = () =>
        {
            if (4 === request.readyState && 200 === request.status)
            {
                document.getElementsByClassName("sample-list")[0].getElementsByClassName("container")[0].getElementsByTagName("ul")[0].innerHTML = JSON.parse(request.responseText).map(i => `<li>${i.name}</li>`).join("");
            }
        };
        request.send(null);
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
