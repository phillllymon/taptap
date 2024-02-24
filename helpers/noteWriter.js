class NoteWriter {
    constructor(masterInfo) {
        this.masterInfo = masterInfo;

        this.lastLeft = performance.now();
        this.lastMid = performance.now();
        this.lastRight = performance.now();
        this.leftSlides = ["slide-left", "slide-a"];
        this.rightSlides = ["slide-b", "slide-right"];
        this.rightId = "slide-right";
        this.leftId = "slide-left";
        this.lastAll = {
            "slide-left": performance.now(),
            "slide-a": performance.now(),
            "slide-b": performance.now(),
            "slide-right": performance.now()
        };
        this.mostRecentNotes = masterInfo.mostRecentNotesOrTails;
        this.recentToneVals = [0, 0, 0];
    }

    writeTails(noteVals, slideIds, makeTail) {
        
        if (noteVals) {
            const valsBySlideId = {
                "slide-left": noteVals[0],
                "slide-a": noteVals[1],
                "slide-b": noteVals[2],
                "slide-right": noteVals[3]
            };
    
            slideIds.forEach((slideId) => {
                const thisNoteVal = valsBySlideId[slideId];
                if (!thisNoteVal) {
                    return;
                }
                const triggerSlideIdx = thisNoteVal.triggerSlideIdx;
                const relevantNoteValData = noteVals[triggerSlideIdx];
                const relevantAfterRatio = relevantNoteValData.afterRatio;
                const relevantNoteVal = relevantNoteValData.val;

                const lastNote = this.mostRecentNotes[slideId];
                if (lastNote) {
                    if (lastNote.isTail && lastNote.totalHeight > this.masterInfo.maxTailLength) {
                        this.mostRecentNotes[slideId] = null;
                        return;
                    }
                    // if (valsBySlideId[slideId] > 3 * lastNote.val) {
                    // if (valsBySlideId[slideId] < 0.1) {    
                    // if (valsBySlideId[slideId].val > 1.5 * lastNote.val && valsBySlideId[slideId].afterRatio < 0.3) {
                    // if (relevantNoteVal > 1.5 * lastNote.val && relevantAfterRatio > 0.7) {
                    
                    const ratioThreshold = {
                        "slide-left": 0.9,
                        "slide-a": 0.8,
                        "slide-b": 0.7,
                        "slide-right": 0.6
                    }[slideId];
                    const valThreshold = {
                        "slide-left": 2.5,
                        "slide-a": 2.25,
                        "slide-b": 1.75,
                        "slide-right": 1.5
                    }[slideId];
                    
                    if (relevantAfterRatio > ratioThreshold && relevantNoteVal > valThreshold * lastNote.val) {
                        makeTail(slideId, lastNote);
                        const now = performance.now();
                        if (slideIds.length === 4) {
                            if (this.leftSlides.includes(slideId)) {
                                this.lastLeft = now;
                                this.lastAll[slideId] = now;
                            } else {
                                this.lastRight = now;
                                this.lastAll[slideId] = now;
                            }
                        } else if (slideIds.length === 3) {
                            if (slideId === this.rightId) {
                                this.lastRight = now;
                                this.lastAll[slideId] = now;                               
                            } else if (slideId === this.leftId) {                                
                                this.lastLeft = now;
                                this.lastAll[slideId] = now;                                
                            } else {                                
                                this.lastMid = now;
                                this.lastAll[slideId] = now;                                
                            }
                        } else {
                            this.lastAll[slideId] = now;
                        }
                    } else {
                        this.mostRecentNotes[slideId] = null;
                    }
                }
            });
        }
    }

    // data is array of arrays same length as slideIds
    // addNote takes a slideId
    // mobile only allows 2 notes at once
    writeNotes(slideIds, notesPerSecond, addNote, mobile, masterData) {
        
        const vals = [];

        let amt = 0;
        const dataArrays = masterData[0];
        for (let i = 0; i < dataArrays.length; i++) {
            const arr = dataArrays[i];
            const midIdx = Math.floor(arr.length / 2);
            const thisVal = arr[midIdx];
            vals.push(thisVal);
            amt += thisVal;
        }

        amt = Math.max(...vals);

        const maxToneVal = Math.max(...vals);
        // const thisToneVal = (vals[0] / 255) + (2 * (vals[1] / 255)) + (3 * (vals[2] / 255)) + (4 * (vals[3] / 255));
        const thisToneVal = (vals[0] / maxToneVal) 
            + (2 * (vals[1] / maxToneVal))
            + (3 * (vals[2] / maxToneVal))
            + (4 * (vals[3] / maxToneVal));

        
        // NEW START -------------
        const arrays = masterData[0];
        const times = masterData[1];
        const startTime = times[0];
        const endTime = times[times.length - 1];
        const timeGiven = endTime - startTime;
        
        if (timeGiven < 3500) {
            return; // see noteVals below
        }

        let midIdx = 0;
        while (endTime - times[midIdx] > 2000) {
            midIdx += 1;
        }

        const milsPerNode = (1.0 * timeGiven) / times.length;
        const twoSecondLeg = 2000.0 / milsPerNode;

        const leg = Math.floor(twoSecondLeg / notesPerSecond);

        // returned from this function to be used for writeTails
        const noteVals = [];

        for (let i = 0; i < arrays.length; i++) {
            const arr = arrays[i];

            const noteVal = arr[midIdx];
            const midVal = noteVal - arr[midIdx - 1];
            
            const beforeIdx = midIdx - leg;
            const afterIdx = midIdx + leg;

            let overallBeforeMax = 0;
            let overallBeforeMin = 255;

            let overallAfterMax = 0;
            let overallAfterMin = 255;

            const beforeArr = arr.slice(beforeIdx, midIdx);
            const beforeMax = Math.max(...beforeArr.map((val, n) => {
                
                if (val < overallBeforeMin) {
                    overallBeforeMin = val;
                }
                if (val > overallBeforeMax) {
                    overallBeforeMax = val;
                }

                return n === 0 ? 0 : val - beforeArr[n - 1];
            }));
            const afterArr = arr.slice(midIdx + 1, afterIdx);
            const afterMax = Math.max(...afterArr.map((val, n) => {

                // if (val < overallAfterMin) {
                //     overallAfterMin = val;
                // }
                // if (val > overallAfterMax) {
                //     overallAfterMax = val;
                // }

                // only include values starting 300 ms out
                if (val < overallAfterMin && times[n] > 2300) {
                    overallAfterMin = val;
                }
                if (val > overallAfterMax && times[n] > 2300) {
                    overallAfterMax = val;
                }

                return n === 0 ? 0 : val - afterArr[n - 1];
            }));


            // noteVals.push(noteVal);
            // noteVals.push((1.0 * overallMin) / overallMax);
            noteVals.push({
                beforeRatio: (1.0 * overallBeforeMin) / overallBeforeMax,
                afterRatio: (1.0 * overallAfterMin) / overallAfterMax,
                val: noteVal,
                triggerSlideIdx: i 
            });

            // if (midVal > beforeMax && midVal > afterMax && amt > 300) {
            if (midVal > beforeMax && midVal > afterMax) {
                let marked = false;
                if (amt < 160) {
                    marked = true;
                    return noteVals;
                }    

                let slideToUse;
                if (algorithm === "A") {
                    
                    const sortedTones = this.recentToneVals.map((val) => {
                        return val;
                    }).sort();

                    slideToUse = "slide-left";
                    const numSlides = masterData[2];
                    if (numSlides === 4) {
                        if (thisToneVal > sortedTones[0]) {
                            slideToUse = "slide-a";
                            if (thisToneVal > sortedTones[1]) {
                                slideToUse = "slide-b"
                                if (thisToneVal > sortedTones[2]){
                                    slideToUse = "slide-right";
                                }
                            }
                        }
                    } else if (numSlides === 3) {
                        if (thisToneVal > sortedTones[0]) {
                            slideToUse = "slide-a";
                            if (thisToneVal > sortedTones[2]) {
                                slideToUse = "slide-right";
                            }
                        }
                    } else {
                        if (thisToneVal > sortedTones[1]) {
                            slideToUse = "slide-right";
                        }
                    }

                    // old
                    // this.recentToneVals.push(thisToneVal);
                    // this.recentToneVals.shift();
                    
                    // new
                    if (!this.lastValTime || performance.now() - this.lastValTime > 100) {
                        this.recentToneVals.push(thisToneVal);
                        this.lastValTime = performance.now();
                        this.recentToneVals.shift();
                    }
                    // end new

                } else if (algorithm === "B") {
                    slideToUse = slideIds[i];
                }

                // write notes - same for both algorithms once slideToUse is established

                if (slideToUse) { // make sure note wasn't triggered in slide we're not currently using
                        
                    // --------------------- old faithful notes --------------------
                    const now = performance.now();
                    if (now - this.lastAll[slideToUse] > this.masterInfo.minNoteGap) {
                        if (mobile && slideIds.length > 2) {
                            const gap = (1.0 / notesPerSecond) * 1000;
                            if (slideIds.length === 3) {
                                const leftTime = now - this.lastLeft;
                                const midTime = now - this.lastMid;
                                const rightTime = now - this.lastRight;
                                if (slideToUse === this.rightId) {
                                    if (leftTime > gap || midTime > gap) {
                                        addNote(slideToUse, noteVal, marked);
                                        this.lastRight = now;
                                        this.lastAll[slideToUse] = now;
                                    }
                                } else if (slideToUse === this.leftId) {
                                    if (midTime > gap || rightTime > gap) {
                                        addNote(slideToUse, noteVal, marked);
                                        this.lastLeft = now;
                                        this.lastAll[slideToUse] = now;
                                    }
                                } else {
                                    if (leftTime > gap || rightTime > gap) {
                                        addNote(slideToUse, noteVal, marked);
                                        this.lastMid = now;
                                        this.lastAll[slideToUse] = now;
                                    }
                                }
                            } else { // we have 4 slides
                                const leftTime = now - this.lastLeft;
                                const rightTime = now - this.lastRight;
                                if (this.leftSlides.includes(slideToUse)) {
                                    if (leftTime > gap) {
                                        addNote(slideToUse, noteVal, marked);
                                        this.lastLeft = now;
                                        this.lastAll[slideToUse] = now;
                                    }
                                } else { // we're on the right side
                                    if (rightTime > gap) {
                                        addNote(slideToUse, noteVal, marked);
                                        this.lastRight = now;
                                        this.lastAll[slideToUse] = now;
                                    }
                                }
                            }
                        } else {
                            addNote(slideToUse, noteVal, marked);
                            this.lastAll[slideToUse] = now;
                        }
                    }
                }
            }
        }
        return noteVals;
    }
}

function getNumInfoArr(arr) {
    if (arr.length === 0) {
        return {
            min: 0,
            max: 0,
            average: 0
        }
    }
    let min = arr[0];
    let max = arr[0];
    let sum = 0;
    arr.forEach((val) => {
        if (val > max) {
            max = val;
        }
        if (val < min) {
            min = val;
        }
        sum += val;
    });
    return {
        min: min,
        max: max,
        average: Math.floor(sum / arr.length)
    };

}