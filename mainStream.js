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

// let songDelay = 3000;
let songDelay = 4000;
let noteSpeed = Math.floor(400 / ( (songDelay / 1000.0) / 2 ));

console.log(noteSpeed);

let slideLength = 500;
// const noteSpeed = 400; // px/s
let notesPerSecond = 6; // 6 is pretty good
const notes = new Set();
const targets = {
    "slide-right": new Set(),
    "slide-left": new Set(),
    "slide-a": new Set(),
    "slide-b": new Set()
}

let numSlides = 2;

if (detectMobile()) {
    console.log("mobile woo!");
    addMobileStyle();

    const fullButton = document.getElementById("full-screen");

    fullButton.addEventListener("click", () => {
        document.getElementById("game-container").requestFullscreen();
    });

    setTimeout(() => {

        songDelay = 4000;
        const viewWidth = document.getElementById("game-container").clientWidth;
        const travelLength = 1.5 * viewWidth;
        noteSpeed = Math.floor(travelLength / ( (songDelay / 1000) / 2 ));
        targetBounds.top = 0.93 * travelLength;
        targetBounds.bottom = 1.05 * travelLength;

        slideLength = travelLength * 1.3;

        console.log("mobile stuff done");
    }, 500);
}

const playButton = document.getElementById("button-play");
const pauseButton = document.getElementById("button-pause");

// stream stuff here ---------------------------------
const playerStream = new PlayerStream(4000, addNote);

playButton.addEventListener("click", () => {
    playerStream.play();
    showPauseButton();
    runAnimation();
});
pauseButton.addEventListener("click", () => {
    playerStream.pause();
    showPlayButton();
    stopAnimation();
});
// end stream stuff ----------------------------------

const array1 = [0];
const times1 = [0];

const array2 = [0];
const times2 = [0];

const array3 = [0];
const times3 = [0];

const array4 = [0];
const times4 = [0];

document.getElementById("song-label").innerText = "stream...";

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
        activateTapper("tapper-left", "slide-left", "note-leaving-left");
    }
    if(e.code === "KeyK") {
        activateTapper("tapper-right", "slide-right", "note-leaving-right");
    }
    if(e.code === "KeyV") {
        activateTapper("tapper-a", "slide-a", "note-leaving-left");
    }
    if(e.code === "KeyN") {
        activateTapper("tapper-b", "slide-b", "note-leaving-right");
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
        
        target[0].classList.add(leavingClass);
        setTimeout(() => {
            target[0].remove();
        }, 500);
        
        targets[slideId].delete(target);
        triggerHitNote();
        
        if (notesHit > 30) {
            notesHit = Math.floor(notesHit / 2);
            notesMissed = Math.floor(notesMissed / 2);
        }
    }
}

function runAnimation() {
    time = performance.now();
    animating = true;
    animate();
}

function stopAnimation() {
    animating = false;
}

function animate() {
    const newTime = performance.now();
    const dt = newTime - time;
    time = newTime;

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

    for (const note of notes) {
        const newTop = note[1] + movement;
        note[0].style.top = `${newTop}px`;
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

// note in form of [<ele>, posTop, slideId, target], where target is boolean
function addNote(slideId, marked = false) {
    const newNote = document.createElement("div");
    newNote.classList.add("note");
    if (marked) {
        newNote.classList.add("note-marked");
    }
    // newNote.style.top = "200px";
    newNote.style.top = "0px";
    notes.add([newNote, 0, slideId, false]);
    document.getElementById(slideId).appendChild(newNote);
}

function triggerHitNote() {
    playerStream.setVolume(1);
    notesHit += 1;
}

function triggerMissedNote() {
    twangs[Math.floor(twangs.length * Math.random())].play();
    playerStream.setVolume(0.3);
    notesMissed += 1;
}

function killAllNotes() {
    console.log("kill notes"); // TODO!!
}

function showPlayButton() {
    playButton.classList.remove("hidden");
    pauseButton.classList.add("hidden");
}
function showPauseButton() {
    playButton.classList.add("hidden");
    pauseButton.classList.remove("hidden");
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

function showModal() {
    document.getElementById("modal-background").classList.remove("hidden");
    document.getElementById("choose-modal").classList.remove("hidden");
}
function hideModal() {
    document.getElementById("modal-background").classList.add("hidden");
    document.getElementById("choose-modal").classList.add("hidden");
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