class MenuManager {
    constructor(masterInfo, controlsManager, player) {
        this.masterInfo = masterInfo;
        this.controlsManager = controlsManager;
        this.player = player;
        this.menus = [
            "source-menu",
            "main-menu",
            "feedback"
        ];
        this.mainMenuOptions = [
            "choose-song-button",
            "upload-song-button",
            "show-stream-modal-button"
        ];

        this.activateMenuShowButtons();
        this.activateSourceMenuButtons();

        this.activateMainMenu();
        this.activateFeedbackMenu();

        this.showMenu("source-menu");
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
            this.controlsManager.playFunction();
        });
    }

    activateSourceMenuButtons() {
        setButtonClick("source-demo-songs", () => {
            this.masterInfo.songMode = "demo";
            this.setMainMenuOption("choose-song-button");
            this.showMenu("main-menu");
        });
        setButtonClick("source-upload", () => {
            this.masterInfo.songMode = "upload";
            this.setMainMenuOption("upload-song-button");
            this.showMenu("main-menu");
        });
        setButtonClick("source-radio", () => {
            this.masterInfo.songMode = "radio";
            alert("Radio coming soon!");
            // this.setMainMenuOption("radio-station-button");
            // this.showMenu("main-menu");
        });
        setButtonClick("source-streaming", () => {
            this.masterInfo.songMode = "stream";
            this.setMainMenuOption("show-stream-modal-button");
            this.showMenu("main-menu");
            showModal("stream");
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