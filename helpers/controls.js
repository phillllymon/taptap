function activateCalibration() {
    setButtonClick("auto-calibrate", () => {
        if (autoCalibrating) {
            autoCalibrating = false;
            autoAdjustment = 0;
            document.getElementById("autocalibration").innerText = "autocalibration OFF";
            calibrateButton.innerText = "Turn on autocalibration";
        } else {
            autoCalibrating = true;
            autoAdjustment = 0;
            document.getElementById("autocalibration").innerText = "autocalibration ON";
            calibrateButton.innerText = "Turn off autocalibration";
        }
    });
}

function activateSongSelection(
    thePlayer,
    theAnimator,
    showModal,
    hideModal,
    showSongControlButton,
    killAllNotes,
    resetAutoAdjustment,
    setCurrentSong
) {
    const songSelector = document.getElementById("select-song");
    setButtonClick("choose-button", () => {
        showModal("choose");
    });
    
    songSelector.addEventListener("change", () => {
        const newValue = songSelector.value;
        setCurrentSong(newValue);
        theAnimator.stopAnimation();
        thePlayer.pause();
        thePlayer.setSource(`./songs/${currentSong}.m4a`);
        showSongControlButton("button-play");
        document.getElementById("song-label").innerText = newValue;
        hideModal("choose");
        killAllNotes();
        resetAutoAdjustment();
    });
    
    document.getElementById("file-input").addEventListener("change", (e) => {
        thePlayer.pause();
        theAnimator.stopAnimation();
    
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (readerE) => {
            const str = btoa(readerE.target.result);
            const newSongData = `data:audio/x-wav;base64,${str}`;
            
            theAnimator.stopAnimation();
            thePlayer.pause();
            thePlayer.setSource(newSongData);
            showSongControlButton("button-play");
            hideModal("choose");
            killAllNotes();
            resetAutoAdjustment();
            
            setCurrentSong(e.target.files[0].name);
            document.getElementById("song-label").innerText = currentSong;
        };
        reader.readAsBinaryString(file);
    });
}

function activateSongControls(thePlayer, runTheAnimation, stopTheAnimation, killNotes) {
    setButtonClick("button-play", () => {
        thePlayer.start();
        runTheAnimation();
        showSongControlButton("button-pause");
    });
    setButtonClick("button-pause", () => {
        thePlayer.pause();
        stopTheAnimation();
        showSongControlButton("button-play");
    });
    setButtonClick("button-restart", () => {
        thePlayer.restart();
        stopTheAnimation();
        showSongControlButton("button-play");
        killNotes();
    });
}

function selectSlides(n, setNumSlides) {
    const slideA = document.getElementById("slide-a");
    const slideB = document.getElementById("slide-b");
    const playArea = document.getElementById("play-area");
    const gameArea = document.getElementById("game-container");
    const slides = document.getElementById("slides");
    if (n === 2) {
        setNumSlides(2);
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
        setNumSlides(3);
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
        setNumSlides(4);
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

function activateSlidesSelector(setNumSlides) {
    [
        ["slides-2", 2],
        ["slides-3", 3],
        ["slides-4", 4]
    ].forEach((slideSet) => {
        const slidesButton = document.getElementById(slideSet[0]);
        slidesButton.addEventListener("click", () => {
            deselectSlides();
            selectSlides(slideSet[1], setNumSlides);
            slidesButton.classList.add("level-selected");
        })
    });
    document.getElementById("slides-2").classList.add("level-selected");
    selectSlides(2, setNumSlides);
}

function deselectSlides() {
    ["slides-2", "slides-3", "slides-4"].forEach((num) => {
        document.getElementById(num).classList.remove("level-selected");
    });
}

function activateLevelSelector(theAnimator) {
    [
        ["level-1", 2],
        ["level-2", 4],
        ["level-3", 6],
        ["level-4", 8],
        ["level-5", 10]
    ].forEach((levelSet) => {
        setButtonClick(levelSet[0], () => {
            ["level-1", "level-2", "level-3", "level-4", "level-5"].forEach((level) => {
                removeElementClass(level, "level-selected");
            });
            theAnimator.setNotesPerSecond(levelSet[1]);
            addElementClass(levelSet[0], "level-selected");
        });
    });
    addElementClass("level-3", "level-selected");
}

function activateSettings(tapperKeyCodes, setNewKeyCode) {
    setButtonClick("settings", () => {
        showModal("settings");
    });
    setButtonClick("save-settings", () => {
        hideModal("settings");
    });
    const keyInfo = [
        ["change-left", "left-key"],
        ["change-a", "a-key"],
        ["change-b", "b-key"],
        ["change-right", "right-key"]
    ];
    for (let i = 0; i < keyInfo.length; i++) {
        setElementText(keyInfo[i][1], tapperKeyCodes[i]);
        setButtonClick(keyInfo[i][0], () => {
            setElementText(keyInfo[i][1], "-");
            document.getElementById("save-settings").disabled = true;
            setNewKeyCode([keyInfo[i][1], i]);
        });
    }
    setButtonClick("switch-algorithm", () => {
        if (algorithm === "A") {
            algorithm = "B";
            setElementText("algorithm", "using algorithm B");
        } else {
            algorithm = "A";
            setElementText("algorithm", "using algorithm A");
        }
    });
    setButtonClick("sustained-toggle", () => {
        if (masterInfo.sustainedNotes) {
            masterInfo.sustainedNotes = false;
            setElementText("sustained", "sustained notes OFF");
        } else {
            masterInfo.sustainedNotes = true;
            setElementText("sustained", "sustained notes ON");
        }
    });
}