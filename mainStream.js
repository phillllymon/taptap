console.log("initiating");

const twangs = [
    new Audio("./effects/twang6.m4a"),
    new Audio("./effects/twang9.m4a"),
];

const targetBounds = {
    top: 385,
    bottom: 420
}

let notesHit = 0;
let notesMissed = 0;

let songDelay = 4000;
// let songDelay = 4000;
let noteSpeed = Math.floor(400 / ( (songDelay / 1000.0) / 2 ));

let slideLength = 500;
// const noteSpeed = 400; // px/s
let notesPerSecond = 6; // 6 is pretty good
const notes = new Set();
const targets = {
    // "slide-right": new Set(),
    // "slide-left": new Set(),
    // "slide-a": new Set(),
    // "slide-b": new Set(),
    "slider-right": new Set(),
    "slider-left": new Set(),
    "slider-a": new Set(),
    "slider-b": new Set()
}
let sliderPos = 0;

let numSlides = 2;

if (detectMobile()) {
    console.log("mobile woo!");
    addMobileStyle();

    const fullButton = document.getElementById("full-screen");

    fullButton.addEventListener("click", () => {
        document.getElementById("game-container").requestFullscreen();
    });

    songDelay = 4000;
    const viewWidth = document.getElementById("game-container").clientWidth;
    const travelLength = 1.5 * viewWidth;
    noteSpeed = Math.floor(travelLength / ( (songDelay / 1000) / 2 ));
    targetBounds.top = 0.93 * travelLength;
    targetBounds.bottom = 1.05 * travelLength;
    slideLength = travelLength * 1.3;
}

const array1 = [0];
const times1 = [0];

const array2 = [0];
const times2 = [0];

const array3 = [0];
const times3 = [0];

const array4 = [0];
const times4 = [0];

document.getElementById("song-label").innerText = "stream";

const playButton = document.getElementById("button-play");
const pauseButton = document.getElementById("button-pause");
const restartButton = document.getElementById("button-restart");

// stream business ------------------------------------- START
let playerA;
let playerB;

let currentPlayer;
const timing = 2000;
const chunckSize = 3000;

let playInterval;
let getInterval;

playButton.addEventListener("click", () => {
    getFromDatabase("streamData").then((val) => {
        const retrievedObj = JSON.parse(val);
        const strToUse = retrievedObj.str;
        playerA = new Player(`data:audio/x-wav;base64,${strToUse}`, songDelay, 32, () => {});
        playerB = new Player(`data:audio/x-wav;base64,${strToUse}`, songDelay, 32, () => {});
        currentPlayer = "A";

        console.log("first data retrieved");

        // set up data grabbing
        getInterval = setInterval(() => {
            getFromDatabase("streamData").then((res) => {
                const obj = JSON.parse(res);
                if (currentPlayer === "A") {
                    console.log("Setting B");
                    playerB.setSource(`data:audio/x-wav;base64,${obj.str}`);
                } else {
                    console.log("Setting A");
                    playerA.setSource(`data:audio/x-wav;base64,${obj.str}`);
                }
            });
        }, timing);

        // set up playing
        playerA.start();
        playInterval = setInterval(() => {
            if (currentPlayer === "A") {
                console.log("B B B B B");
                playerB.start();
                currentPlayer = "B";
            } else {
                console.log("A A A A A");
                playerA.start();
                currentPlayer = "A";
            }
        }, chunckSize);

        runAnimation();
        showPauseButton();
    });
    
});

pauseButton.addEventListener("click", () => {
    clearInterval(getInterval);
    clearInterval(playInterval);
    stopAnimation();
    showPlayButton();
});



// const player = new Player(`./songs/${currentSong}.m4a`, songDelay, 32, () => {
//     stopAnimation();
//     showRestartButton();
// });


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
// stream business ------------------------------------- FINISH

const noteWriter = new NoteWriter();

let animating = false;
let time;

activateLevelSelector();
activateSlidesSelector();
showPlayButton();

[
    ["tapper-left", "slide-left", "note-leaving-left"],
    ["tapper-right", "slide-right", "note-leaving-right"],
    ["tapper-a", "slide-a", "note-leaving-left"],
    ["tapper-b", "slide-b", "note-leaving-right"]
].forEach((idSet) => {
    document.getElementById(idSet[1]).addEventListener("touchstart", () => {
        activateTapper(...idSet);
    });
});

document.addEventListener("touchend", () => {
    deactivateTappers();
});

document.addEventListener("keydown", (e) => {
    if(e.code === "KeyD") {
        // activateTapper("tapper-left", "slide-left", "note-leaving-left");
        activateTapper("tapper-left", "slider-left", "note-leaving-left");
    }
    if(e.code === "KeyK") {
        // activateTapper("tapper-right", "slide-right", "note-leaving-right");
        activateTapper("tapper-right", "slider-right", "note-leaving-right");
    }
    if(e.code === "KeyV") {
        // activateTapper("tapper-a", "slide-a", "note-leaving-left");
        activateTapper("tapper-a", "slider-a", "note-leaving-left");
    }
    if(e.code === "KeyN") {
        // activateTapper("tapper-b", "slide-b", "note-leaving-right");
        activateTapper("tapper-b", "slider-b", "note-leaving-right");
    }
});

