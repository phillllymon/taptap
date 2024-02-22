class Animator {
    constructor(
        noteWriter,
        notes,
        recents,
        targets,
        targetBounds,
        allSlides,
        triggerMissedNote,
        addNote,
        noteParams,
        numArrays = 4
    ) {
        this.notes = notes;
        this.recents = recents;
        this.allSlides = allSlides;
        this.slides = [allSlides[0], allSlides[3]];
        this.notesPerSecond = 6;
        this.noteSpeed = noteParams.noteSpeed;
        this.songDelay = noteParams.songDelay;
        this.targets = targets;
        this.targetBounds = targetBounds;
        this.addNote = addNote;
        this.triggerMissedNote = triggerMissedNote;
        this.noteWriter = noteWriter;
        this.time = 0;
        this.animating = false;
        this.arrays = [];
        for (let i = 0; i < numArrays; i++) {
            this.arrays.push([]);
        }
        this.times = [];

        this.notesHit = 0;
        this.notesMissed = 0;
    }

    updateTargetBounds(bounds) {
        this.targetBounds = bounds;
    }

    setNotesPerSecond(val) {
        this.notesPerSecond = val;
    }

    setNumSlides(val) {
        if (val === 2) {
            this.slides = [this.allSlides[0], this.allSlides[3]];
        } else if (val === 3) {
            this.slides = [this.allSlides[0], this.allSlides[1], this.allSlides[3]];
        } else {
            this.slides = [this.allSlides[0], this.allSlides[1], this.allSlides[2], this.allSlides[3]];
        }
    }

    recordNoteHit() {
        this.notesHit += 1;
        if (this.notesHit > 30) {
            this.notesHit = Math.floor(this.notesHit / 2);
            this.notesMissed = Math.floor(this.notesHit / 2);
        }
    }

    recordNoteMissed() {
        this.notesMissed += 1;
    }

    runAnimation(params) {
        this.time = performance.now();
        this.animating = true;
        this.animate(params);
    }

    stopAnimation() {
        this.animating = false;
    }

    animate(params) {
        const {
            player,
            algorithm,
        } = params;

        const newTime = performance.now();
        const dt = newTime - this.time;
        this.time = newTime;
        
        // TEST ONLY
        // // console.log(dt);
        // const gapToCheck = 5;
        // // const currentSongTime = 1000.0 * player.song1.currentTime;
        // const currentSongTime = (1000.0 * player.song2.currentTime) + 4000;
        
        // const returnTime = player.song1.currentTime;
        // let mustReturn = false;
        // if (player.playing2) {
        //     player.song1.currentTime = 1.0 * (currentSongTime / 1000);
        // } else {
        //     mustReturn = true;
        // }

        // const songStartTime = this.time - currentSongTime;
        
    
        // let lastSongTimeChecked;
        // if (this.times.length === 0) {
        //     lastSongTimeChecked = 0;

        //     // analyse time 0
        //     player.song1.currentTime = 0;
        //     const dataArray = player.getDataArray();
        //     this.arrays[0].push(averageOf(dataArray.slice(0, 4)));
        //     this.arrays[1].push(averageOf(dataArray.slice(4, 8)));
        //     this.arrays[2].push(averageOf(dataArray.slice(8, 12)));
        //     this.arrays[3].push(averageOf(dataArray.slice(12, 16)));
        //     this.times.push(songStartTime);

        // } else {
        //     lastSongTimeChecked = this.times[this.times.length - 1] - songStartTime;
        // }

        // let songTimeToCheck = lastSongTimeChecked + gapToCheck;
        
        // let i = 0;
        // while (songTimeToCheck < currentSongTime) {
        //     player.song1.currentTime = 1.0 * (songTimeToCheck / 1000);
        //     const dataArray = player.getDataArray();
        //     this.arrays[0].push(averageOf(dataArray.slice(0, 4)));
        //     this.arrays[1].push(averageOf(dataArray.slice(4, 8)));
        //     this.arrays[2].push(averageOf(dataArray.slice(8, 12)));
        //     this.arrays[3].push(averageOf(dataArray.slice(12, 16)));
        //     this.times.push(songStartTime + songTimeToCheck);
        //     songTimeToCheck += gapToCheck;
        //     i += 1;
        //     if (1 > 100) {
        //         console.log("BREAK");
        //         break;
        //     }
        // }

        // if (mustReturn) {
        //     player.song1.currentTime = returnTime;
        // }

        // if (player.song1.currentTime < 2.0) {
        //     if (this.animating) {
        //         requestAnimationFrame(() => this.animate(params));
        //     }
        //     return;
        // }

        // (FAITHFUL BELOW) END TEST
        
        player.calibrateLag();

        // faithful
        const dataArray = player.getDataArray();
        this.arrays[0].push(averageOf(dataArray.slice(0, 4)));
        this.arrays[1].push(averageOf(dataArray.slice(4, 8)));
        this.arrays[2].push(averageOf(dataArray.slice(8, 12)));
        this.arrays[3].push(averageOf(dataArray.slice(12, 16)));
        this.times.push(this.time);
        while (this.times[0] < this.time - this.songDelay) {
            this.arrays.forEach((arr) => {
                arr.shift();
            });
            this.times.shift();
        }
        
        const masterData = [this.arrays, this.times, this.slides.length, algorithm];
        
        this.noteWriter.writeTails(this.recents, this.arrays);
        this.noteWriter.writeNotes(
            this.slides,
            this.notesPerSecond,
            this.addNote,
            true,
            masterData
        );

        // FAITHFUL ABOVE
            
        
        moveNotes(notes, this.noteSpeed, this.targets, this.targetBounds, this.triggerMissedNote, dt);
        updateMeter(this.notesHit, this.notesMissed);

        if (this.animating) {
            requestAnimationFrame(() => this.animate(params));
        }
    }
}

function updateMeter(notesHit, notesMissed) {
    const rotation = Math.floor(90 * (notesHit / (notesHit + notesMissed)));
    document.getElementById("meter-needle").style.transform = `rotate(-${rotation}deg)`;
}

function moveNotes(notes, noteSpeed, theTargets, theTargetBounds, triggerMissedNote, dt) {
    const movement = 1.0 * noteSpeed * (dt / 1000);
    for (const note of notes) {
        const newTop = note.position + movement;
        note.note.style.top = `${newTop}px`;
        note.position = newTop;

        if (newTop > theTargetBounds.top && newTop < theTargetBounds.bottom) {
            theTargets[note.slideId].add(note);
            note.target = true;
        }
        if (newTop > theTargetBounds.bottom && note.target === true) {
            note.target = false;
            theTargets[note.slideId].delete(note);
            triggerMissedNote();
        }
        if (newTop > slideLength) {
            note.note.remove();
            notes.delete(note);
        }
    }

    // for (const note of notes) {
    //     const newTop = note[1] + movement;
    //     note[0].style.top = `${newTop}px`;
    //     note[1] = newTop;

    //     if (newTop > targetBounds.top && newTop < targetBounds.bottom) {
    //         targets[note[2]].add(note);
    //         note[3] = true;
    //     }
    //     if (newTop > targetBounds.bottom && note[3] === true) {
    //         note[3] = false;
    //         targets[note[2]].delete(note);
    //         triggerMissedNote();
    //     }
    //     if (newTop > slideLength) {
    //         note[0].remove();
    //         notes.delete(note);
    //     }
    // }
}