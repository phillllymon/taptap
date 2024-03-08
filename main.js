console.log("initiating game");

const twangs = [
    new Audio("./effects/twang6.m4a"),
    new Audio("./effects/twang9.m4a"),
];

const {
    songDelay,
    allSlides,
    targetBoundSizes,
    minNoteGap,
    maxTailLength
} = gameDataConst; // from data.js

// let viewWidth = document.getElementById("game-container").clientWidth;
// let viewHeight = document.getElementById("game-container").clientHeight;
// console.log(viewWidth);
// console.log(viewHeight);
let viewWidth = document.body.clientWidth;
let viewHeight = document.body.clientHeight;
let vMin = Math.min(viewWidth, viewHeight);

let slideLength = 1.5 * vMin;
let travelLength = 1.365 * vMin;

let noteSpeed = 1.0 * (travelLength / ( (songDelay / 1000.0) / 2 ));
const targetBounds = {
    top: travelLength - (targetBoundSizes.top * travelLength),
    bottom: travelLength + (targetBoundSizes.bottom * travelLength)
}

handleMobile();

const notes = new Set();

const mostRecentNotesOrTails = {
    "slide-right": null,
    "slide-left": null,
    "slide-a": null,
    "slide-b": null
};

const targets = {
    "slide-right": new Set(),
    "slide-left": new Set(),
    "slide-a": new Set(),
    "slide-b": new Set()
};

const targetTails = {
    "slide-right": null,
    "slide-left": null,
    "slide-a": null,
    "slide-b": null
};

const tapperKeys = [
    "KeyS",
    "KeyC",
    "KeyB",
    "KeyJ"
];

const activeTappers = {
    "tapper-left": false,
    "tapper-a": false,
    "tapper-b": false,
    "tapper-right": false
}

let algorithm = "A";
let autoCalibrating = true;
let sustainedNotes = true;
let animatedBackground = true;
let streaming = false;
let streamSync = 0;

let autoAdjustments = [];
let autoAdjustment = -0.05 * travelLength;

let streak = 0;

let currentSong = "rocknRoll";
document.getElementById("song-label").innerText = currentSong;
let waitingForKey = false;
let songAtStart = true;

let songNotesHit = 0;
let songNotesMissed = 0;
let songStreak = 0;

let radioCode = "mvn925";

// TEMP FOR SLIDER EXPERIMENT
let sliderPos = 0;

const masterInfo = {
    algorithm,
    allSlides,
    animatedBackground,
    autoAdjustment,
    currentSong,
    maxTailLength,
    minNoteGap,
    mostRecentNotesOrTails,
    notes,
    noteSpeed,
    radioCode,
    slideLength,
    songAtStart,
    songDelay,
    songNotesHit,
    songNotesMissed,
    songStreak,
    streaming,
    streamSync,
    sustainedNotes,
    tapperKeys,
    targets,
    targetBounds,
    targetTails,
    travelLength,
    vMin,
    waitingForKey
};

// ----------------------------------------- HELPERS
const noteWriter = new NoteWriter(
    masterInfo
);
const backgroundAnimator = new BackgroundAnimator(
    masterInfo
);
const animator = new Animator(
    masterInfo,
    noteWriter,
    backgroundAnimator,
    addNote,
    makeTail,
    triggerMissedNote
);
const player = new Player(
    masterInfo,
    `./songs/${currentSong}.m4a`,
    32,
    () => {
        animator.stopAnimation();
        showSongControlButton("button-restart");
        autoAdjustment = autoCalibrating ? -0.05 * travelLength : 0;
        masterInfo.autoAdjustment = autoAdjustment;
        document.getElementById("feedback").classList.remove("hidden");
        const fraction = 1.0 * masterInfo.songNotesHit / (masterInfo.songNotesHit + masterInfo.songNotesMissed);
        document.getElementById("percent-bar").style.width = `${fraction * 30}vh`;
        document.getElementById("feedback-percent").innerText = `Tap accuracy: ${Math.round(fraction * 100)}%`;
        document.getElementById("feedback-streak").innerText = `Longest streak: ${masterInfo.songStreak}`;
        document.getElementById("feedback-title").innerText = masterInfo.currentSong;
        masterInfo.songNotesMissed = 0;
        masterInfo.songNotesHit = 0;
        masterInfo.songStreak = 0;
    }
);
const streamPlayer = new StreamPlayer(
    masterInfo,
    masterInfo.songDelay
);
const stationManager = new StationManager(
    masterInfo,
    streamPlayer
);
const controlsManager = new ControlsManager(
    masterInfo,
    player,
    streamPlayer,
    animator
);
const menuManager = new MenuManager(
    masterInfo,
    controlsManager,
    player,
    stationManager,
    streamPlayer
);
const connector = new Connector(
    masterInfo
);




