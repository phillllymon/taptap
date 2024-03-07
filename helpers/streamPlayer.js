class StreamPlayer {
    constructor(songDelay) {
        this.songDelay = songDelay;
        this.queue = [];
        this.started = false;
        this.current = null;
        this.muted = false;

        this.freqArrays = [];
        this.times = [];

        this.blobStreaming = false;
        this.blobs = [];
    }

    calibrateLag() {
        const delayInSeconds = 1.0 * this.songDelay / 1000;
        if (this.player && this.silentPlayer.currentTime > delayInSeconds) {
            this.silentPlayer.currentTime = this.player.currentTime + delayInSeconds;
        }
        if (this.current && this.current.silentSong.currentTime > delayInSeconds) {
            this.current.silentSong.currentTime = this.current.song.currentTime + delayInSeconds;
        }
    }

    playOnDelay(songObj) {
        songObj.silentSong.play();
        const thisObj = this;
        setTimeout(() => {
            thisObj.currentAudio = songObj.song;
            songObj.song.play();
        }, this.songDelay);
    }

    getDataFreqArray() {
        if (this.silentPlayer) {
            this.analyser.getByteFrequencyData(this.dataArray);

            this.freqArrays.push(this.dataArray.map(val => val));
            const now = performance.now();
            this.times.push(now);
            while (this.times[0] < now - this.delay) {
                this.times.shift();
                this.freqArrays.shift();
            }

            return this.dataArray;
        } else {
            if (this.current && !this.muted) {
                this.current.analyser.getByteFrequencyData(this.current.dataArray);
                
                this.freqArrays.push(this.current.dataArray.map(val => val));
                const now = performance.now();
                this.times.push(now);
                while (this.times[0] < now - this.delay) {
                    this.times.shift();
                    this.freqArrays.shift();
                }

                return this.current.dataArray;
            } else {
                return [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
            }
        }
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

    getAdjustmentData() {
        this.analyser.getByteFrequencyData(this.dataArray);
        this.dataArrays.push(this.dataArray);
        this.nextAnalyser.getByteFrequencyData(this.nextDataArray);
        this.nextDataArrays.push(this.nextDataArray);

        if (performance.now() - this.dataStartTime < 1000) {
            // console.log("HERE");
            requestAnimationFrame(() => {
                setTimeout(() => {

                    this.getAdjustmentData();
                }, 0);
            });
        } else {
            // now our arrays are populated, analyze them
            const numPoints = this.dataArrays.length;
            const bArr = this.nextDataArrays.slice(Math.floor(0.25 * numPoints), Math.floor(0.75 * numPoints));
            const numSteps = numPoints - bArr.length;

            let smallestFound = 1000000;
            let stepsNeeded = 0;
            for (let i = 0; i < numSteps; i++) {
                let total = 0;
                for (let j = 0; j < bArr.length; j++) {
                    const bVal = bArr[j];
                    const aVal = this.dataArrays[i + j];
                    let diff = bVal - aVal;
                    if (diff < 0) {
                        diff *= -1;
                    }
                    total += diff;
                }
                if (total < smallestFound) {
                    smallestFound = total;
                    stepsNeeded = i - Math.floor(numSteps / 2);
                }
            }
            const timePerStep = 1000.0 / numSteps;
            const msNeeded = timePerStep * stepsNeeded;
            this.syncAdjustment = msNeeded / -1000.0;
        }
    }

    startSyncAdjustment() {
        this.dataStartTime = performance.now();
        this.dataArrays = [];
        this.nextDataArrays = [];
        this.dataTimes = [];
        this.analyser.getByteFrequencyData(this.dataArray);
        console.log(this.dataArray);
        this.getAdjustmentData();
    }

    startNextRecording() {
        console.log(this.nextDelay);
        this.nextSilentPlayer.volume = 0;
        this.nextSilentPlayer.currentTime = this.silentPlayer.currentTime - (1.0 * this.nextDelay / 1000);
        this.nextSilentPlayer.play();

        this.syncAdjustment = 0;
        this.startSyncAdjustment();
        // timeout for sync delay correction analysis
        setTimeout(() => {

            this.nextSilentPlayer.currentTime = this.silentPlayer.currentTime + this.syncAdjustment;
            this.nextSilentPlayer.play();
            this.nextSilentPlayer.volume = 1;
            this.silentPlayer.volume = 0;
            this.silentPlayer = this.nextSilentPlayer;
            this.analyser = this.nextAnalyser;
            this.dataArray = this.nextDataArray;
        }, 2000);

        // console.log(this.nextDelay);
        // this.nextSilentPlayer.volume = 0;
        // this.nextSilentPlayer.currentTime = this.silentPlayer.currentTime - (1.0 * this.nextDelay / 1000);
        // this.nextSilentPlayer.play();
        // this.nextSilentPlayer.volume = 1;
        // // this.silentPlayer.pause();
        // this.silentPlayer.volume = 0;
        // this.silentPlayer = this.nextSilentPlayer;
        // this.analyser = this.nextAnalyser;

        setTimeout(() => {
            console.log("CHANGE PLAYER " + this.nextDelay);
            this.nextPlayer.volume = 0;
            this.nextPlayer.currentTime = this.player.currentTime - (1.0 * this.nextDelay / 1000) + this.syncAdjustment;
            this.nextPlayer.play();
            this.nextPlayer.volume = this.player.volume;
            this.player.volume = 0;
            this.player = this.nextPlayer;
        }, 4000);
        setTimeout(() => {
            this.startNextRecording();
        }, this.nextDelay);
    }

    setData(data, blobStream = false) {
        console.log("data received");
        if (!this.started) {
            document.getElementById("initial-received").style.color = "gray";
        }
        if (data.timeDelay) {
            console.log("timeDelay recognized");
            if (this.player) {
                console.log("already have a player");
                const newPlayer = new Audio(`data:audio/x-wav;base64,${data.str}`);
                const newSilentPlayer = new Audio(`data:audio/x-wav;base64,${data.str}`);

                const audioCtx = new AudioContext();
                const audioSource = audioCtx.createMediaElementSource(newSilentPlayer);
                this.nextAnalyser = audioCtx.createAnalyser();
                audioSource.connect(this.nextAnalyser);
                audioCtx.setSinkId({ type: "none" });
                this.nextAnalyser.connect(audioCtx.destination);
                this.nextAnalyser.fftSize = 32;
                this.nextDataArray = new Uint8Array(this.nextAnalyser.frequencyBinCount);

                const assignNexts = () => {
                    newSilentPlayer.removeEventListener("canplaythrough", assignNexts);
                    this.nextPlayer = newPlayer;
                    this.nextSilentPlayer = newSilentPlayer;
                    this.nextDelay = data.timeDelay;
                };
                newSilentPlayer.addEventListener("canplaythrough", assignNexts);

            } else {
                console.log("making new player");
                this.player = new Audio(`data:audio/x-wav;base64,${data.str}`);
                this.silentPlayer = new Audio(`data:audio/x-wav;base64,${data.str}`);

                const audioCtx = new AudioContext();
                const audioSource = audioCtx.createMediaElementSource(this.silentPlayer);
                this.analyser = audioCtx.createAnalyser();
                audioSource.connect(this.analyser);
                audioCtx.setSinkId({ type: "none" });
                this.analyser.connect(audioCtx.destination);
                this.analyser.fftSize = 32;
                this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

                const startPlaying = () => {
                    this.silentPlayer.removeEventListener("canplaythrough", startPlaying);
                    console.log("should hear music in 9 seconds");
                    document.getElementById("now-streaming").style.color = "gray";
                    setTimeout(() => {
                        this.silentPlayer.play();
                        setTimeout(() => {
                            this.player.play();
                            document.getElementById("connecting-radio").classList.add("hidden");
                        }, 4000);
                        setTimeout(() => {
                            this.startNextRecording();
                        }, 10000);
                    }, 5000);
                };
                this.silentPlayer.addEventListener("canplaythrough", startPlaying);
            }


            return;
        }
        if (blobStream) { // accept blobs only the first of which can be the start of a sound file
            let newData = true;
            this.blobs.push(data);

            console.log(this.blobs.length);

            const blobToUse = new Blob(this.blobs, { type: "audio/ogg; codecs=opus" });
            const reader = new FileReader();
            reader.onload = (readerE) => {
                const str = btoa(readerE.target.result);
                const newPlayer = new Audio(`data:audio/x-wav;base64,${str}`);
                const newSilentPlayer = new Audio(`data:audio/x-wav;base64,${str}`);

                const audioCtx = new AudioContext();
                const audioSource = audioCtx.createMediaElementSource(newSilentPlayer);
                this.analyser = audioCtx.createAnalyser();
                audioSource.connect(this.analyser);
                audioCtx.setSinkId({ type: "none" });
                this.analyser.connect(audioCtx.destination);
                this.analyser.fftSize = 32;
                this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

                newSilentPlayer.addEventListener("canplaythrough", () => {
                    if (newData) {
                        if (this.player) {
                            newPlayer.volume = 0;
                            newSilentPlayer.volume = 0;
                            newPlayer.currentTime = this.player.currentTime;
                            newSilentPlayer.currentTime = this.silentPlayer.currentTime;
                            newPlayer.play();
                            newSilentPlayer.play();
                            newPlayer.volume = this.player.volume;
                            newSilentPlayer.volume = 1;
                            this.player.volume = 0;
                            this.silentPlayer.volume = 0;
                            this.player = newPlayer;
                            this.silentPlayer = newSilentPlayer;
                        } else {
                            this.silentPlayer = newSilentPlayer;
                            this.player = newPlayer;

                            setTimeout(() => {
                                this.silentPlayer.play();
                                setTimeout(() => {
                                    this.player.play();
                                    document.getElementById("connecting-radio").classList.add("hidden");
                                }, 4000);
                                document.getElementById("now-streaming").style.color = "gray";
                            }, 4000);
                        }
                        newData = false;
                    }
                });

            };
            reader.readAsBinaryString(blobToUse);

            this.started = true;
            return;
        } else {
            this.liveStreaming = false;
        }
        const dataObj = JSON.parse(data);

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

        this.queue.push(newSongObj);
        console.log("new chunk added to queue");

        if (!this.started && this.queue.length > 1) {
            console.log("starting music " + this.queue.length);
            this.startNextChunk();
            document.getElementById("now-streaming").style.color = "gray";
            setTimeout(() => {
                document.getElementById("connecting-radio").classList.add("hidden");
            }, 2000);
        }
    }

    startNextChunk() {
        if (this.queue.length < 1) {
            console.log("music queue empty " + this.queue.length);
            document.getElementById("song-label").innerText = "stream ended";
            // this.started = false;
        } else {
            this.current = this.queue.shift();
            
            this.playOnDelay(this.current);
            if (this.muted) {
                this.current.song.volume = 0;
            }
            console.log(this.current.time);

            setTimeout(() => {
                this.startNextChunk();
            }, this.current.time);
    
            this.started = true;
        }
    }

    setVolume(val) {
        if (this.currentAudio) {
            this.currentAudio.volume = val;
        }
        if (this.current) {
            this.current.song.volume = val;
        }
        if (this.player) {
            this.player.volume = val;
        }
    }

    start() {
        this.muted = false;
        this.setVolume(1);
    }

    stop() {
        this.muted = true;
        this.setVolume(0);
    }
}