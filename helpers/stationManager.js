class StationManager {
    constructor(masterInfo, streamPlayer) {
        this.masterInfo = masterInfo;
        this.streamPlayer = streamPlayer;
        this.radioAudio = new Audio();
        this.radioAudio.crossOrigin = "anonymous";
        this.listening = false;
        
        this.chunksA = [];
        this.chunksB = [];
        this.times = {
            A: 0,
            B: 0
        }
        this.timestamp = performance.now();
        this.recorderA = null;
        this.recorderB = null;
        
        this.stations = {
            "kingFM": {
                name: "classical king FM",
                stream: "https://classicalking.streamguys1.com/king-fm-aac-128k"
            },
            "mvn925": {
                name: "movin' 92.5",
                stream: "https://23093.live.streamtheworld.com/KQMVFM.mp3?dist=hubbard&source=hubbard-web&ttag=web&gdpr=0"
            },
            "unsung80s": {
                name: "Unsung 80s",
                stream: "https://unsung80s.out.airtime.pro/unsung80s_a"
            }
        };

        this.stationInfo = this.stations["unsung80s"];
        this.activateStationSelection();
    }

    activateStationSelection() {
        const stationSelector = document.getElementById("select-station");

        const keys = Object.keys(this.stations);
        for (let i = 0; i < keys.length; i++) {
            const stationKey = keys[i];
            const newOption = document.createElement("option");
            newOption.value = stationKey;
            newOption.innerText = this.stations[stationKey].name;
            if (stationKey === "unsung80s") {
                newOption.selected = "selected";
            }
            stationSelector.appendChild(newOption);
        };

        stationSelector.addEventListener("change", () => {
            const newCode = stationSelector.value;
            this.masterInfo.radioCode = newCode;
            this.stationInfo = this.stations[newCode];
            this.radioAudio.setAttribute("src", this.stationInfo.stream);
            document.getElementById("song-label").innerText = this.stationInfo.name;
            this.masterInfo.currentSong = this.stationInfo.name;
            this.stopListening();
            this.streamPlayer.stop();
        });
    }

    stopListening() {
        this.listening = false;
    }

    startListening() {
        if (this.listening) {
            return;
        }

        document.getElementById("acquiring").style.color = "transparent";
        document.getElementById("initial-received").style.color = "transparent";
        document.getElementById("now-streaming").style.color = "transparent";
        document.getElementById("connecting-radio").classList.remove("hidden");
        document.getElementById("connecting-radio").classList.add("menu");

        this.player = new Audio();
        this.player.src = this.stationInfo.stream;
        this.player.crossOrigin = "anonymous";

        const audioCtx = new AudioContext();
        const audioSource = audioCtx.createMediaElementSource(this.player);
        const analyser = audioCtx.createAnalyser();
        audioSource.connect(analyser);
        audioCtx.setSinkId({ type: "none" });

        let dest;
        
        let stream;

        // setTimeout(() => {
        this.player.addEventListener("canplaythrough", () => {
            document.getElementById("acquiring").style.color = "gray";
            this.player.play();
            // animate();
        
            // audioCtx = new AudioContext();
            dest = audioCtx.createMediaStreamDestination();
            this.recorderA = new MediaRecorder(dest.stream);
            this.recorderB = new MediaRecorder(dest.stream);
            stream = audioCtx.createMediaStreamSource(this.player.captureStream());
            stream.connect(dest);
        
            this.recorderA.ondataavailable = (e) => {
                this.chunksA.push(e.data);
            };
            this.recorderB.ondataavailable = (e) => {
                this.chunksB.push(e.data);
            };
            this.recorderA.onstop = () => {
                const timeToUse = this.times.A;

                const blob = new Blob(this.chunksA, { type: "audio/ogg; codecs=opus" });
                this.chunksA = [];
                const reader = new FileReader();
                reader.onload = (readerE) => {
                    const str = btoa(readerE.target.result);
                    this.streamPlayer.setData(JSON.stringify({
                        str: str,
                        time: timeToUse
                    }));
                };
                reader.readAsBinaryString(blob);
            };
            this.recorderB.onstop = () => {
                const timeToUse = this.times.B;
                
                const blob = new Blob(this.chunksB, { type: "audio/ogg; codecs=opus" });
                this.chunksB = [];
                const reader = new FileReader();
                reader.onload = (readerE) => {
                    const str = btoa(readerE.target.result);
                    this.streamPlayer.setData(JSON.stringify({
                        str: str,
                        time: timeToUse
                    }));
                };
                reader.readAsBinaryString(blob);
            };
        
            this.recorderA.start();
            this.timestamp = performance.now();
            setTimeout(() => {
                this.switchToB();
            }, 10000);
            this.listening = true;
        });
    }

    switchToB() {
        this.times.B = performance.now();
        this.recorderB.start();
        const now = performance.now();
        this.times.A = now - this.timestamp;
        this.timestamp = now;
        this.recorderA.stop();
        if (this.listening) {
            setTimeout(() => {
                this.switchToA();
            }, 10000);
        }
    }
    switchToA() {
        this.times.A = performance.now();
        this.recorderA.start();
        const now = performance.now();
        this.times.B = now - this.timestamp;
        this.timestamp = now;
        this.recorderB.stop();
        if (this.listening) {
            setTimeout(() => {
                this.switchToB();
            }, 10000);
        }
    }

    
}