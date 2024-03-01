class StreamPlayer {
    constructor(songDelay) {
        this.songDelay = songDelay;
        this.queue = [];
        this.started = false;
        this.current = null;
        this.muted = false;
    }

    calibrateLag() {
        const delayInSeconds = 1.0 * this.songDelay / 1000;
        if (this.current.silentSong.currentTime > delayInSeconds) {
            this.current.silentSong.currentTime = this.current.song.currentTime + delayInSeconds;
        }
    }

    playOnDelay(songObj) {
        songObj.silentSong.play();
        setTimeout(() => {
            songObj.song.play();
        }, this.songDelay);
    }

    getDataArray() {
        if (this.current && !this.muted) {
            this.current.analyser.getByteFrequencyData(this.current.dataArray);
            return this.current.dataArray;
        } else {
            return [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
        }
    }

    setData(data) {
        console.log("streamPlayer data received");
        const dataObj = JSON.parse(data);

        // old
        // const newSongObj = {
        //     song: new Audio(`data:audio/x-wav;base64,${dataObj.str}`),
        //     notes: dataObj.notes,
        //     time: dataObj.time
        // };

        // EXPERIMENT
        const audioCtx = new AudioContext();
        const silentSong = new Audio(`data:audio/x-wav;base64,${dataObj.str}`);
        const audioSource = audioCtx.createMediaElementSource(silentSong);
        const analyser = audioCtx.createAnalyser();
        audioSource.connect(analyser);
        audioCtx.setSinkId({ type: "none" });
        analyser.connect(audioCtx.destination);
        analyser.fftSize = 32;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const newSongObj = {
            song: new Audio(`data:audio/x-wav;base64,${dataObj.str}`),
            notes: dataObj.notes,
            time: dataObj.time,
            silentSong: silentSong,
            analyser: analyser,
            dataArray: dataArray
        };
        // END EXPERIMENT

        this.queue.push(newSongObj);
        console.log("new chunk added to queue");

        if (!this.started && this.queue.length > 1) {
            this.startNextChunk();
            console.log("starting music");
            document.getElementById("song-label").innerText = "streaming";
        }
    }

    startNextChunk() {
        if (this.queue.length < 1) {
            console.log("music queue empty");
        } else {
            this.current = this.queue.shift();
            // this.current.song.play();
            this.playOnDelay(this.current);
            if (this.muted) {
                this.current.song.volume = 0;
            }
            setTimeout(() => {
                this.startNextChunk();
            }, this.current.time);
    
            this.started = true;
        }
    }

    start() {
        this.muted = false;
        this.current.song.volume = 1;
    }

    stop() {
        this.muted = true;
        this.current.song.volume = 0;
    }
}