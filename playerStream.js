class PlayerStream {
    // will fetch audio as well as notes data; responsible for playing and timing both
    // delay in ms
    constructor(delay, addNote) {
        this.audioA = new Audio();
        this.audioB = new Audio();
        this.notesA = [];
        this.notesB = [];
        this.playing = false;
        this.current = "A";
        this.dt = 6000;
        this.switchTime = 10000;
        this.dataStarted = false;
        this.delay = delay;
        this.addNote = addNote;
        this.overlap = false;

        getFromDatabase("streamData").then((val) => {
            console.log("back from database");
            const retrievedObj = JSON.parse(val);
            const strToUse = retrievedObj.str;
            this.audioA.src = `data:audio/x-wav;base64,${strToUse}`;
            this.notesA = retrievedObj.data;

            // temp
            // this.audioB.src = `data:audio/x-wav;base64,${strToUse}`;
            // this.notesB = retrievedObj.data;
            // end temp

            console.log("A ready");
            this.dataStarted = true;
        });
    }

    play() {
        if (this.dataStarted) {
            if (this.current === "A") {
                this.playOnDelay(this.audioA);
                this.addFutureNotes(this.notesA);
            } else {
                this.playOnDelay(this.audioB);
                this.addFutureNotes(this.notesB);
            }
            this.wait = setTimeout(() => {
                this.switchTo(this.current === "A" ? "B" : "A");
            }, this.switchTime);
        }
        this.poll = setInterval(() => {
            getFromDatabase("streamData").then((res) => {
                const obj = JSON.parse(res);

                const overlapDelay = this.overlap ? this.delay : 0;
                setTimeout(() => {
                    (this.current === "A" ? this.audioB : this.audioA).src = `data:audio/x-wav;base64,${obj.str}`;
                    if (this.current === "A") {
                        this.notesB = obj.data;
                    } else {
                        this.notesA = obj.data;
                    }
                }, overlapDelay);

            });
        }, this.dt);
    }

    pause() {
        if (this.poll) {
            clearInterval(this.poll);
        }
        if (this.wait) {
            clearTimeout(this.wait);
        }
        if (this.current === "A") {
            this.audioA.pause();
        } else {
            this.audioB.pause();
        }
    }

    setVolume(val) {
        this.audioA.volume = val;
        this.audioB.volume = val;
    }

    switchTo(audio) {
        if (audio === "A") {
            this.playOnDelay(this.audioA);
            this.addFutureNotes(this.notesA);
            this.current = "A";
            console.log("switching to A");
        } else {
            this.playOnDelay(this.audioB);
            this.addFutureNotes(this.notesB);
            this.current = "B";
            console.log("switching to B");
        }
        this.wait = setTimeout(() => {
            this.switchTo(audio === "A" ? "B" : "A");
        }, this.switchTime);
    }

    addFutureNotes(notesArr) {
        notesArr.forEach((noteData) => {
            setTimeout(() => {
                this.addNote(noteData[0]);
            }, noteData[1]);
        });
    }

    playOnDelay(audio) {
        this.overlap = true;
        setTimeout(() => {
            audio.play();
            this.overlap = false;
        }, this.delay);
    }
}

function saveToDatabase(name, str) {
    return new Promise((resolve) => {
        fetch("https://graffiti.red/API/public/", {
            method: "POST",
            body: JSON.stringify({
                action: "set",
                name: name,
                value: str
            })
        }).then((res) => {
            res.json().then(() => {
                resolve();
            });
        });
    });
}

function getFromDatabase(name) {
    return new Promise((resolve) => {
        fetch("https://graffiti.red/API/public/", {
            method: "POST",
            body: JSON.stringify({
                action: "retrieve",
                name: name
            })
        }).then((res) => {
            res.json().then((r) => {
                resolve(r.value);
            });
        });
    });
}