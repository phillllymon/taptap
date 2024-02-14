console.log("I am the receiver");

const audioA = new Audio();
const audioB = new Audio();

let playing = false;
let current = "A";

let dataStarted = false;
getFromDatabase("streamData").then((val) => {
    console.log("back from database");
    const retrievedObj = JSON.parse(val);
    console.log(retrievedObj.data);
    const strToUse = retrievedObj.str;
    audioA.src = `data:audio/x-wav;base64,${strToUse}`;
    console.log("A ready");
    dataStarted = true;
});

let poll;
let wait;
let dt = 2000;
let switchTime = 3000; // make slightly lower than piece length for no gap

document.getElementById("piece-size").addEventListener("change", (e) => {
    switchTime = e.target.value;
    console.log("pieces size changed to " + e.target.value);
});
document.getElementById("poll-time").addEventListener("change", (e) => {
    dt = e.target.value;
    console.log("poll time changed to " + e.target.value);
});

function playStream() {
    if (dataStarted) {
        if (current === "A") {
            audioA.play();
        } else {
            audioB.play();
        }
        wait = setTimeout(() => {
            switchTo(current === "A" ? "B" : "A");
        }, switchTime);
    }
    poll = setInterval(() => {
        console.log("querying....");
        getFromDatabase("streamData").then((res) => {
            console.log("data received");
            const obj = JSON.parse(res);
            (current === "A" ? audioB : audioA).src = `data:audio/x-wav;base64,${obj.str}`;
        });
    }, dt);
}

function stopStream() {
    clearInterval(poll);
    clearTimeout(wait);
    audioA.pause();
    audioB.pause();
}

document.getElementById("play").addEventListener("click", () => {
    playStream();
});

document.getElementById("stop").addEventListener("click", () => {
    stopStream();
});

function switchTo(audio) {
    if (audio === "A") {
        audioA.play();
        current = "A";
    } else {
        audioB.play();
        current = "B";
    }
    wait = setTimeout(() => {
        switchTo(audio === "A" ? "B" : "A");
    }, switchTime);
}




// --- Helpers below ---

function getFromDatabase(name) {
    return new Promise((resolve) => {
        fetch("https://graffiti.red/API/public/", {
            method: "POST",
            body: JSON.stringify({
                action: "retrieve",
                name: name
            })
        }).then((res) => {
            res.json().then((r) => {
                resolve(r.value);
            });
        });
    });
}