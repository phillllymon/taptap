class StreamPlayer {
    constructor(songDelay, addNote) {
        this.queue = [];
        this.started = false;
        this.current = null;
        this.muted = false;
    }

    setData(data) {
        console.log("streamPlayer data received");
        const dataObj = JSON.parse(data);
        this.queue.push({
            song: new Audio(`data:audio/x-wav;base64,${dataObj.str}`),
            notes: dataObj.notes,
            time: dataObj.time
        });
        console.log("new chunk added to queue");

        if (!this.started && this.queue.length > 1) {
            this.startNextChunk();
            console.log("starting music");
        }
    }

    startNextChunk() {
        if (this.queue.length < 1) {
            console.log("music queue empty");
        } else {
            this.current = this.queue.shift();
            if (this.muted) {
                this.current.song.volume = 0;
            }
            this.current.song.play();
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







    // // delay in ms
    // constructor(songDelay, addNote, initialSource) {
    //     this.songDelay = songDelay;
    //     this.song1 = new Audio(initialSource);
    //     this.song2 = new Audio(initialSource);
    //     this.notes1 = null;
    //     this.notes2 = null;
    //     this.time1 = 0;
    //     this.time2 = 0;
    //     this.dataReceived = false;
    //     this.currentSong = 1;
    //     this.nextSong = null;
    //     this.nextNotes = null;
    //     this.nextTime = 0;
    //     this.paused = true;
    // }

    // switchTo1() {
    //     this.song1.volume = this.paused ? 0.0 : 1.0;
    //     this.song2.pause();
    //     this.song1.play();
    //     this.currentSong = 1;
    //     setTimeout(this.populateNext, 1.1 * this.songDelay);
    //     setTimeout(() => {
    //         this.switchTo2();
    //     // }, this.time1);
    //     }, 10000);
    // }
    // switchTo2() {
    //     this.song2.volume = this.paused ? 0.0 : 1.0;
    //     this.song1.pause();
    //     this.song2.play();
    //     this.currentSong = 2;
    //     setTimeout(this.populateNext, 1.1 * this.songDelay);
    //     setTimeout(() => {
    //         this.switchTo1();
    //     // }, this.time2);
    //     }, 10000);
    // }

    // setData(data) {
    //     console.log("data received by streamPlayer");
    //     const dataObj = JSON.parse(data);
    //     this.nextSong = `data:audio/x-wav;base64,${dataObj.str}`;
    //     this.nextNotes = dataObj.notes;
    //     this.nextTime = dataObj.time;
    //     if (!this.dataReceived) {
    //         this.song1.src = this.nextSong;
    //         this.notes1 = deepCopy(this.nextNotes);
    //         this.time1 = this.nextTime;
    //         this.dataReceived = true;

    //         // EXPERIMENTAL - play when data available
    //         setTimeout(() => {
    //             this.song1.volume = 0.0;
    //             this.song2.volume = 0.0;
    //             this.switchTo1();
    //             console.log("starting music");
    //         }, 10000);
    //     } else {
    //         this.populateNext();
    //     }
    // }

    // populateNext() {
    //     if (this.currentSong === 2) {
    //         console.log("setting 1");
    //         // this.song1.src = this.nextSong;
    //         this.song1 = new Audio(this.nextSong);
    //         this.notes1 = deepCopy(this.nextNotes);
    //         this.time1 = this.nextTime;
    //         console.log("time: " + this.time1);
    //     } else {
    //         console.log("setting 2");
    //         // this.song2.src = this.nextSong;
    //         this.song2 = new Audio(this.nextSong);
    //         this.notes2 = deepCopy(this.nextNotes);
    //         this.time2 = this.nextTime;
    //         console.log("time: " + this.time2);
    //     }
    // }

    // start() {
    //     // this.currentSong.play();
    //     this.paused = false;
    //     this.song1.volume = 1.0;
    //     this.song2.volume = 1.0;
    // }

    // pause() {
    //     // this.currentSong.pause();
    //     this.paused = true;
    //     this.song1.volume = 0.0;
    //     this.song2.volume = 0.0;
    // }

}

function deepCopy(arr) {
    const answer = [];
    arr.forEach((ele) => {
        if (typeof ele === "number" || typeof ele === "string") {
            answer.push(ele);
        } else {
            answer.push(deepCopy(ele));
        }
    });
    return answer;
}