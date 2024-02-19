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

const array1 = [];
const times1 = [];
const array2 = [];
const times2 = [];
const array3 = [];
const times3 = [];
const array4 = [];
const times4 = [];

let masterData;

let currentSong = "anthem";
document.getElementById("song-label").innerText = currentSong;

const player = new Player(`./songs/${currentSong}.m4a`, songDelay, 32, () => {
    stopAnimation();
    showRestartButton();
});

const noteWriter = new NoteWriter();

let animating = false;
let time;

const songSelector = document.getElementById("select-song");
const playButton = document.getElementById("button-play");
const pauseButton = document.getElementById("button-pause");
const restartButton = document.getElementById("button-restart");

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
    // document.getElementById(idSet[1]).addEventListener("mousedown", () => {
        activateTapper(...idSet);
    });
});

document.addEventListener("touchend", () => {
// document.addEventListener("mouseup", () => {
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

document.getElementById("choose-button").addEventListener("click", () => {
    showModal();
});

playButton.addEventListener("click", () => {
    player.start();
    runAnimation();
    showPauseButton();

});
pauseButton.addEventListener("click", () => {
    player.pause();
    stopAnimation();
    showPlayButton();

});
restartButton.addEventListener("click", () => {
    player.restart();
    stopAnimation();
    showPlayButton();
    killAllNotes();
});

songSelector.addEventListener("change", () => {
    selectSong(songSelector.value);
});
document.getElementById("file-input").addEventListener("change", (e) => {
    player.pause();
    stopAnimation();

    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (readerE) => {
        const str = btoa(readerE.target.result);
        const newSongData = `data:audio/x-wav;base64,${str}`;
        selectUploadedSong(newSongData);
        document.getElementById("song-label").innerText = e.target.files[0].name;
    };
    reader.readAsBinaryString(file);
});

function selectUploadedSong(songData) {
    stopAnimation();
    player.pause();
    player.setSource(songData);
    showPlayButton();
    hideModal();
    killAllNotes();
}

function selectSong(songName) {
    currentSong = songName;
    stopAnimation();
    player.pause();
    player.setSource(`./songs/${currentSong}.m4a`);
    showPlayButton();
    document.getElementById("song-label").innerText = currentSong;
    hideModal();
    killAllNotes();
}

function disablePlayControls() {
    [playButton, pauseButton, restartButton].forEach((button) => {
        button.disabled = true;
    });
}

function enablePlayControls() {
    [playButton, pauseButton, restartButton].forEach((button) => {
        button.disabled = false;
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

    const dataArray = player.getDataArray();

    array1.push(averageOf(dataArray.slice(0, 4)));
    array2.push(averageOf(dataArray.slice(4, 8)));
    array3.push(averageOf(dataArray.slice(8, 12)));
    array4.push(averageOf(dataArray.slice(12, 16)));
    times1.push(time);
    times2.push(time);
    times3.push(time);
    times4.push(time);

    masterData = [
        [array1, array2, array3, array4],
        times1
    ]

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
        true,
        masterData
    );

    // add notes
    // [
    //     // [array2, "slide-left"],
    //     // [array3, "slide-right"]
    //     [array1, "slide-left"],
    //     [array2, "slide-a"],
    //     [array3, "slide-b"],
    //     [array4, "slide-right"]
    // ].forEach((set) => {
    //     const arr = set[0];
    //     const midIdx = Math.floor(arr.length / 2);
    //     const midVal = arr[midIdx];
    //     const leg = arr.length / (2 * notesPerSecond);
    //     const beforeIdx = midIdx - leg;
    //     const afterIdx = midIdx + leg;
    //     const beforeMax = Math.max(...arr.slice(beforeIdx, midIdx));
    //     const afterMax = Math.max(...arr.slice(midIdx + 1, afterIdx));
    //     // console.log(arr);
    //     if (midVal > beforeMax && midVal > afterMax) {
    //         addNote(set[1]);
    //     }
    // });

    moveNotes(dt);
    updateMeter();

    if (animating) {
        requestAnimationFrame(animate);
    } else {
        // killAllNotes();
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
    player.setVolume(1);
    notesHit += 1;
}

function triggerMissedNote() {
    twangs[Math.floor(twangs.length * Math.random())].play();
    player.setVolume(0.3);
    notesMissed += 1;
}

function killAllNotes() {
    notes.forEach((note) => {
        note[0].remove();
        notes.delete(note);
    });
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
function showRestartButton() {
    playButton.classList.add("hidden");
    pauseButton.classList.add("hidden");
    restartButton.classList.remove("hidden");
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

// } // end of main function