document.addEventListener("keyup", () => {
    deactivateTappers();
});

function deactivateTappers() {
    document.getElementById("tapper-left").style.backgroundColor = "rgba(168,0,93,0.2)";
    document.getElementById("tapper-right").style.backgroundColor = "rgba(168,0,93,0.2)";
    document.getElementById("tapper-a").style.backgroundColor = "rgba(168,0,93,0.2)";
    document.getElementById("tapper-b").style.backgroundColor = "rgba(168,0,93,0.2)";
}

function activateTapper(tapperId, slideId, leavingClass) {
    document.getElementById(tapperId).style.backgroundColor = "rgba(255, 166, 0, 0.5)";
    const tapperTargets = targets[slideId];
    if (tapperTargets.size === 0) {
        notesMissed += 1;
    }
    for (const target of tapperTargets) {
        notes.delete(target);
        target[0].remove();
        
        // target[0].classList.add(leavingClass);
        showNoteLeaving(slideId, leavingClass);
        targets[slideId].delete(target);
        triggerHitNote();
        
        if (notesHit > 30) {
            notesHit = Math.floor(notesHit / 2);
            notesMissed = Math.floor(notesMissed / 2);
        }
    }
}

function resetSliders() {
    sliderPos = 0;
    [
        "slider-left",
        "slider-a",
        "slider-b",
        "slider-right"
    ].forEach((slider) => {
        document.getElementById(slider).style.top = "0px";
    });
}

function runAnimation() {
    time = performance.now();
    animating = true;
    animate();
}

function stopAnimation() {
    animating = false;
}

function averageOf(arr) {
    let sum = 0;
    arr.forEach((val) => {
        sum += val;
    });
    return sum / arr.length;
}

function animate() {
    const newTime = performance.now();
    const dt = newTime - time;
    time = newTime;

    let dataArray = playerB.getDataArray();
    if (currentPlayer === "A") {
        dataArray = playerA.getDataArray();
    }

    array1.push(averageOf(dataArray.slice(0, 4)));
    array2.push(averageOf(dataArray.slice(4, 8)));
    array3.push(averageOf(dataArray.slice(8, 12)));
    array4.push(averageOf(dataArray.slice(12, 16)));
    times1.push(time);
    times2.push(time);
    times3.push(time);
    times4.push(time);

    // get arrays down to data for songDelay time
    while (times1[0] < time - songDelay) {
        array1.shift();
        times1.shift();
    }
    while (times2[0] < time - songDelay) {
        array2.shift();
        times2.shift();
    }
    while (times3[0] < time - songDelay) {
        array3.shift();
        times3.shift();
    }
    while (times4[0] < time - songDelay) {
        array4.shift();
        times4.shift();
    }

    let arrays = [array2, array3];
    let slideIds = ["slide-left", "slide-right"];
    // let slideIds = ["slider-left", "slider-right"];

    if (numSlides === 3) {
        arrays = [array1, array2, array4];
        slideIds = ["slide-left", "slide-a", "slide-right"];
        // slideIds = ["slider-left", "slider-a", "slider-right"];
    } else if (numSlides === 4) {
        arrays = [array1, array2, array3, array4];
        slideIds = ["slide-left", "slide-a", "slide-b", "slide-right"];
        // slideIds = ["slider-left", "slider-a", "slider-b", "slider-right"];
    }

    noteWriter.writeNotes(
        arrays,
        slideIds,
        notesPerSecond,
        addNote,
        true
    );

    moveNotes(dt);
    updateMeter();

    if (animating) {
        requestAnimationFrame(animate);
    } else {
        killAllNotes();
    }
}

function updateMeter() {
    const rotation = Math.floor(90 * (notesHit / (notesHit + notesMissed)));
    document.getElementById("meter-needle").style.transform = `rotate(-${rotation}deg)`;
}

// dt in milliseconds
function moveNotes(dt) {
    const movement = (noteSpeed * (dt / 1000));
    sliderPos += movement;
    [
        "slider-left",
        "slider-a",
        "slider-b",
        "slider-right"
    ].forEach((slider) => {
        document.getElementById(slider).style.top = `${sliderPos}px`;
    });


    for (const note of notes) {
        const newTop = note[1] + movement;
        note[1] = newTop;

        if (newTop > targetBounds.top && newTop < targetBounds.bottom) {
            targets[note[2]].add(note);
            note[3] = true;
        }
        if (newTop > targetBounds.bottom && note[3] === true) {
            note[3] = false;
            targets[note[2]].delete(note);
            triggerMissedNote();
        }
        if (newTop > slideLength) {
            note[0].remove();
            notes.delete(note);
        }
    }
}