document.isFullscreen = false;
document.wantFullscreenReturn = false;

// main
showSongControlButton("button-play");



// setup for items handled on this page
document.addEventListener("keypress", (e) => {
    // e.preventDefault();
    e.stopPropagation();
    if (masterInfo.waitingForKey) {
        e.preventDefault();
        tapperKeys[masterInfo.waitingForKey[1]] = e.code;
        document.getElementById(masterInfo.waitingForKey[0]).innerText = e.code;
        document.getElementById("save-settings").disabled = false;
        masterInfo.waitingForKey = false;
    }
    if (e.code === "Space") {
        masterInfo.spaceFunction();
    }
});

document.addEventListener("keydown", (e) => {
    if(e.code === tapperKeys[0]) {
        e.preventDefault();
        if (!targetTails["slide-left"] && !activeTappers["tapper-left"]) {
            activateTapper("tapper-left", "slide-left", "note-leaving-left");
        }
    }
    if(e.code === tapperKeys[1]) {
        e.preventDefault();
        if (!targetTails["slide-a"] && !activeTappers["tapper-a"]) {
            if (animator.slides.length === 3) {
                activateTapper("tapper-a", "slide-a", Math.random() > 0.5 ? "note-leaving-right" : "note-leaving-left");
            } else {
                activateTapper("tapper-a", "slide-a", "note-leaving-left");
            }
        }
    }
    if(e.code === tapperKeys[2]) {
        e.preventDefault();
        if (!targetTails["slide-b"] && !activeTappers["tapper-b"]) {
            activateTapper("tapper-b", "slide-b", "note-leaving-right");
        }
    }
    if(e.code === tapperKeys[3]) {
        e.preventDefault();
        if (!targetTails["slide-right"] && !activeTappers["tapper-right"]) {
            activateTapper("tapper-right", "slide-right", "note-leaving-right");
        }
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
    activeTappers[tapperId] = false;
    const slideIds = {
        "tapper-left": "slide-left",
        "tapper-a": "slide-a",
        "tapper-b": "slide-b",
        "tapper-right": "slide-right"
    };
    const tail = targetTails[slideIds[tapperId]];
    if (tail) {
        targetTails[slideIds[tapperId]] = null;
        if (tail.height > 0.1 * maxTailLength) {
            player.setVolume(0.3);
        }
        // tail.note.classList.add("hidden");
        tail.note.remove();
        mostRecentNotesOrTails[slideIds[tapperId]] = null;
    }
}

function activateTapper(tapperId, slideId, leavingClass) {
    activeTappers[tapperId] = true;
    let closest = 500;
    let numNotes = 0;
    let target = null;
    notes.forEach((note) => {
        if (slideId === note.slideId) {
            const thisOffset = note.position - masterInfo.travelLength;
            if (Math.abs(thisOffset) < closest) {
                target = note;
                closest = thisOffset;
                if (thisOffset < 80) {
                    numNotes += 1;
                }
            }
        }
    });
    
    if (autoCalibrating) {
        const proximity = 0.1 * masterInfo.travelLength;
        if (numNotes === 1) {
            if (Math.abs(closest) < proximity) {
                autoAdjustment += 1.0 * (closest / (10 * notes.size));
                autoAdjustment = Math.max(autoAdjustment, -1 * proximity);
                autoAdjustment = Math.min(autoAdjustment, 1.0 * proximity / 2);
                masterInfo.autoAdjustment = autoAdjustment;
            }
        }
    }

    document.getElementById(tapperId).style.backgroundColor = "rgba(255, 166, 0, 0.5)";
    const tapperTargets = targets[slideId];
    if (tapperTargets.size === 0) {
        triggerMissedNote();
    }
    if (tapperTargets.has(target)) {
        notes.delete(target);
        target.note.classList.add(leavingClass);
        setTimeout(() => {
            target.note.remove();
        }, 500);
        targets[slideId].delete(target);
        triggerHitNote(slideId);

        if (target.tail) {
            targetTails[slideId] = target.tail;
            target.tail.note.classList.add("tail-active");

            target.tail.cloud.classList.remove("hidden");

            // make it look like you got the note spot on
            const perfectHeight = masterInfo.travelLength - target.tail.position;
            target.tail.note.style.height = `${perfectHeight}px`;
            target.tail.height = perfectHeight;
        }
    }
}

function resetAutoAdjustment() {
    autoAdjustment = 10;
    masterInfo.autoAdjustment = autoAdjustment;
}

function makeTail(slideId, parentNote) {
    if (parentNote.isTail) { // stretch instead of making new
        const startPos = -1.0 * autoAdjustment;
        const additionalHeight = parentNote.position - startPos;
        parentNote.totalHeight = parentNote.totalHeight + additionalHeight;
        const newHeight = parentNote.height + additionalHeight;
        parentNote.note.style.height = `${newHeight}px`;
        parentNote.note.style.top = `${startPos}px`;
        parentNote.height = newHeight;
        parentNote.position = startPos;
    } else {
        const newTail = document.createElement("div");
        newTail.classList.add("note-tail");
        const startPos = -1.0 * autoAdjustment;
        // const startPos = -1.0 * autoAdjustment - 300;
        newTail.style.top = `${startPos}px`;
        const heightNeeded = parentNote.position - startPos;
        newTail.style.height = `${heightNeeded}px`;
        // newTail.style.height = `${300}px`;
        const newTailCloud = document.createElement("div");
        const tailInfo = {
            note: newTail,
            position: startPos,
            height: heightNeeded,
            totalHeight: heightNeeded, // running total of all height it's ever had
            slideId: slideId,
            target: false,
            val: parentNote.val,
            isTail: true,
            cloud: newTailCloud,
            parentNote: parentNote,
            tail: null
        }
        
        parentNote.tail = tailInfo;
        newTailCloud.classList.add("cloud-tail");
        newTailCloud.classList.add("hidden");
        newTail.appendChild(newTailCloud);
        document.getElementById(slideId).appendChild(newTail);
    
        mostRecentNotesOrTails[slideId] = tailInfo;
    }

}
function addNote(slideId, val, marked = false) {
    const newNote = document.createElement("div");
    newNote.classList.add("note");
    if (marked) {
        newNote.classList.add("note-marked");
    }

    let startPos = -1.0 * autoAdjustment; // should be zero initially
    
    // match previous note if super close
    ["slide-left", "slide-a", "slide-b", "slide-right"].forEach((id) => {
        const recent = mostRecentNotesOrTails[id];
        if (recent && !recent.isTail && recent.position < 0.04 * masterInfo.travelLength + autoAdjustment) {
            startPos = recent.position;
        }
    });

    newNote.style.top = `${-1.0 * sliderPos}px`;
    // newNote.style.top = `${startPos}px`;
    const noteInfo = {
        note: newNote,
        position: startPos,
        slideId: slideId,
        target: false,
        val: val,   // val in the array that triggered the note to be created
        isTail: false,
        tail: null,
        seen: false
    };
    notes.add(noteInfo);
    document.getElementById(slideId).appendChild(newNote);

    mostRecentNotesOrTails[slideId] = noteInfo;
}
function killAllNotes() {
    notes.forEach((note) => {
        if (note.tail) {
            note.tail.note.remove();
        }
        note.note.remove();
        notes.delete(note);
    });
}

let labelInUse = false;
function triggerHitNote(slideId) {
    if (masterInfo.streaming || masterInfo.songMode === "radio") {
        streamPlayer.setVolume(1);
    } else {
        player.setVolume(1);
    }
    const cloudId = {
        "slide-left": "cloud-left",
        "slide-a": "cloud-a",
        "slide-b": "cloud-b",
        "slide-right": "cloud-right"
    }[slideId];
    const cloud = document.getElementById(cloudId);
    cloud.classList.remove("hidden");
    cloud.classList.add("cloud");
    setTimeout(() => {
        cloud.classList.remove("cloud");
        cloud.classList.add("hidden");
    }, 300);

    animator.recordNoteHit();
    streak += 1;
    if (streak > masterInfo.songStreak) {
        masterInfo.songStreak = streak;
    }
    masterInfo.songNotesHit += 1;
    const songLabel = document.getElementById("song-label");
    if (streak > 9) {
        songLabel.innerText = `STREAK: ${streak}`;
    }
    if (streak === 50) {
        songLabel.classList.add("font-bigA");
    }
    const rockLabel = document.getElementById("rock-label");
    if (streak === 100) {
        rockLabel.innerHTML = "100 NOTE <br> STREAK!";
        rockLabel.classList.add("rock-label");
        labelInUse = true;
        setTimeout(() => {
            rockLabel.classList.remove("rock-label");
            rockLabel.innerHTML = "";
            labelInUse = false;
        }, 1300);
    }
    if (streak === 200) {
        document.getElementById("slides").classList.add("on-fire");
        document.getElementById("song-label").classList.add("on-fire");
        rockLabel.innerHTML = "ON FIRE!";
        rockLabel.classList.add("rock-label");
        
        labelInUse = true;
        setTimeout(() => {
            rockLabel.classList.remove("rock-label");
            rockLabel.innerHTML = "";
            labelInUse = false;
        }, 1300);
    }
}

function triggerMissedNote() {
    twangs[Math.floor(twangs.length * Math.random())].play();
    if (masterInfo.streaming || masterInfo.songMode === "radio") {
        streamPlayer.setVolume(0.3);
    } else {
        player.setVolume(0.3);
    }
    animator.recordNoteMissed();
    removeElementClass("song-label", "font-bigA");
    setElementText("song-label", masterInfo.currentSong);
    document.getElementById("slides").classList.remove("on-fire");
    document.getElementById("song-label").classList.remove("on-fire");
    
    const rockLabel = document.getElementById("rock-label");
    if (!labelInUse) {
        rockLabel.classList.remove("on-fire");
        rockLabel.classList.remove("rock-label");
    }
    
    const theStreak = streak;
    if (theStreak > 25) {
        labelInUse = true;
        rockLabel.innerHTML = `${theStreak} NOTE <br> STREAK!`;
        rockLabel.classList.add("rock-label");
        setTimeout(() => {
            rockLabel.classList.remove("rock-label");
            if (theStreak > 50) {
                rockLabel.innerHTML = "YOU ROCK!";
                rockLabel.classList.add("rock-label");
                setTimeout(() => {
                    rockLabel.classList.remove("rock-label");
                    rockLabel.innerHTML = "";
                    labelInUse = false;
                }, 1300);
            } else {
                labelInUse = false;
            }
        }, 1300);
    }
    streak = 0;
    masterInfo.songNotesMissed += 1;
}

function showSongControlButton(buttonId) {
    ["button-play", "button-pause", "button-restart"].forEach((id) => {
        addElementClass(id, "disabled-button");
    });
    removeElementClass(buttonId, "disabled-button");
}

function showModal(modal) {
    const modalId = `${modal}-modal`;
    document.getElementById(modalId).classList.remove("hidden");
    document.getElementById("modal-background").classList.remove("hidden");
}
function hideModal(modal) {
    const modalId = `${modal}-modal`;
    document.getElementById(modalId).classList.add("hidden");
    document.getElementById("modal-background").classList.add("hidden");
}

function handleMobile() {
    if (detectMobile()) {
        console.log("mobile woo!");
        setupMobile();
    }
}

function setupMobile() {
    document.mobile = true;
    // add mobile style
    const link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = "./style/styleMobile.css";
    document.head.appendChild(link);

    [
        "fog-top-left",
        "fog-top-right",
        "fog-gradient-left",
        "fog-gradient-right"
    ].forEach((eleId) => {
        document.getElementById(eleId).remove();
    });
    
    setTimeout(() => {
        backgroundAnimator.initializeMobileBackground();
        document.getElementById("background-css").remove();

        const viewHeight = document.getElementById("game-container").clientHeight;
        masterInfo.travelLength = gameDataConst.mobile.travelLength * viewHeight;

        const newNoteSpeed = Math.floor(masterInfo.travelLength / ( (masterInfo.songDelay / 1000) / 2 ));
        masterInfo.targetBounds.top = gameDataConst.mobile.targetBounds.top * masterInfo.travelLength;
        masterInfo.targetBounds.bottom = gameDataConst.mobile.targetBounds.bottom * masterInfo.travelLength;
        masterInfo.noteSpeed = newNoteSpeed;
        masterInfo.maxTailLength = 1.0 * gameDataConst.mobile.maxTailLength * masterInfo.travelLength;
        masterInfo.slideLength = masterInfo.travelLength * 1.3;
    }, 500); // without small delay this was getting missed

    [
        ["tapper-left", "slide-left", "note-leaving-left"],
        ["tapper-right", "slide-right", "note-leaving-right"],
        ["tapper-a", "slide-a", "note-leaving-left"],
        ["tapper-b", "slide-b", "note-leaving-right"]
    ].forEach((idSet) => {
        document.getElementById(idSet[1]).addEventListener("touchstart", (e) => {
            activateTapper(...idSet);
        });
    });
    
    document.addEventListener("touchend", (e) => {
        if (e.target.id === "slide-left" || e.target.id === "tapper-left") {
            deactivateTapper("tapper-left");
        }
        if (e.target.id === "slide-a" || e.target.id === "tapper-a") {
            deactivateTapper("tapper-a");
        }
        if (e.target.id === "slide-b" || e.target.id === "tapper-b") {
            deactivateTapper("tapper-b");
        }
        if (e.target.id === "slide-right" || e.target.id === "tapper-right") {
            deactivateTapper("tapper-right");
        }
    });
}