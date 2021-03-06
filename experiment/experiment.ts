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
var currentHoverElement :HTMLElement = null;
function updateHoverElement(element : HTMLElement) : void
{
    if (element !== currentHoverElement)
    {
        if (currentHoverElement)
        {
            currentHoverElement.classList.remove("hover");
        }
        currentHoverElement = element;
        if (currentHoverElement)
        {
            currentHoverElement.classList.add("hover");
        }
    }
}

function leaveHoverElement(element : HTMLElement) : void
{
    if (null === element || element === currentHoverElement)
    {
        if (currentHoverElement)
        {
            currentHoverElement.classList.remove("hover");
        }
        currentHoverElement = null;
    }
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
function createDiv(className : string, innerText : string) : HTMLElement;
function createDiv(className : string, children : HTMLElement[]) : HTMLElement;
function createDiv(className : string, x : any) : HTMLElement
{
    return createElement
    (
        "string" === accelang.practicalTypeof(x) ?
        {
            tag: "div",
            className: className,
            innerText: x
        }:
        {
            tag: "div",
            className: className,
            children: x
        }
    );
}

setTimeout
(
    async () =>
    {
        document
        .getElementsByClassName("sample-list")[0]
        .getElementsByClassName("container")[0]
        .getElementsByTagName("ul")[0].innerHTML = 
            JSON.parse(await accelang.httpGet("./samples/index.json"))
            .map(i => `<li onclick=select('${i.url}')>${i.name}</li>`)
            .join("");
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

async function select(url : string) : Promise<void>
{
    getSourcodeElement().value = await accelang.httpGet(url);
}


function addEventListenerForBracket(parent : HTMLElement, bracket : HTMLElement): HTMLElement
{
    bracket.addEventListener
    (
        "mouseover",
        event =>
        {
            event.stopPropagation();
            updateHoverElement(parent);
        }
    );
    bracket.addEventListener
    (
        "mouseout",
        event =>
        {
            event.stopPropagation();
            leaveHoverElement(parent);
        }
    );
    bracket.addEventListener
    (
        "click",
        event =>
        {
            event.stopPropagation();
            parent.classList.toggle("toggle");
        }
    );
    return bracket;
}

function arrayToHtml(array : object[]): HTMLElement
{
    const begin = createDiv("begin", "[");
    const end = createDiv("end", "]");
    if (0 < array.length)
    {
        const children : HTMLElement[] = [];
        for(var i = 0; i < array.length; ++i) {
            const item : HTMLElement[] = [anyToHtml(array[i])];
            children.push(createDiv("item", item));
        }
        const element = createDiv
        (
            "array",
            [
                begin,
                createDiv("list", children),
                end,
                makeCommaSeperator()
            ]
        );
        addEventListenerForBracket(element, begin);
        addEventListenerForBracket(element, end);
        return element;
    }
    else
    {
        return createDiv
        (
            "array empty",
            [
                begin,
                end,
                makeCommaSeperator()
            ]
        );
    }
}

function objectToHtml(obj : object): HTMLElement
{
    const items : HTMLElement[][] = [];
    const begin = createDiv("begin", "{");
    const end = createDiv("end",　"}");
    for(var key in obj)
    {
        if (obj.hasOwnProperty(key))
        {
            items.push
            (
                [
                    createDiv("key", JSON.stringify(key) +":"),
                    anyToHtml(obj[key])
                ]
            );
        }
    }
    if (0 < items.length)
    {
        const element = createDiv
        (
            "object",
            [
                begin,
                createDiv("list", items.map(i => createDiv("item", i))),
                end,
                makeCommaSeperator()
            ]
        );
        addEventListenerForBracket(element, begin);
        addEventListenerForBracket(element, end);
        return element;
    }
    else
    {
        return createDiv
        (
            "object empty",
            [
                begin,
                end,
                makeCommaSeperator()
            ]
        );
    }
}

function functionToHtml(_obj : object): HTMLElement
{
    return createDiv
    (
        "function",
        //JSON.stringify(obj.toString(), null, 4)
        "\"__FUNCTION__\""
    );
}

function valueToHtml(obj : object): HTMLElement
{
    return createDiv
    (
        accelang.practicalTypeof(obj),
        JSON.stringify(obj, null, 4)
    );
}

function makeCommaSeperator(): HTMLElement
{
    return createDiv("separator", ",");
} 

function anyToHtml(obj : any): HTMLElement
{
    const children : HTMLElement[] = [];
    switch(accelang.practicalTypeof(obj))
    {
        case "array":
            children.push(arrayToHtml(<object[]>obj));
            break;
        case "object":
            children.push(objectToHtml(obj));
            break;
        case "function":
            children.push(functionToHtml(obj));
            children.push(makeCommaSeperator());
            break;
        default:
            children.push(valueToHtml(obj));
            children.push(makeCommaSeperator());
            break;
    }
    return createDiv("value", children);
}
function jsonToHtml(obj : object): HTMLElement
{
    return createDiv("json", [anyToHtml(obj)]);
}

async function run() : Promise<void>
{
    getOutputElement().innerHTML = "";
    getMachineElement().innerHTML = "";
    const machine = new accelang.AmpMachine();
    
    machine.log = (text : string) : void =>
    {
        getOutputElement().appendChild(createDiv("log", text));
    };
    machine.error = (text : string) : void =>
    {
        getOutputElement().appendChild(createDiv("error", text));
    };
    try
    {
        await machine.init();
        getOutputElement().appendChild
        (
            jsonToHtml
            (
                await
                (
                    await machine.load
                    (
                        "editor",
                        getSourcodeElement().value
                    )
                ).execute()
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
                        "JavaScript.Error":
                        {
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
    getMachineElement().appendChild(jsonToHtml(machine));
    //console.log(JSON.stringify(machine, null, 4));
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