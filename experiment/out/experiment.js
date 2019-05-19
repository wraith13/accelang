'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
//  copy from https://stackoverflow.com/questions/36532307/rem-px-in-javascript
function convertRemToPixels(rem) {
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}
function getSourcodeElement() {
    return document.getElementById("source");
}
function getIndicatorElement() {
    return document.getElementById("indicator");
}
function getRunElement() {
    return document.getElementById("run");
}
function getOutputElement() {
    return document.getElementById("output");
}
function getMachineElement() {
    return document.getElementById("machine");
}
var currentHoverElement = null;
function updateHoverElement(element) {
    if (element !== currentHoverElement) {
        if (currentHoverElement) {
            currentHoverElement.classList.remove("hover");
        }
        currentHoverElement = element;
        if (currentHoverElement) {
            currentHoverElement.classList.add("hover");
        }
    }
}
function leaveHoverElement(element) {
    if (null === element || element === currentHoverElement) {
        if (currentHoverElement) {
            currentHoverElement.classList.remove("hover");
        }
        currentHoverElement = null;
    }
}
class CreateElementArg {
}
function createElement(arg) {
    const element = document.createElement(arg.tag);
    if (undefined !== arg.className) {
        element.className = arg.className;
    }
    if (undefined !== arg.innerText) {
        element.innerText = arg.innerText;
    }
    if (undefined !== arg.children) {
        arg.children.forEach(i => {
            element.appendChild(i);
        });
    }
    return element;
}
function createDiv(className, x) {
    return createElement("string" === accelang.practicalTypeof(x) ?
        {
            tag: "div",
            className: className,
            innerText: x
        } :
        {
            tag: "div",
            className: className,
            children: x
        });
}
setTimeout(() => __awaiter(this, void 0, void 0, function* () {
    document
        .getElementsByClassName("sample-list")[0]
        .getElementsByClassName("container")[0]
        .getElementsByTagName("ul")[0].innerHTML =
        JSON.parse(yield accelang.httpGet("./samples/index.json"))
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
}), 10);
function fillHeight() {
    const list = [
        getSourcodeElement(),
        getOutputElement(),
        getMachineElement()
    ];
    if (convertRemToPixels(80) <= document.body.clientWidth) {
        list.forEach(element => element.style.width = "100%");
        list.forEach(element => element.style.height = (document.body.clientHeight - convertRemToPixels(7)) + "px");
    }
    else {
        list.forEach(element => element.style.width = (document.body.clientWidth - convertRemToPixels(1)) + "px");
        list.forEach(element => element.style.height = "30vh");
    }
}
function select(url) {
    return __awaiter(this, void 0, void 0, function* () {
        getSourcodeElement().value = yield accelang.httpGet(url);
    });
}
function addEventListenerForBracket(parent, bracket) {
    bracket.addEventListener("mouseover", event => {
        event.stopPropagation();
        updateHoverElement(parent);
    });
    bracket.addEventListener("mouseout", event => {
        event.stopPropagation();
        leaveHoverElement(parent);
    });
    bracket.addEventListener("click", event => {
        event.stopPropagation();
        parent.classList.toggle("toggle");
    });
    return bracket;
}
function arrayToHtml(array) {
    const begin = createDiv("begin", "[");
    const end = createDiv("end", "]");
    if (0 < array.length) {
        const children = [];
        for (var i = 0; i < array.length; ++i) {
            const item = [anyToHtml(array[i])];
            children.push(createDiv("item", item));
        }
        const element = createDiv("array", [
            begin,
            createDiv("list", children),
            end,
            makeCommaSeperator()
        ]);
        addEventListenerForBracket(element, begin);
        addEventListenerForBracket(element, end);
        return element;
    }
    else {
        return createDiv("array empty", [
            begin,
            end,
            makeCommaSeperator()
        ]);
    }
}
function objectToHtml(obj) {
    const items = [];
    const begin = createDiv("begin", "{");
    const end = createDiv("end", "}");
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            items.push([
                createDiv("key", JSON.stringify(key) + ":"),
                anyToHtml(obj[key])
            ]);
        }
    }
    if (0 < items.length) {
        const element = createDiv("object", [
            begin,
            createDiv("list", items.map(i => createDiv("item", i))),
            end,
            makeCommaSeperator()
        ]);
        addEventListenerForBracket(element, begin);
        addEventListenerForBracket(element, end);
        return element;
    }
    else {
        return createDiv("object empty", [
            begin,
            end,
            makeCommaSeperator()
        ]);
    }
}
function functionToHtml(_obj) {
    return createDiv("function", 
    //JSON.stringify(obj.toString(), null, 4)
    "\"__FUNCTION__\"");
}
function valueToHtml(obj) {
    return createDiv(accelang.practicalTypeof(obj), JSON.stringify(obj, null, 4));
}
function makeCommaSeperator() {
    return createDiv("separator", ",");
}
function anyToHtml(obj) {
    const children = [];
    switch (accelang.practicalTypeof(obj)) {
        case "array":
            children.push(arrayToHtml(obj));
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
function jsonToHtml(obj) {
    return createDiv("json", [anyToHtml(obj)]);
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        getOutputElement().innerHTML = "";
        getMachineElement().innerHTML = "";
        const machine = new accelang.AmpMachine();
        machine.log = (text) => {
            getOutputElement().appendChild(createDiv("log", text));
        };
        machine.error = (text) => {
            getOutputElement().appendChild(createDiv("error", text));
        };
        try {
            yield machine.init();
            getOutputElement().appendChild(jsonToHtml(yield (yield machine.load("editor", getSourcodeElement().value)).execute()));
        }
        catch (error) {
            machine.error(JSON.stringify(error["&A"] ?
                error :
                {
                    "JavaScript.Error": {
                        "name": error.name,
                        "message": error.message,
                        "stack": error.stack.split("\n")
                    }
                }, null, 4));
        }
        getMachineElement().appendChild(jsonToHtml(machine));
        //console.log(JSON.stringify(machine, null, 4));
    });
}
function countLocation(text) {
    const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    return {
        line: lines.length,
        row: lines.pop().length + 1
    };
}
function updateEditorIndicator() {
    const location = countLocation(getSourcodeElement()
        .value
        .substr(0, getSourcodeElement().selectionStart));
    getIndicatorElement().innerText = `${location.line},${location.row}`;
}
//# sourceMappingURL=experiment.js.map