console.log("initiating game");

const twangs = [
    new Audio("./effects/twang6.m4a"),
    new Audio("./effects/twang9.m4a"),
];

const {
    songDelay,
    targetBounds,
    allSlides,
    minNoteGap,
    maxTailLength
} = gameDataConst; // from data.js

let {
    travelLength,
    slideLength
} = gameDataLet; // from data.js

let noteSpeed = 1.0 * (travelLength / ( (songDelay / 1000.0) / 2 ));

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
    "KeyD",
    "KeyV",
    "KeyN",
    "KeyK"
];

let algorithm = "A";
let autoCalibrating = true;
let sustainedNotes = false;

let autoAdjustments = [];
let autoAdjustment = 0;

let streak = 0;

let currentSong = "rocknRoll";
document.getElementById("song-label").innerText = currentSong;

const masterInfo = {
    songDelay,
    targetBounds,
    allSlides,
    minNoteGap,
    maxTailLength,
    travelLength,
    slideLength,
    noteSpeed,
    notes,
    mostRecentNotesOrTails,
    targets,
    targetTails,
    sustainedNotes
};

// ----------------------------------------- HELPERS
const noteWriter = new NoteWriter(
    masterInfo
);
const animator = new Animator(
    masterInfo,
    noteWriter,
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
        autoAdjustment = 0;
    }
);

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
        if (!targetTails["slide-left"]) {
            activateTapper("tapper-left", "slide-left", "note-leaving-left");
        }
    }
    if(e.code === tapperKeys[1]) {
        e.preventDefault();
        if (!targetTails["slide-a"]) {
            activateTapper("tapper-a", "slide-a", "note-leaving-left");
        }
    }
    if(e.code === tapperKeys[2]) {
        e.preventDefault();
        if (!targetTails["slide-b"]) {
            activateTapper("tapper-b", "slide-b", "note-leaving-right");
        }
    }
    if(e.code === tapperKeys[3]) {
        e.preventDefault();
        if (!targetTails["slide-right"]) {
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
    if (autoCalibrating) {
        let closest = 500;
        let numNotes = 0;
        notes.forEach((note) => {
            if (slideId === note.slideId) {
                const thisOffset = note.position - masterInfo.travelLength;
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
    autoAdjustment = 0;
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
    const startPos = -1.0 * autoAdjustment; // should be zero initially
    newNote.style.top = `${startPos}px`;
    const noteInfo = {
        note: newNote,
        position: startPos,
        slideId: slideId,
        target: false,
        val: val,   // val in the array that triggered the note to be created
        isTail: false,
        tail: null
    };
    notes.add(noteInfo);
    document.getElementById(slideId).appendChild(newNote);

    mostRecentNotesOrTails[slideId] = noteInfo;
}
function killAllNotes() {
    notes.forEach((note) => {
        note.note.remove();
        notes.delete(note);
    });
}

function triggerHitNote(slideId) {
    player.setVolume(1);
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

    setButtonClick("enter-game", () => {
        document.getElementById("enter-game").classList.add("hidden");
        document.getElementById("full-screen-question").classList.remove("hidden");
        setButtonClick("full-screen-button", () => {
            console.log("FULL SCREEN REQUESTED");
            document.getElementById("game-container").requestFullscreen();
            hideModal("full-screen");
        });
        setButtonClick("small-screen-button", () => {
            console.log("FULL SCREEN REQUESTED");
            hideModal("full-screen");
        });
    });
    
    setTimeout(() => {
        const viewWidth = document.getElementById("game-container").clientWidth;
        masterInfo.travelLength = gameDataConst.mobile.travelLength * viewWidth;
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
        if (e.target.id === "slide-left") {
            deactivateTapper("tapper-left");
        }
        if (e.target.id === "slide-a") {
            deactivateTapper("tapper-a");
        }
        if (e.target.id === "slide-b") {
            deactivateTapper("tapper-b");
        }
        if (e.target.id === "slide-right") {
            deactivateTapper("tapper-right");
        }
    });
}