function showNoteLeaving(slideId, leavingClass) {
    const newNote = document.createElement("div");
    newNote.classList.add("note");
    newNote.classList.add(leavingClass);
    document.getElementById(slideId).parentElement.appendChild(newNote);
    setTimeout(() => {
        newNote.remove();
    }, 200);
}

// note in form of [<ele>, posTop, slideId, target], where target is boolean
function addNote(slideId, marked = false) {
    const newNote = document.createElement("div");
    newNote.classList.add("note");
    if (marked) {
        newNote.classList.add("note-marked");
    }
    // newNote.style.top = "200px";
    newNote.style.top = `-${sliderPos}px`;
    notes.add([newNote, 0, slideId, false]);
    // console.log(slideId);
    // console.log(sliderPos);
    document.getElementById(slideId).appendChild(newNote);
}

function triggerHitNote() {
    let player;
    if (currentPlayer === "A") {
        player = playerA;
    } else {
        player = playerB;
    }
    player.setVolume(1);
    notesHit += 1;
}

function triggerMissedNote() {
    twangs[Math.floor(twangs.length * Math.random())].play();
    let player;
    if (currentPlayer === "A") {
        player = playerA;
    } else {
        player = playerB;
    }
    player.setVolume(0.3);
    notesMissed += 1;
}

function killAllNotes() {
    console.log("kill notes"); // TODO!!
}

function showPlayButton() {
    playButton.classList.remove("hidden");
    pauseButton.classList.add("hidden");
    restartButton.classList.add("hidden");
}
function showPauseButton() {
    playButton.classList.add("hidden");
    pauseButton.classList.remove("hidden");
    restartButton.classList.add("hidden");
}

function selectSlides(n) {
    const slideA = document.getElementById("slide-a");
    const slideB = document.getElementById("slide-b");
    const playArea = document.getElementById("play-area");
    const gameArea = document.getElementById("game-container");
    const slides = document.getElementById("slides");
    if (n === 2) {
        numSlides = 2;
        slideA.classList.add("hidden");
        slideB.classList.add("hidden");

        playArea.classList.remove("three-wide-area");
        playArea.classList.remove("four-wide-area");
        gameArea.classList.remove("three-wide-area");
        gameArea.classList.remove("four-wide-area");
        slides.classList.remove("three-wide-slides");
        slides.classList.remove("four-wide-slides");
    }
    if (n === 3) {
        numSlides = 3;
        slideA.classList.remove("hidden");
        slideB.classList.add("hidden");

        playArea.classList.add("three-wide-area");
        playArea.classList.remove("four-wide-area");
        gameArea.classList.add("three-wide-area");
        gameArea.classList.remove("four-wide-area");
        slides.classList.add("three-wide-slides");
        slides.classList.remove("four-wide-slides");
    }
    if (n === 4) {
        numSlides = 4;
        slideA.classList.remove("hidden");
        slideB.classList.remove("hidden");

        playArea.classList.remove("three-wide-area");
        playArea.classList.add("four-wide-area");
        gameArea.classList.remove("three-wide-area");
        gameArea.classList.add("four-wide-area");
        slides.classList.remove("three-wide-slides");
        slides.classList.add("four-wide-slides");
    }
}

function activateSlidesSelector() {
    [
        ["slides-2", 2],
        ["slides-3", 3],
        ["slides-4", 4]
    ].forEach((slideSet) => {
        const slidesButton = document.getElementById(slideSet[0]);
        slidesButton.addEventListener("click", () => {
            deselectSlides();
            selectSlides(slideSet[1]);
            slidesButton.classList.add("level-selected");
        })
    });
    document.getElementById("slides-2").classList.add("level-selected");
    selectSlides(2);
}

function deselectSlides() {
    ["slides-2", "slides-3", "slides-4"].forEach((num) => {
        document.getElementById(num).classList.remove("level-selected");
    });
}

function activateLevelSelector() {
    [
        ["level-1", 2],
        ["level-2", 4],
        ["level-3", 6],
        ["level-4", 8],
        ["level-5", 10]
    ].forEach((levelSet) => {
        const levelButton = document.getElementById(levelSet[0]);
        levelButton.addEventListener("click", () => {
            deselectLevels();
            notesPerSecond = levelSet[1];
            levelButton.classList.add("level-selected");
        });
    });
    document.getElementById("level-3").classList.add("level-selected");
}

function deselectLevels() {
    ["level-1", "level-2", "level-3", "level-4", "level-5"].forEach((level) => {
        document.getElementById(level).classList.remove("level-selected");
    });
}

function addMobileStyle() {
    const link = document.createElement("link");

    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = "./styleMobile.css";

    document.head.appendChild(link);
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