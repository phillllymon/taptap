console.log("initiating");

const twangs = [
    new Audio("./effects/twang6.m4a"),
    new Audio("./effects/twang9.m4a"),
];

const {
    songDelay,
    targetBounds,
    allSlides,
    minNoteGap,
} = gameDataConst; // from data.js

let {
    travelLength,
    slideLength
} = gameDataLet; // from data.js

let noteSpeed = 1.0 * (travelLength / ( (songDelay / 1000.0) / 2 ));
handleMobile();

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

let algorithm = "A";
let autoCalibrating = true;

let autoAdjustments = [];
let autoAdjustment = 0;

let streak = 0;

let currentSong = "anthem";
document.getElementById("song-label").innerText = currentSong;

// ----------------------------------------- HELPERS
const noteWriter = new NoteWriter(minNoteGap);
const animator = new Animator(
    noteWriter,
    notes,
    targets,
    targetBounds,
    allSlides,
    triggerMissedNote,
    addNote,
    {
        noteSpeed: noteSpeed,
        songDelay: songDelay
    }
);
const player = new Player(`./songs/${currentSong}.m4a`, songDelay, 32, () => {
    animator.stopAnimation();
    showSongControlButton("button-restart");
    autoAdjustment = 0;
});

// ------------------------------------------ ACTIVATORS
activateSettings(tapperKeys, (newCode) => {
    waitingForKey = newCode;
});
activateLevelSelector(animator);
activateSlidesSelector((newVal) => {
    animator.setNumSlides(newVal);
});
activateCalibration();
activateSongControls(
    player,
    () => animator.runAnimation({ player, algorithm }),
    () => animator.stopAnimation(),
    killAllNotes
);
activateSongSelection(
    player,
    animator,
    showModal,
    hideModal,
    showSongControlButton,
    killAllNotes,
    resetAutoAdjustment,
    (newSong) => {
        currentSong = newSong;
    }
);




// main
let waitingForKey = false;
showSongControlButton("button-play");



// setup for items handled on this page
document.addEventListener("keypress", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (waitingForKey) {
        e.preventDefault();
        tapperKeys[waitingForKey[1]] = e.code;
        document.getElementById(waitingForKey[0]).innerText = e.code;
        document.getElementById("save-settings").disabled = false;
        waitingForKey = false;
    }
});

document.addEventListener("keydown", (e) => {
    if(e.code === tapperKeys[0]) {
        e.preventDefault();
        activateTapper("tapper-left", "slide-left", "note-leaving-left");
    }
    if(e.code === tapperKeys[1]) {
        e.preventDefault();
        activateTapper("tapper-a", "slide-a", "note-leaving-left");
    }
    if(e.code === tapperKeys[2]) {
        e.preventDefault();
        activateTapper("tapper-b", "slide-b", "note-leaving-right");
    }
    if(e.code === tapperKeys[3]) {
        e.preventDefault();
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
    if (autoCalibrating) {
        let closest = 500;
        let numNotes = 0;
        notes.forEach((note) => {
            if (slideId === note[2]) {
                const thisOffset = note[1] - travelLength;
                if (Math.abs(thisOffset) < closest) {
                    closest = thisOffset;
                    if (thisOffset < 80) {
                        numNotes += 1;
                    }
                }
            }
        });
        
        if (numNotes < 2) {
            if (Math.abs(closest) < 50) {
                autoAdjustment += 1.0 * (closest / (10 * notes.size));
                autoAdjustment = Math.max(autoAdjustment, -35);
                autoAdjustment = Math.min(autoAdjustment, 20);
            }
        }
    }

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
    }
}

function resetAutoAdjustment() {
    autoAdjustment = 0;
}

// note in form of [<ele>, posTop, slideId, target], where target is boolean
function addNote(slideId, marked = false) {
    const newNote = document.createElement("div");
    newNote.classList.add("note");
    if (marked) {
        newNote.classList.add("note-marked");
    }
    const startPos = -1.0 * autoAdjustment; // should be zero initially
    newNote.style.top = `${startPos}px`;
    notes.add([newNote, startPos, slideId, false]);
    document.getElementById(slideId).appendChild(newNote);
}
function killAllNotes() {
    notes.forEach((note) => {
        note[0].remove();
        notes.delete(note);
    });
}

function triggerHitNote() {
    player.setVolume(1);
    animator.recordNoteHit();
    streak += 1;
    const songLabel = document.getElementById("song-label");
    if (streak > 9) {
        songLabel.innerText = `STREAK: ${streak}`;
    }
    if (streak === 25) {
        songLabel.classList.add("font-bigA");
    }
    if (streak === 50) {
        songLabel.classList.add("font-bigB");
    }
    if (streak > 50 && streak % 50 === 0) {
        songLabel.classList.remove("font-bigB");
        setTimeout(() => {
            songLabel.classList.add("font-bigB");
        }, 0);
    }
}

function triggerMissedNote() {
    twangs[Math.floor(twangs.length * Math.random())].play();
    player.setVolume(0.3);
    animator.recordNoteMissed();
    streak = 0;
    removeElementClass("song-label", "font-bigA");
    removeElementClass("song-label", "font-bigB");
    setElementText("song-label", currentSong);
}

function showSongControlButton(buttonId) {
    ["button-play", "button-pause", "button-restart"].forEach((id) => {
        addElementClass(id, "hidden");
    });
    removeElementClass(buttonId, "hidden");
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
    // add mobile style
    const link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = "./style/styleMobile.css";
    document.head.appendChild(link);
    
    showModal("full-screen");
    setButtonClick("full-screen-button", () => {
        document.getElementById("game-container").requestFullscreen();
        hideModal("full-screen");
    });
    setButtonClick("small-screen-button", () => {
        hideModal("full-screen");
    });
    
    setTimeout(() => {
        const viewWidth = document.getElementById("game-container").clientWidth;
        travelLength = gameDataConst.mobile.travelLength * viewWidth;
        noteSpeed = Math.floor(travelLength / ( (songDelay / 1000) / 2 ));
        targetBounds.top = gameDataConst.mobile.top * travelLength;
        targetBounds.bottom = gameDataConst.mobile.bottom * travelLength;
        slideLength = travelLength * 1.3;
    }, 500); // without small delay this was getting missed

    [
        ["tapper-left", "slide-left", "note-leaving-left"],
        ["tapper-right", "slide-right", "note-leaving-right"],
        ["tapper-a", "slide-a", "note-leaving-left"],
        ["tapper-b", "slide-b", "note-leaving-right"]
    ].forEach((idSet) => {
        document.getElementById(idSet[1]).addEventListener("touchstart", (e) => {
            e.preventDefault();
            activateTapper(...idSet);
        });
    });
    
    document.addEventListener("touchend", (e) => {
        e.preventDefault();
        deactivateTapper("tapper-left");
        deactivateTapper("tapper-a");
        deactivateTapper("tapper-b");
        deactivateTapper("tapper-right");
    });
}