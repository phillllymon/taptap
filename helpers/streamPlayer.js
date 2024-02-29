class StreamPlayer {
    // delay in ms
    constructor(songDelay, addNote) {
        this.songDelay = songDelay;
        this.song1 = new Audio();
        this.song2 = new Audio();
        this.notes1 = null;
        this.notes2 = null;
        this.dataReceived = false;
        this.currentSong = this.song1;
        this.nextSong = null;
        this.nextNotes = null;
        this.playing = false;

        this.song1.addEventListener("ended", () => {
            this.song2.play();
            this.currentSong = this.song2;
            setTimeout(this.populateNext, 1.1 * this.songDelay);
        });
        this.song2.addEventListener("ended", () => {
            this.song1.play();
            this.currentSong = this.song1;
            setTimeout(this.populateNext, 1.1 * this.songDelay);
        });
    }

    setData(data) {
        console.log("data received by streamPlayer");
        console.log(typeof data);
        try {

            const dataObj = JSON.parse(data);
            this.nextSong = `data:audio/x-wav;base64,${dataObj.str}`;
            this.nextNotes = dataObj.notes;
            if (!this.dataReceived) {
                this.song1.src = this.nextSong;
                this.notes1 = this.nextNotes;
                this.dataReceived = true;
    
                this.start();
    
            } else {
                if (!this.playing) {
                    this.populateNext();
                }
            }
        } catch (err) {
            console.log(err.message);
        }
    }

    populateNext() {
        if (this.currentSong === this.song2) {
            this.song1.src = this.nextSong;
            this.notes1 = this.nextNotes;
        } else {
            this.song2.src = this.nextSong;
            this.notes2 = this.nextNotes;
        }
    }

    start() {
        this.currentSong.play();
    }

    pause() {
        this.currentSong.pause();
    }

}