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

        this.noteResults = [];
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
        this.noteResults.push(true);
        while (this.noteResults.length > 50) {
            if (this.noteResults.shift()) {
                this.notesHit -= 1;
            } else {
                this.notesMissed -= 1;
            }
        }
        updateMeter(this.notesHit, this.notesMissed);
    }

    recordNoteMissed() {
        this.notesMissed += 2;
        this.noteResults.push(false);
        this.noteResults.push(false);
        while (this.noteResults.length > 50) {
            if (this.noteResults.shift()) {
                this.notesHit -= 1;
            } else {
                this.notesMissed -= 1;
            }
        }
        updateMeter(this.notesHit, this.notesMissed);
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
    let fraction = 1.0 * notesHit / (notesHit + notesMissed);


    let percent = Math.floor(100 * fraction);
    if (percent < 2) {
        percent = 2;
    }
    if (percent > 98) {
        percent = 100;
        document.getElementById("skilz-channel").classList.add("skilz-channel-lit");
    } else {
        document.getElementById("skilz-channel").classList.remove("skilz-channel-lit");
    }
    document.getElementById("skilz-ball").style.top = `${100 - percent}%`;


    // const cutoff = fraction * 6;

    // for (let i = 1; i < 7; i++) { // forgive me....
    //     const lightA = document.getElementById(`light-${2 * i}`);
    //     const lightB = document.getElementById(`light-${(2 * i) - 1}`);
    //     if (i > cutoff) {
    //         lightA.classList.remove(litClasses[2 * i]);
    //         lightB.classList.remove(litClasses[(2 * i) - 1]);
    //     } else {
    //         lightA.classList.add(litClasses[2 * i]);
    //         lightB.classList.add(litClasses[(2 * i) - 1]);

    //     }
    // }


    // if (percent > 98) {
    //     percent = 100;
    //     document.getElementById("skilz-label").classList.add("skilz-label-lit");
    // } else {
    //     document.getElementById("skilz-label").classList.remove("skilz-label-lit");
    // }
    // if (percent < 2) {
    //     percent = 0;
    //     document.getElementById("skilz-light-top").classList.remove("skilz-light-top-lit");
    // } else {
    //     document.getElementById("skilz-light-top").classList.add("skilz-light-top-lit");
    // }
    // document.getElementById("skilz-beam").style.height = `${percent}%`;

    
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
            // tail.note.style.top = `${newPosition}px`;
            tail.position = newPosition;
            
            const newHeight = tail.height - movement;
            if (newHeight < 0) {
                tail.note.remove();
                theTargetTails[slideId] = null;

                const sustain = document.getElementById(`${slideId}-flash-sustain`);
                if (sustain) {
                    sustain.classList.add("light-off");
                    setTimeout(() => {
                        sustain.remove();
                    }, 500);
                        
                    
                }
            }
            tail.note.style.height = `${newHeight}px`;
            tail.height = newHeight;
        }
    });
    
    // -------- periodically reset slider
    // if (sliderPos > 100000) {
    //     for (const note of notes) {
    //         document.getElementById("slider").style.top = `${sliderPos}px`;
    //         note.note.style.top = `${note.position}px`;
    //         if (note.tail) {
    //             note.tail.note.style.top = `${note.tail.position}px`;
    //         }
    //     }
    //     sliderPos = 0;
    // }

    // try switching slider instead
    if (sliderPos > 100000) {
        
        
        let oldPref = "a-";
        let newPref = "b-";
        if (currentSlider === "b-slider") {
            oldPref = "b-";
            newPref = "a-";
        }

        ["slide-left", "slide-a", "slide-b", "slide-right"].forEach((slideId) => {
            document.getElementById(slideId).id = `${oldPref}${slideId}`;
            document.getElementById(`${newPref}${slideId}`).id = slideId;
        });

        const oldSliderId = currentSlider === "a-slider" ? "a-slider" : "b-slider";
        currentSlider = currentSlider === "a-slider" ? "b-slider" : "a-slider";
        movingBothSliders = true;
        oldSliderPos = sliderPos;
        setTimeout(() => {
            movingBothSliders = false;
            oldSliderPos = 0;
            document.getElementById(oldSliderId).style.top = "0px";
        }, 2000);
        
        sliderPos = 0;
    }

    // move slider
    sliderPos += movement;
    if (movingBothSliders) {
        const oldSliderId = currentSlider === "a-slider" ? "b-slider" : "a-slider";
        oldSliderPos += movement;
        document.getElementById(oldSliderId).style.top = `${oldSliderPos}px`;
    }
    document.getElementById(currentSlider).style.top = `${sliderPos}px`;

    // move oldSlider if we have one
    if (document.oldSlider) {
        console.log("-----old-----");
        document.oldSliderPosition += movement;
        document.oldSlider.style.top = `${document.oldSliderPosition}px`;
    }
    

    // move notes
    for (const note of notes) {
        const newTop = note.position + movement;
        // note.note.style.top = `${newTop}px`;
        note.position = newTop;

        // if (newTop > masterInfo.travelLength) {
        //     notes.delete(note);

        // }

        // move tail
        if (note.tail) {
            const newTailTop = note.tail.position + movement;
            // note.tail.note.style.top = `${newTailTop}px`;
            note.tail.position = newTailTop;
        }

        if (!note.target && newTop > theTargetBounds.top && newTop < theTargetBounds.bottom) {
            theTargets[note.slideId].add(note);
            note.target = true;
            
        }
        if (newTop > theTargetBounds.bottom && note.target === true) {

            // note.note.style.backgroundColor = "green";

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