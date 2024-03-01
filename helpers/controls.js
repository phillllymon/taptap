function activateCalibration() {
    const calibrateButton = document.getElementById("auto-calibrate");
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
        if (document.isFullscreen) {
            try {
                controlsManager.toggleFullscreen().then(() => {
                    document.wantFullscreenReturn = true;
                    showModal("choose");
                });
            } catch (err) {
                showModal("choose");
            }
        } else {
            showModal("choose");
        }
    });
    
    // setButtonClick("choose-button", () => {
    //     showModal("choose");
    // });
    
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
        if (document.wantFullscreenReturn) {
            controlsManager.toggleFullscreen().then(() => {
                document.wantFullscreenReturn = false;
            });
        }
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
            if (document.wantFullscreenReturn) {
                controlsManager.toggleFullscreen().then(() => {
                    document.wantFullScreenReturn = false;
                });
            }
        };
        reader.readAsBinaryString(file);
    });

    setButtonClick("cancel-choose", () => {
        hideModal("choose");
    });
}

function activateSongControls(thePlayer, theAnimator, theStreamPlayer, killNotes) {
    setButtonClick("button-play", () => {
        playFunction(thePlayer, theAnimator, theStreamPlayer);
    });
    setButtonClick("button-pause", () => {
        pauseFunction(thePlayer, theAnimator, theStreamPlayer, killNotes);
    });
    setButtonClick("button-restart", () => {
        restartFunction(thePlayer, theAnimator, killNotes)
    });
    masterInfo.spaceFunction = () => {
        playFunction(thePlayer, theAnimator, theStreamPlayer);
    };
}

function playFunction(thePlayer, theAnimator, theStreamPlayer) {
    if (masterInfo.streaming) {
        theStreamPlayer.start();
        theAnimator.runAnimation({ player: theStreamPlayer, algorithm: masterInfo.algorithm });
    } else {
        thePlayer.start();
        theAnimator.runAnimation({ player: thePlayer, algorithm: masterInfo.algorithm });
    }
    showSongControlButton("button-pause");
    masterInfo.spaceFunction = () => {
        pauseFunction(thePlayer, theAnimator, theStreamPlayer);
    };
}
function pauseFunction(thePlayer, theAnimator, theStreamPlayer, killNotes) {
    if (masterInfo.streaming) {
        theStreamPlayer.stop();
        killNotes();
    } else {
        thePlayer.pause();
    }
    theAnimator.stopAnimation();
    showSongControlButton("button-play");
    masterInfo.spaceFunction = () => {
        playFunction(thePlayer, theAnimator, theStreamPlayer);
    };
}
function restartFunction(thePlayer, theAnimator, killNotes) {
    thePlayer.restart();
    theAnimator.stopAnimation();
    showSongControlButton("button-play");
    killNotes();
    masterInfo.spaceFunction = () => {
        playFunction(thePlayer, theAnimator);
    }
}

function selectSlides(n, setNumSlides) {
    const slideA = document.getElementById("slide-a");
    const slideB = document.getElementById("slide-b");
    const slidesContainer = document.getElementById("slides-container");
    
    if (n === 2) {
        
        setNumSlides(2);
        slideA.classList.add("hidden");
        slideB.classList.add("hidden");

        slidesContainer.classList.remove("three-wide-slides-container");
        slidesContainer.classList.remove("four-wide-slides-container");
    }
    if (n === 3) {
        setNumSlides(3);
        document.getElementById("slides-container").classList.add("three-wide-slides-container");
        slideA.classList.remove("hidden");
        slideB.classList.add("hidden");

        slidesContainer.classList.add("three-wide-slides-container");
        slidesContainer.classList.remove("four-wide-slides-container");
    }
    if (n === 4) {
        setNumSlides(4);
        slideA.classList.remove("hidden");
        slideB.classList.remove("hidden");

        slidesContainer.classList.remove("three-wide-slides-container");
        slidesContainer.classList.add("four-wide-slides-container");
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
    document.getElementById("slides-3").classList.add("level-selected");
    selectSlides(3, setNumSlides);
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
    addElementClass("level-2", "level-selected");
}

function activateMenu() {
    const showButton = document.getElementById("show-menu");
    const theMenu = document.getElementById("main-menu");
    setButtonClick("show-menu", () => {
        theMenu.classList.add("slide-left");
        theMenu.classList.remove("slide-right");
        showButton.classList.add("hidden");
    });
    setButtonClick("hide-menu", () => {
        theMenu.classList.add("slide-right");
        theMenu.classList.remove("slide-left");
        showButton.classList.remove("hidden");
    });
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
            setElementText("sustained-toggle", "Turn on sustained notes");
        } else {
            masterInfo.sustainedNotes = true;
            setElementText("sustained", "sustained notes ON");
            setElementText("sustained-toggle", "Turn off sustained notes");
        }
    });
    setButtonClick("toggle-animate", () => {
        if (masterInfo.animatedBackground) {
            masterInfo.animatedBackground = false;
            setElementText("animated", "animated background OFF");
            setElementText("toggle-animate", "Turn on animated background");
        } else {
            masterInfo.animatedBackground = true;
            setElementText("animated", "animated background ON");
            setElementText("toggle-animate", "Turn off animated background");
        }
    });
}