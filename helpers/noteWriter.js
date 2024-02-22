class NoteWriter {
    constructor(minNoteGap) {
        this.lastLeft = performance.now();
        this.lastMid = performance.now();
        this.lastRight = performance.now();
        this.leftSlides = ["slide-left", "slide-a"];
        this.rightSlides = ["slide-b", "slide-right"];
        this.rightId = "slide-right";
        this.leftId = "slide-left";
        this.minNoteGap = minNoteGap;
        this.lastAll = {
            "slide-left": performance.now(),
            "slide-a": performance.now(),
            "slide-b": performance.now(),
            "slide-right": performance.now()
        };
        this.recentToneVals = [0, 0, 0];

    }

    writeTails(recents) {
        // recents.forEach((slideId, ele) => {
        //     console.log(slideId + " " + ele.style.top);
        // });
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
            return;
        }

        let midIdx = 0;
        while (endTime - times[midIdx] > 2000) {
            midIdx += 1;
        }

        const milsPerNode = (1.0 * timeGiven) / times.length;
        const twoSecondLeg = 2000.0 / milsPerNode;

        const leg = Math.floor(twoSecondLeg / notesPerSecond);

        for (let i = 0; i < arrays.length; i++) {
            const arr = arrays[i];
            const noteVal = arr[midIdx];
            const midVal = noteVal - arr[midIdx - 1];

            const beforeIdx = midIdx - leg;
            const afterIdx = midIdx + leg;
            const beforeArr = arr.slice(beforeIdx, midIdx);
            const beforeMax = Math.max(...beforeArr.map((val, n) => {
                return n === 0 ? 0 : val - beforeArr[n - 1];
            }));
            const afterArr = arr.slice(midIdx + 1, afterIdx);
            const afterMax = Math.max(...afterArr.map((val, n) => {
                return n === 0 ? 0 : val - afterArr[n - 1];
            }));

            // if (midVal > beforeMax && midVal > afterMax && amt > 300) {
            if (midVal > beforeMax && midVal > afterMax) {
                let marked = false;
                if (amt < 160) {
                    marked = true;
                    return;
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

                if (slideToUse) { // check for note triggered in slide we're not currently using
                        
                    // --------------------- old faithful notes --------------------
                    const now = performance.now();
                    if (now - this.lastAll[slideToUse] > this.minNoteGap) {
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