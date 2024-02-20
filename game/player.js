class Player {
    // delay in ms
    constructor(source, delay, fftSize, onEnd) {
        this.song1 = new Audio(source);
        this.song2 = new Audio(source);
        this.playing1 = false;
        this.playing2 = false;
        this.timeStarted = false;
        this.adjustment = 0; // adjustment for player timing calibration
        this.timeToStart2 = delay + this.adjustment; // set to smaller value if we pause before song2 has started
        this.song2Timeout = false;
        this.delay = delay;
        this.calibrating = false;

        this.song1.addEventListener("ended", () => {
            this.playing1 = false;
        });
        this.song2.addEventListener("ended", () => {
            this.playing2 = false;
            this.timeToStart2 = delay;
            onEnd();
        });
        this.waiting = false;

        const audioCtx = new AudioContext();
        // audioCtx.destination = { playSound: false };
        const audioSource = audioCtx.createMediaElementSource(this.song1);
        this.analyser = audioCtx.createAnalyser();
        audioSource.connect(this.analyser);
        audioCtx.setSinkId({ type: "none" });
        this.analyser.connect(audioCtx.destination);
        this.analyser.fftSize = fftSize;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    }

    start(calibrating = false) {
        this.calibrating = calibrating;
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
        this.timeToStart2 = this.delay + this.adjustment;
        this.song1.currentTime = 0;
        this.song2.currentTime = 0;
    }

    setSource(songData) {
        this.restart();
        this.song1.setAttribute("src", songData);
        this.song2.setAttribute("src", songData);
    }

    getDataArray() {
        this.analyser.getByteFrequencyData(this.dataArray);
        return this.dataArray;
    }

    setVolume(val) {
        this.song2.volume = val;
    }

    setAdjustment(val) {
        this.adjustment = val;
    }

    // methods for streaming mode
    setSourceStream(songData) {
        this.sourceWaiting = songData;
    }
}