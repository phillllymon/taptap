class ControlsManager {
    constructor(masterInfo, player, streamPlayer, animator) {
        this.player = player;
        this.animator = animator;
        this.masterInfo = masterInfo;
        this.streamPlayer = streamPlayer;
        this.activateFullscreen();
        this.activateSettings();
        this.activateLevelSelector();
        this.activateSlidesSelector((newVal) => {this.animator.setNumSlides(newVal)});
        this.activateSongControls();
        this.activateSongSelection();
        this.activateCalibration();
    }

    activateCalibration() {
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

    activateSongSelection() {
        const songSelector = document.getElementById("select-song");
        
        songSelector.addEventListener("change", () => {
            const newValue = songSelector.value;
            this.masterInfo.currentSong = newValue;
            this.animator.stopAnimation();
            this.player.pause();
            this.player.setSource(`./songs/${this.masterInfo.currentSong}.m4a`);
            showSongControlButton("button-play");
            document.getElementById("song-label").innerText = newValue;
            hideModal("choose");
            killAllNotes();
            resetAutoAdjustment();
        });
        
        document.getElementById("file-input").addEventListener("change", (e) => {
            this.player.pause();
            this.animator.stopAnimation();
        
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (readerE) => {
                const str = btoa(readerE.target.result);
                const newSongData = `data:audio/x-wav;base64,${str}`;
                
                this.animator.stopAnimation();
                this.player.pause();
                this.player.setSource(newSongData);
                showSongControlButton("button-play");
                hideModal("choose");
                killAllNotes();
                resetAutoAdjustment();
                
                this.masterInfo.currentSong = e.target.files[0].name;
                document.getElementById("song-label").innerText = this.masterInfo.currentSong;
            };
            reader.readAsBinaryString(file);
        });
    }

    activateSongControls() {
        setButtonClick("button-play", () => {
            this.playFunction();
        });
        setButtonClick("button-pause", () => {
            this.pauseFunction();
        });
        setButtonClick("button-restart", () => {
            this.restartFunction()
        });
        masterInfo.spaceFunction = () => {
            this.playFunction();
        };
    }
    
    playFunction() {
        if (masterInfo.streaming) {
            this.streamPlayer.start();
            this.animator.runAnimation({ player: this.streamPlayer, algorithm: this.masterInfo.algorithm });
        } else {
            this.player.start();
            this.animator.runAnimation({ player: this.player, algorithm: this.masterInfo.algorithm });
        }
        showSongControlButton("button-pause");
        masterInfo.spaceFunction = () => {
            this.pauseFunction();
        };
    }
    pauseFunction() {
        if (masterInfo.streaming) {
            this.streamPlayer.stop();
            killAllNotes();
        } else {
            this.player.pause();
        }
        this.animator.stopAnimation();
        showSongControlButton("button-play");
        masterInfo.spaceFunction = () => {
            this.playFunction();
        };
    }
    restartFunction() {
        this.player.restart();
        this.animator.stopAnimation();
        showSongControlButton("button-play");
        killAllNotes();
        masterInfo.spaceFunction = () => {
            this.playFunction();
        }
    }

    activateSlidesSelector(setNumSlides) {
        [
            ["slides-2", 2],
            ["slides-3", 3],
            ["slides-4", 4]
        ].forEach((slideSet) => {
            const slidesButton = document.getElementById(slideSet[0]);
            slidesButton.addEventListener("click", () => {
                this.deselectSlides();
                this.selectSlides(slideSet[1], setNumSlides);
                slidesButton.classList.add("level-selected");
            })
        });
        document.getElementById("slides-3").classList.add("level-selected");
        this.selectSlides(3, setNumSlides);
    }

    deselectSlides() {
        ["slides-2", "slides-3", "slides-4"].forEach((num) => {
            document.getElementById(num).classList.remove("level-selected");
        });
    }

    selectSlides(n, setNumSlides) {
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

    activateLevelSelector() {
        [
            // ["level-1", 2],
            // ["level-2", 4],
            // ["level-3", 6],
            // ["level-4", 8],
            // ["level-5", 10]
            ["level-1", 1],
            ["level-2", 2],
            ["level-3", 3],
            ["level-4", 5],
            ["level-5", 8]
        ].forEach((levelSet) => {
            setButtonClick(levelSet[0], () => {
                ["level-1", "level-2", "level-3", "level-4", "level-5"].forEach((level) => {
                    removeElementClass(level, "level-selected");
                });
                this.animator.setNotesPerSecond(levelSet[1]);
                addElementClass(levelSet[0], "level-selected");
            });
        });
        addElementClass("level-2", "level-selected");
    }

    activateSettings() {
        setButtonClick("show-settings", () => {
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
            setElementText(keyInfo[i][1], this.masterInfo.tapperKeys[i]);
            setButtonClick(keyInfo[i][0], () => {
                setElementText(keyInfo[i][1], "-");
                document.getElementById("save-settings").disabled = true;
                this.masterInfo.waitingForKey = ([keyInfo[i][1], i]);
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

    activateFullscreen() {
        setButtonClick("full-screen", () => {
            this.toggleFullscreen();
        });
        document.addEventListener("fullscreenchange", () => {
            if (document.isFullscreen) {
                document.isFullscreen = false;
                ["full-top-left-quad", "full-top-right-quad", "full-bottom-left-quad", "full-bottom-right-quad"].forEach((eleId) => {
                    document.getElementById(eleId).classList.remove("turned-inward");
                });
            } else {
                document.isFullscreen = true;
                ["full-top-left-quad", "full-top-right-quad", "full-bottom-left-quad", "full-bottom-right-quad"].forEach((eleId) => {
                    document.getElementById(eleId).classList.add("turned-inward");
                });
            }
            this.recalculateLengths();
        });
    }

    toggleFullscreen() {
        return new Promise((resolve) => {
            if (document.isFullscreen) {
                document.exitFullscreen().then(() => {
                    resolve();
                });
            } else {
                document.getElementById("game-container").requestFullscreen().then(() => {
                    resolve();
                });
            }
        });
    }

    recalculateLengths() {
        setTimeout(() => {

            if (detectMobile()) {
                const viewHeight = document.getElementById("game-container").clientHeight;
                masterInfo.travelLength = gameDataConst.mobile.travelLength * viewHeight;
    
                const newNoteSpeed = Math.floor(masterInfo.travelLength / ( (masterInfo.songDelay / 1000) / 2 ));
                masterInfo.targetBounds.top = gameDataConst.mobile.targetBounds.top * masterInfo.travelLength;
                masterInfo.targetBounds.bottom = gameDataConst.mobile.targetBounds.bottom * masterInfo.travelLength;
                masterInfo.noteSpeed = newNoteSpeed;
                masterInfo.maxTailLength = 1.0 * gameDataConst.mobile.maxTailLength * masterInfo.travelLength;
                masterInfo.slideLength = masterInfo.travelLength * 1.3;
            } else {
    
                const viewH = document.getElementById("game-container").clientHeight;
                const viewW = document.getElementById("game-container").clientWidth;
                let min = Math.min(viewW, viewH);
    
                masterInfo.vMin = min;
    
                masterInfo.slideLength = 1.5 * min;
                masterInfo.travelLength = 1.365 * min;
                const newNoteSpeed = 1.0 * masterInfo.travelLength / ( (masterInfo.songDelay / 1000) / 2 );
                masterInfo.targetBounds.top = gameDataConst.mobile.targetBounds.top * masterInfo.travelLength;
                masterInfo.targetBounds.bottom = gameDataConst.mobile.targetBounds.bottom * masterInfo.travelLength;
                masterInfo.noteSpeed = newNoteSpeed;
                masterInfo.maxTailLength = 1.0 * gameDataConst.mobile.maxTailLength * masterInfo.travelLength;
                masterInfo.slideLength = masterInfo.travelLength * 1.3;
            }
        }, 500)
    }
}