class ControlsManager {
    constructor(masterInfo, streamPlayer) {
        this.masterInfo = masterInfo;
        this.streamPlayer = streamPlayer;
        this.activateFullscreen();
        this.activateMenuButtons();
    }

    activateMenuButtons() {
        setButtonClick("stream-mode", () => {
            if (this.masterInfo.streaming) {
                this.masterInfo.streaming = false;
                this.streamPlayer.stop();
            } else {
                showModal("stream");
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
                ["full-top-left", "full-top-right", "full-bottom-left", "full-bottom-right"].forEach((eleId) => {
                    document.getElementById(eleId).innerHTML = "&#8689;";
                });
            } else {
                document.isFullscreen = true;
                ["full-top-left", "full-top-right", "full-bottom-left", "full-bottom-right"].forEach((eleId) => {
                    document.getElementById(eleId).innerHTML = "&#8690;";
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