class MenuManager {
    constructor(masterInfo, controlsManager, player, stationManager, streamPlayer) {
        this.masterInfo = masterInfo;
        this.controlsManager = controlsManager;
        this.stationManager = stationManager;
        this.player = player;
        this.streamPlayer = streamPlayer;
        this.menus = [
            "source-menu",
            "main-menu",
            "feedback"
        ];
        this.mainMenuOptions = [
            "choose-song-button",
            "upload-song-button",
            "select-station-button",
            "show-stream-modal-button"
        ];

        this.activateMenuShowButtons();
        this.activateSourceMenuButtons();

        this.activateMainMenu();
        this.activateFeedbackMenu();
        this.activateGiveFeedbackMenu();

        this.showMenu("source-menu");
    }

    activateGiveFeedbackMenu() {
        setButtonClick("open-feedback-link", () => {
            userFeedbackOpen = true;
            document.getElementById("give-feedback-modal").classList.remove("hidden");
            document.getElementById("give-feedback-modal").classList.add("menu");
        });
        setButtonClick("cancel-give-feedback", () => {
            document.getElementById("give-feedback-modal").classList.add("hidden");
            document.getElementById("give-feedback-modal").classList.remove("menu");
            userFeedbackOpen = false;
        });
        setButtonClick("submit-give-feedback", () => {
            const message = document.getElementById("feedback-message").value;
            if (message.length < 3) {
                alert("Cannot submit empty message!");
            } else {
                let email = document.getElementById("feedback-email").value;
                if (email.length < 1) {
                    email = "none";
                }
                fetch("https://beatburner.com/api/feedback.php", {
                    method: "POST",
                    body: JSON.stringify({
                        message: message,
                        email: email
                    })
                }).then(() => {
                    document.getElementById("feedback-message").value = "";
                    document.getElementById("feedback-email").value = "";
                    document.getElementById("give-feedback-modal").classList.add("hidden");
                    document.getElementById("give-feedback-modal").classList.remove("menu");
                    userFeedbackOpen = false;
                    alert("Thanks!");
                });
            }
        });
    }

    activateFeedbackMenu() {
        setButtonClick("replay", () => {
            this.player.restart();
            this.controlsManager.playFunction();
            this.hideMenus();
        });
        setButtonClick("no-replay", () => {
            this.showMenu("main-menu");
        });
    }

    activateMainMenu() {
        setButtonClick("close-and-play", () => {
            this.hideMenus();
            if (this.masterInfo.songMode === "radio") {
                this.stationManager.startListening();
            } else {
                this.controlsManager.playFunction();
            }
        });
    }

    activateSourceMenuButtons() {
        setButtonClick("source-demo-songs", () => {
            this.masterInfo.songMode = "demo";
            this.setMainMenuOption("choose-song-button");
            this.showMenu("main-menu");
            if (this.masterInfo.songMode === "radio") {
                this.stationManager.stopListening();
            }
        });
        setButtonClick("source-upload", () => {
            this.masterInfo.songMode = "upload";
            this.setMainMenuOption("upload-song-button");
            this.showMenu("main-menu");
            if (this.masterInfo.songMode === "radio") {
                this.stationManager.stopListening();
            }
        });
        setButtonClick("source-radio", () => {
            this.masterInfo.songMode = "radio";
            this.setMainMenuOption("select-station-button");
            this.showMenu("main-menu");
            this.masterInfo.currentSong = "Unsung 80s";
        });
        setButtonClick("source-streaming", () => {
            this.masterInfo.songMode = "stream";
            this.setMainMenuOption("show-stream-modal-button");
            this.showMenu("main-menu");
            showModal("stream");
            if (this.masterInfo.songMode === "radio") {
                this.stationManager.stopListening();
            }
        });

        // putting this here just because
        setButtonClick("show-stream-modal-button", () => {
            showModal("stream");
        });
    }

    setMainMenuOption(optionId) {
        this.mainMenuOptions.forEach((optId) => {
            document.getElementById(optId).classList.add("hidden");
        });
        document.getElementById(optionId).classList.remove("hidden");
    }

    activateMenuShowButtons() {
        setButtonClick("show-menu", () => {
            this.showMenu("main-menu");
            this.player.countdownCanceled = true;
        });
        setButtonClick("show-source-menu", () => {
            this.showMenu("source-menu");
            this.player.pause();
            this.streamPlayer.stop();
            this.stationManager.stopListening();
        });
    }

    showMenu(menuId) {
        this.hideMenus();
        document.getElementById(menuId).classList.remove("hidden");
    }

    hideMenus() {
        this.menus.forEach((menuId) => {
            document.getElementById(menuId).classList.add("hidden");
        });
    }


    
}