class Animator {
    constructor(
        masterInfo,
        noteWriter,
        backgroundAnimator,
        addNote,
        makeTail,
        triggerMissedNote,
        numArrays = 4
        // numArrays = 1
    ) {
        this.masterInfo = masterInfo;
        this.recents = masterInfo.mostRecentNotesOrTails;
        this.notes = masterInfo.notes;
        this.allSlides = masterInfo.allSlides;
        this.slides = [allSlides[0], allSlides[3]];
        this.notesPerSecond = 4; // starting level note per second
        this.targetTails = masterInfo.targetTails;
        this.targets = masterInfo.targets;
        this.targetBounds = masterInfo.targetBounds;
        this.addNote = addNote;
        this.makeTail = makeTail;
        this.triggerMissedNote = triggerMissedNote;
        this.noteWriter = noteWriter;
        this.backgroundAnimator = backgroundAnimator;
        this.time = 0;
        this.animating = false;
        this.arrays = [];
        for (let i = 0; i < numArrays; i++) {
            this.arrays.push([]);
        }
        this.times = [];

        this.notesHit = 0;
        this.notesMissed = 0;
        this.arrayNow = [1, 1, 1, 1];
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
            this.notesMissed = Math.floor(this.notesMissed / 2);
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
        
        player.calibrateLag();

        // faithful
        const dataFreqArray = player.getDataFreqArray();
        const val0 = averageOf(dataFreqArray.slice(0, 4));
        this.arrays[0].push(val0);
        const val1 = averageOf(dataFreqArray.slice(4, 8));
        this.arrays[1].push(val1);
        const val2 = averageOf(dataFreqArray.slice(8, 12));
        this.arrays[2].push(val2);
        const val3 = averageOf(dataFreqArray.slice(12, 16));
        this.arrays[3].push(val3);

        // for animated background
        const valsForBackground = [
            val0,
            val1,
            val2,
            val3
        ];
        this.backgroundAnimator.animateBackground(valsForBackground);
        
        

        this.times.push(this.time);
        while (this.times[0] < this.time - this.masterInfo.songDelay) {
            this.arrays.forEach((arr) => {
                arr.shift();
            });
            this.times.shift();
        }
        
        const masterData = {
            arrays: this.arrays,
            times: this.times,
            numSlides: this.slides.length,
            algorithm: algorithm,
            dataFreqArray: player.getDataFreqArrayDelayed()
        }
        
        const noteVals = this.noteWriter.writeNotes(
            this.slides,
            this.notesPerSecond,
            this.addNote,
            true,
            masterData
        );

        if (this.masterInfo.sustainedNotes) {
            this.noteWriter.writeTails(
                noteVals,
                this.slides,
                this.makeTail
            );
        }

        // FAITHFUL ABOVE
            
        
        moveNotes(
            notes,
            this.masterInfo.noteSpeed,
            this.slides,
            this.targetTails,
            this.targets,
            this.masterInfo.targetBounds,
            this.triggerMissedNote,
            this.recents,
            this.masterInfo.slideLength,
            dt
        );
        updateMeter(this.notesHit, this.notesMissed);

        if (this.animating) {
            // TEST ONLY
            // const timeElapsed = performance.now() - newTime;
            // const waitTime = 15 - timeElapsed;
            // setTimeout(() => {
            //     this.animate(params);
            // }, waitTime);
            // END TEST

            // faithful below
            requestAnimationFrame(() => this.animate(params));
        }
    }
}

function updateMeter(notesHit, notesMissed) {
    // const rotation = Math.floor(90 * (notesHit / (notesHit + notesMissed)));
    // document.getElementById("meter-needle").style.transform = `rotate(-${rotation}deg)`;
}

function moveNotes(
    notes,
    noteSpeed,
    theSlides,
    theTargetTails,
    theTargets,
    theTargetBounds,
    triggerMissedNote,
    theRecents,
    theSlideLength,
    dt
) {

    const movement = 1.0 * noteSpeed * (dt / 1000);
    
    // shorten targetTails
    theSlides.forEach((slideId) => {
        const tail = theTargetTails[slideId];
        if (tail) {
            const newPosition = tail.position + movement;
            tail.note.style.top = `${newPosition}px`;
            tail.position = newPosition;
            
            const newHeight = tail.height - movement;
            if (newHeight < 0) {
                tail.note.remove();
                theTargetTails[slideId] = null;
            }
            tail.note.style.height = `${newHeight}px`;
            tail.height = newHeight;
        }
    });

    // move notes
    for (const note of notes) {
        const newTop = note.position + movement;
        note.note.style.top = `${newTop}px`;
        note.position = newTop;

        // if (newTop > masterInfo.travelLength) {
        //     notes.delete(note);

        // }

        // move tail
        if (note.tail) {
            const newTailTop = note.tail.position + movement;
            note.tail.note.style.top = `${newTailTop}px`;
            note.tail.position = newTailTop;
        }

        if (!note.target && newTop > theTargetBounds.top && newTop < theTargetBounds.bottom) {
            theTargets[note.slideId].add(note);
            note.target = true;
            
        }
        if (newTop > theTargetBounds.bottom && note.target === true) {
            note.target = false;
            theTargets[note.slideId].delete(note);
            triggerMissedNote();
            
            // delete tail once target is missed
            if (note.tail) {
                note.tail.note.remove();
                theRecents[note.tail.slideId] = null;
            }
        }
        if (newTop > theSlideLength) {   
            note.note.remove();
            notes.delete(note);
        }
    }
}