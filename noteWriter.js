let toneVal;
let recentToneVals = [0, 0, 0];


class NoteWriter {
    constructor() {
        this.lastLeft = performance.now();
        this.lastMid = performance.now();
        this.lastRight = performance.now();
        this.leftSlides = ["slide-left", "slide-a"];
        this.rightSlides = ["slide-b", "slide-right"];
        this.rightId = "slide-right";
        this.leftId = "slide-left";
    }

    // data is array of arrays same length as slideIds
    // addNote takes a slideId
    // mobile only allows 2 notes at once
    writeNotes(data, slideIds, notesPerSecond, addNote, mobile = false, masterData = null) {
        
        const vals = [];

        let amt = 0;
        for (let i = 0; i < data.length; i++) {
            const arr = data[i];
            const midIdx = Math.floor(arr.length / 2);
            const thisVal = arr[midIdx];
            vals.push(thisVal);

            amt += thisVal;

            // --- using a bit ahead and behind, doesn't work so great ---
            // const midArr = [arr[midIdx - 2], arr[midIdx - 1], arr[midIdx], arr[midIdx + 1], arr[midIdx + 2]];
            // midArr.forEach((val) => {

            //     amt += val;
            // });
        }
        // console.log(amt);

        amt = Math.max(...vals);

        const maxToneVal = Math.max(...vals);
        // const thisToneVal = (vals[0] / 255) + (2 * (vals[1] / 255)) + (3 * (vals[2] / 255)) + (4 * (vals[3] / 255));
        const thisToneVal = (vals[0] / maxToneVal) 
            + (2 * (vals[1] / maxToneVal))
            + (3 * (vals[2] / maxToneVal))
            + (4 * (vals[3] / maxToneVal));

        
        

        if (!toneVal) {
            toneVal = thisToneVal;
        }
        
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
            const midVal = arr[midIdx] - arr[midIdx - 1];

            const beforeIdx = midIdx - leg;
            const afterIdx = midIdx + leg;
            const beforeArr = arr.slice(beforeIdx, midIdx);
            const beforeTimes = times.slice(beforeIdx, midIdx);
            const beforeMax = Math.max(...beforeArr.map((val, n) => {
                return n === 0 ? 0 : val - beforeArr[n - 1];
                console.log(beforeTimes[n] - beforeTimes[n - 1]);
                console.log(val - beforeArr[n - 1]);
                return n === 0 ? 0 : 1.0 * (val - beforeArr[n - 1]) / (beforeTimes[n] - beforeTimes[n - 1]);
            }));
            const afterArr = arr.slice(midIdx + 1, afterIdx);
            const afterTimes = times.slice(midIdx + 1, afterIdx);
            const afterMax = Math.max(...afterArr.map((val, n) => {
                return n === 0 ? 0 : val - afterArr[n - 1];
                return n === 0 ? 0 : 1.0 * (val - afterArr[n - 1]) / (afterTimes[n] - afterTimes[n - 1]);
            }));
        // NEW END ---------------


        // OLD START -------------
        // for (let i = 0; i < slideIds.length; i++) {
            

        //     const arr = data[i];
        //     const midIdx = Math.floor(arr.length / 2);
        //     // const midVal = arr[midIdx];
        //     const midVal = arr[midIdx] - arr[midIdx - 1];
        //     const leg = arr.length / (2 * notesPerSecond);
        //     const beforeIdx = midIdx - leg;
        //     const afterIdx = midIdx + leg;
        //     // const beforeMax = Math.max(...arr.slice(beforeIdx, midIdx));
        //     // const afterMax = Math.max(...arr.slice(midIdx + 1, afterIdx));
        //     const beforeArr = arr.slice(beforeIdx, midIdx);
        //     const beforeMax = Math.max(...beforeArr.map((val, n) => {
        //         return n === 0 ? 0 : val - beforeArr[n - 1];
        //     }));
        //     const afterArr = arr.slice(midIdx + 1, afterIdx);
        //     const afterMax = Math.max(...afterArr.map((val, n) => {
        //         return n === 0 ? 0 : val - afterArr[n - 1];
        //     }));
        // OLD END -------------


            // if (midVal > beforeMax && midVal > afterMax && amt > 300) {
            if (midVal > beforeMax && midVal > afterMax) {
                let marked = false;
                if (amt < 160) {
                    marked = true;
                    return;
                }    
            
                let newWay = true;

                if (newWay) {
                    // --------------------- experimental notes --------------------

                    // recentToneVals keeps track of last 3
                    const sortedTones = recentToneVals.map((val) => {
                        return val;
                    }).sort();

                    let slide = "slide-left";
                    if (thisToneVal > sortedTones[0]) {
                        slide = "slide-a";
                        if (thisToneVal > sortedTones[1]) {
                            slide = "slide-b"
                            if (thisToneVal > sortedTones[2]){
                                slide = "slide-right";
                            }
                        }
                    }

                    recentToneVals.push(thisToneVal);
                    recentToneVals.shift();
                    
                    


                    // console.log(recentToneVals.map((val) => {
                    //     const myVal = val;
                    //     return myVal;
                    // }));

                    const gap = (1.0 / notesPerSecond) * 1000;
                    const now = performance.now();
                    const leftTime = now - this.lastLeft;
                    const rightTime = now - this.lastRight;
                    if (slide === "slide-left") {
                        if (leftTime > gap) {

                            addNote("slide-left", marked);
                            this.lastLeft = performance.now();
                        }
                        
                    } else if (slide === "slide-a") {
                        if (leftTime > gap) {

                            addNote("slide-a", marked);
                            this.lastLeft = performance.now();

                        }
                    } else if (slide === "slide-b") {
                        if (rightTime > gap) {

                            addNote("slide-b", marked);
                            this.lastRight = performance.now();

                        }
                    } else {
                        if (rightTime > gap) {

                            addNote("slide-right", marked);
                            this.lastRight = performance.now();

                        }
                    }
                    // if (thisToneVal < 2) {
                    //     if (leftTime > gap) {

                    //         addNote("slide-left");
                    //         this.lastLeft = performance.now();
                    //     }
                        
                    // } else if (thisToneVal < 3) {
                    //     if (leftTime > gap) {

                    //         addNote("slide-a");
                    //         this.lastLeft = performance.now();

                    //     }
                    // } else if (thisToneVal < 4) {
                    //     if (rightTime > gap) {

                    //         addNote("slide-b");
                    //         this.lastRight = performance.now();

                    //     }
                    // } else {
                    //     if (rightTime > gap) {

                    //         addNote("slide-right");
                    //         this.lastRight = performance.now();

                    //     }
                    // }

                } else {
                
                    // --------------------- old faithful notes --------------------

                    if (mobile && slideIds.length > 2) {
                        const now = performance.now();
                        const gap = (1.0 / notesPerSecond) * 1000;
                        if (slideIds.length === 3) {
                            const leftTime = now - this.lastLeft;
                            const midTime = now - this.lastMid;
                            const rightTime = now - this.lastRight;
                            if (slideIds[i] === this.rightId) {
                                if (leftTime > gap || midTime > gap) {
                                    addNote(slideIds[i], marked);
                                    this.lastRight = performance.now();
                                }
                            } else if (slideIds[i] === this.leftId) {
                                if (midTime > gap || rightTime > gap) {
                                    addNote(slideIds[i], marked);
                                    this.lastLeft = performance.now();
                                }
                            } else {
                                if (leftTime > gap || rightTime > gap) {
                                    addNote(slideIds[i], marked);
                                    this.lastMid = performance.now();
                                }
                            }
                        } else { // we have 4 slides
                            const leftTime = now - this.lastLeft;
                            const rightTime = now - this.lastRight;
                            if (this.leftSlides.includes(slideIds[i])) {
                                if (leftTime > gap) {
                                    addNote(slideIds[i], marked);
                                    this.lastLeft = performance.now();
                                }
                            } else { // we're on the right side
                                if (rightTime > gap) {
                                    addNote(slideIds[i], marked);
                                    this.lastRight = performance.now();
                                }
                            }
                        }
                    } else {
                        addNote(slideIds[i], marked);
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