class Player {
    // delay in ms
    constructor(masterInfo, source, fftSize, onEnd) {
        this.masterInfo = masterInfo;
        this.song1 = new Audio(source);
        this.song2 = new Audio(source);
        this.playing1 = false;
        this.playing2 = false;
        this.timeStarted = false;
        this.song2Timeout = false;
        this.delay = masterInfo.songDelay;
        this.timeToStart2 = this.delay;

        this.song1.addEventListener("ended", () => {
            this.playing1 = false;
        });
        this.song2.addEventListener("ended", () => {
            this.playing2 = false;
            this.timeToStart2 = this.delay;
            onEnd();
        });
        
        this.waiting = false;
        this.countdownCanceled = false;

        const audioCtx = new AudioContext();
        // audioCtx.destination = { playSound: false };
        const audioSource = audioCtx.createMediaElementSource(this.song1);
        this.analyser = audioCtx.createAnalyser();
        audioSource.connect(this.analyser);
        audioCtx.setSinkId({ type: "none" });
        this.analyser.connect(audioCtx.destination);
        this.analyser.fftSize = fftSize;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

        // For delayed frequency array requests
        this.freqArrays = [];
        this.times = [];
    }

    countdown() {
        const rockLabel = document.getElementById("rock-label");
        rockLabel.classList.add("countdown-label");
        rockLabel.innerText = "Ready";
        this.countdownCanceled = false;
        setTimeout(() => {
            if (!this.countdownCanceled) {
                rockLabel.innerText = "3";
            } else {
                rockLabel.classList.remove("countdown-label");
            }
        }, 1000);
        setTimeout(() => {
            if (!this.countdownCanceled) {
                rockLabel.innerText = "2";
            } else {
                rockLabel.classList.remove("countdown-label");
            }
        }, 2000);
        setTimeout(() => {
            if (!this.countdownCanceled) {
                rockLabel.innerText = "1";
            } else {
                rockLabel.classList.remove("countdown-label");
            }
        }, 3000);
        setTimeout(() => {
            if (!this.countdownCanceled) {
                rockLabel.innerText = "";
            }
            rockLabel.classList.remove("countdown-label");
        }, 4000);
    }

    start() {
        if (this.masterInfo.songAtStart) {
            this.countdown();
        }
        this.masterInfo.songAtStart = false;
        this.song1.play();
        this.playing1 = true;
        this.timeStarted = performance.now();
        if (this.timeToStart2) {
            this.song2Timeout = setTimeout(() => {
                this.song2.play();
                this.playing2 = true;
                this.timeToStart2 = false;
                this.waiting = false;
            }, this.timeToStart2);
            this.waiting = true;
        } else {
            this.song2.play();
            this.playing2 = true;
        }

    }

    pause() {
        if (this.playing2) {
            this.song2.pause();
            this.playing2 = false;
            this.song1.pause();  // no harm if it's already ended
            this.playing1 = false;
        } else {
            if (this.song1.playing) {
                this.song1.pause();
                this.song1.playing = false;
                clearTimeout(this.song2Timeout);
                this.timeToStart2 = performance.now() - timeStarted;
            }
        }
        this.countdownCanceled = true;
    }

    restart() {
        this.song1.pause();
        this.song2.pause();
        this.playing1 = false;
        this.playing2 = false;
        if (this.waiting) {
            clearTimeout(this.song2Timeout);
            this.waiting = false;
        }
        this.timeToStart2 = this.delay;
        this.song1.currentTime = 0;
        this.song2.currentTime = 0;
        this.masterInfo.songAtStart = true;
        this.countdownCanceled = true;
    }

    setSource(songData) {
        this.restart();
        this.song1.setAttribute("src", songData);
        this.song2.setAttribute("src", songData);
        this.masterInfo.songAtStart = true;
    }

    getDataFreqArray() {
        this.analyser.getByteFrequencyData(this.dataArray);

        this.freqArrays.push(this.dataArray.map(val => val));
        const now = performance.now();
        this.times.push(now);
        while (this.times[0] < now - this.delay) {
            this.times.shift();
            this.freqArrays.shift();
        }

        return this.dataArray;
    }

    getDataFreqArrayDelayed(delay = 2000) {

        let i = 0;
        while (performance.now() - delay > this.times[i]){
            i += 1;
            if (!this.times[i]) {
                break;
            }
        }
        if (this.times[i]) {
            return this.freqArrays[i];
        } else {
            return [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
        }
    }

    setVolume(val) {
        this.song2.volume = val;
    }

    calibrateLag() {
        const delayInSeconds = 1.0 * this.delay / 1000;
        if (this.song1.currentTime > delayInSeconds) {  // just check to make sure we're playing song2 yet
            this.song1.currentTime = this.song2.currentTime + delayInSeconds;
        }
    }
}