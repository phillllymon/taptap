console.log("initiating");

const twangs = [
    new Audio("./effects/twang6.m4a"),
    new Audio("./effects/twang9.m4a"),
];

const targetBounds = {
    top: 385,
    bottom: 420
}

let streak = 0;
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
};

const tapperKeys = [
    "KeyD",
    "KeyV",
    "KeyN",
    "KeyK"
];
let algorithm = "new";

let numSlides = 2;

if (detectMobile()) {
    console.log("mobile woo!");
    addMobileStyle();

    document.getElementById("full-screen-modal").classList.remove("hidden");
    document.getElementById("modal-background").classList.remove("hidden");
    
    const fullButton = document.getElementById("full-screen");

    fullButton.addEventListener("click", () => {
        document.getElementById("game-container").requestFullscreen();
        document.getElementById("full-screen-modal").classList.add("hidden");
        document.getElementById("modal-background").classList.add("hidden");
        
    });

    document.getElementById("small-screen").addEventListener("click", () => {
        document.getElementById("full-screen-modal").classList.add("hidden");
        document.getElementById("modal-background").classList.add("hidden");
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

activateSettings();
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
    deactivateTapper("tapper-left");
    deactivateTapper("tapper-a");
    deactivateTapper("tapper-b");
    deactivateTapper("tapper-right");
});

let waitingForKey = false;
document.addEventListener("keypress", (e) => {
    if (waitingForKey) {
        tapperKeys[waitingForKey[1]] = e.code;
        document.getElementById(waitingForKey[0]).innerText = e.code;
        document.getElementById("save-settings").disabled = false;
        waitingForKey = false;
    }
});
document.addEventListener("keydown", (e) => {
    if(e.code === tapperKeys[0]) {
        activateTapper("tapper-left", "slide-left", "note-leaving-left");
    }
    if(e.code === tapperKeys[1]) {
        activateTapper("tapper-a", "slide-a", "note-leaving-left");
    }
    if(e.code === tapperKeys[2]) {
        activateTapper("tapper-b", "slide-b", "note-leaving-right");
    }
    if(e.code === tapperKeys[3]) {
        activateTapper("tapper-right", "slide-right", "note-leaving-right");
    }
});

document.addEventListener("keyup", (e) => {
    if(e.code === tapperKeys[0]) {
        deactivateTapper("tapper-left");
    }
    if(e.code === tapperKeys[1]) {
        deactivateTapper("tapper-a");
    }
    if(e.code === tapperKeys[2]) {
        deactivateTapper("tapper-b");
    }
    if(e.code === tapperKeys[3]) {
        deactivateTapper("tapper-right");
    }
});

function deactivateTapper(tapperId) {
    document.getElementById(tapperId).style.backgroundColor = "rgba(168,0,93,0.2)";
}

function activateTapper(tapperId, slideId, leavingClass) {
    document.getElementById(tapperId).style.backgroundColor = "rgba(255, 166, 0, 0.5)";
    const tapperTargets = targets[slideId];
    if (tapperTargets.size === 0) {
        triggerMissedNote();
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
    showModal("choose");
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
        currentSong = e.target.files[0].name;
        document.getElementById("song-label").innerText = currentSong;
    };
    reader.readAsBinaryString(file);
});

function selectUploadedSong(songData) {
    stopAnimation();
    player.pause();
    player.setSource(songData);
    showPlayButton();
    hideModal("choose");
    killAllNotes();
}

function selectSong(songName) {
    currentSong = songName;
    stopAnimation();
    player.pause();
    player.setSource(`./songs/${currentSong}.m4a`);
    showPlayButton();
    document.getElementById("song-label").innerText = currentSong;
    hideModal("choose");
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
        times1,
        numSlides,
        algorithm
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

let streakWait = false;
let hit10 = false;
let hit25 = false;
let hit50 = false;
let hit100 = false;

function triggerHitNote() {
    player.setVolume(1);
    notesHit += 1;

    streak += 1;
    const songLabel = document.getElementById("song-label");
    if (hit10) {
        songLabel.innerText = `STREAK: ${streak}`;
    }
    if (!hit10 && streak > 10) {
        songLabel.innerText = "STREAK!";
        streakWait = setTimeout(() => {
            songLabel.innerText = `STREAK: ${streak}`;
        }, 1000);
        hit10 = true;
    }
    if (!hit25 && streak > 25) {
        songLabel.classList.add("font-bigA");
        songLabel.innerText = "25 NOTE STREAK!";
        streakWait = setTimeout(() => {
            songLabel.innerText = `STREAK: ${streak}`;
        }, 1000);
        hit25 = true;
    }
    if (!hit50 && streak > 50) {
        songLabel.classList.add("font-bigB");
        songLabel.innerText = "50 NOTE STREAK!";
        streakWait = setTimeout(() => {
            songLabel.innerText = `STREAK: ${streak}`;
        }, 1000);
        hit50 = true;
    }
    if (!hit100 && streak > 100) {
        songLabel.classList.add("font-bigC");
        songLabel.innerText = "100 NOTES!!!";
        streakWait = setTimeout(() => {
            songLabel.innerText = `STREAK: ${streak}`;
        }, 1000);
        hit100 = true;
    }
}

function triggerMissedNote() {
    twangs[Math.floor(twangs.length * Math.random())].play();
    player.setVolume(0.3);
    notesMissed += 1;
    streak = 0;
    hit10 = false;
    hit25 = false;
    hit50 = false;
    hit100 = false;
    clearTimeout(streakWait);
    const songLabel = document.getElementById("song-label");
    songLabel.classList.remove("font-bigA");
    songLabel.classList.remove("font-bigB");
    songLabel.classList.remove("font-bigC");
    songLabel.innerText = currentSong;
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

function activateSettings() {
    document.getElementById("settings").addEventListener("click", () => {
        showModal("settings");
    });
    document.getElementById("save-settings").addEventListener("click", () => {
        hideModal("settings");
    });
    const keyInfo = [
        ["change-left", "left-key"],
        ["change-a", "a-key"],
        ["change-b", "b-key"],
        ["change-right", "right-key"]
    ];
    for (let i = 0; i < keyInfo.length; i++) {
        document.getElementById(keyInfo[i][1]).innerText = tapperKeys[i];
        document.getElementById(keyInfo[i][0]).addEventListener("click", () => {
            document.getElementById(keyInfo[i][1]).innerText = "-";
            document.getElementById("save-settings").disabled = true;
            waitingForKey = [keyInfo[i][1], i];
        });
    }
    document.getElementById("switch-algorithm").addEventListener("click", () => {
        if (algorithm === "new") {
            algorithm = "old";
            document.getElementById("algorithm").innerText = "using algorithm B";
        } else {
            algorithm = "new";
            document.getElementById("algorithm").innerText = "using algorithm A";
        }
    });
}

function showModal(modal) {
    if (modal === "choose") {
        document.getElementById("choose-modal").classList.remove("hidden");
    }
    if (modal === "settings") {
        document.getElementById("settings-modal").classList.remove("hidden");    
    }
    document.getElementById("modal-background").classList.remove("hidden");
}
function hideModal(modal) {
    if (modal === "choose") {
        document.getElementById("choose-modal").classList.add("hidden");
    }
    if (modal === "settings") {
        document.getElementById("settings-modal").classList.add("hidden");
    }
    document.getElementById("modal-background").classList.add("hidden");
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