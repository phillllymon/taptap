function averageOf(arr) {
    let sum = 0;
    arr.forEach((val) => {
        sum += val;
    });
    return sum / arr.length;
}

function setButtonClick(buttonId, callback) {
    document.getElementById(buttonId).addEventListener("click", callback);
}

function setElementText(elementId, text) {
    document.getElementById(elementId).innerText = text;
}

function addElementClass(elementId, newClass) {
    document.getElementById(elementId).classList.add(newClass);
}

function removeElementClass(elementId, newClass) {
    document.getElementById(elementId).classList.remove(newClass);
}

function detectMobile() {
    if (navigator.userAgentData) {
        return navigator.userAgentData.mobile;
    } else {
        // got this from https://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
        const toMatch = [
            /Android/i,
            /webOS/i,
            /iPhone/i,
            /iPad/i,
            /iPod/i,
            /BlackBerry/i,
            /Windows Phone/i
        ];
        
        return toMatch.some((toMatchItem) => {
            return navigator.userAgent.match(toMatchItem);
        }); 
    }
}