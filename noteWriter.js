class NoteWriter {
    constructor() {
        this.lastLeft = performance.now();
        this.lastMid = performance.now();
        this.lastRight = performance.now();
        this.leftSlides = ["slide-left", "slide-a"];
        this.rightSlides = ["slide-b", "slide-right"];
        this.rightId = "slide-right";
        this.leftId = "slide-left";
        this.lastPerSlide = {
            "slide-left": 0,
            "slide-a": 0,
            "slide-b": 0,
            "slide-right": 0
        }
    }

    // data is array of arrays same length as slideIds
    // addNote takes a slideId
    // mobile only allows 2 notes at once
    writeNotes(data, slideIds, notesPerSecond, addNote, mobile = false) {
        
        let amt = 0;
        for (let i = 0; i < data.length; i++) {
            const arr = data[i];
            const midIdx = Math.floor(arr.length / 2);
            const midArr = [arr[midIdx - 2], arr[midIdx - 1], arr[midIdx], arr[midIdx + 1], arr[midIdx + 2]];
            midArr.forEach((val) => {

                amt += val;
            });
        }
        // console.log(amt);
        for (let i = 0; i < slideIds.length; i++) {
            

            const arr = data[i];
            const midIdx = Math.floor(arr.length / 2);
            // const midVal = arr[midIdx];
            const midVal = arr[midIdx] - arr[midIdx - 1];
            const leg = arr.length / (2 * notesPerSecond);
            const beforeIdx = midIdx - leg;
            const afterIdx = midIdx + leg;
            // const beforeMax = Math.max(...arr.slice(beforeIdx, midIdx));
            // const afterMax = Math.max(...arr.slice(midIdx + 1, afterIdx));
            const beforeArr = arr.slice(beforeIdx, midIdx);
            const beforeMax = Math.max(...beforeArr.map((val, n) => {
                return n === 0 ? 0 : val - beforeArr[n - 1];
            }));
            const afterArr = arr.slice(midIdx + 1, afterIdx);
            const afterMax = Math.max(...afterArr.map((val, n) => {
                return n === 0 ? 0 : val - afterArr[n - 1];
            }));


            
            

            if (midVal > beforeMax && midVal > afterMax && amt > 500) {
            // if (midVal > beforeMax && midVal > afterMax) {

                

                if (mobile && slideIds.length > 2) {
                    const now = performance.now();
                    const gap = (1.0 / notesPerSecond) * 1000;
                    if (slideIds.length === 3) {
                        const leftTime = now - this.lastLeft;
                        const midTime = now - this.lastMid;
                        const rightTime = now - this.lastRight;
                        if (slideIds[i] === this.rightId) {
                            if (leftTime > gap || midTime > gap) {
                                addNote(slideIds[i]);
                                this.lastRight = performance.now();
                            }
                        } else if (slideIds[i] === this.leftId) {
                            if (midTime > gap || rightTime > gap) {
                                addNote(slideIds[i]);
                                this.lastLeft = performance.now();
                            }
                        } else {
                            if (leftTime > gap || rightTime > gap) {
                                addNote(slideIds[i]);
                                this.lastMid = performance.now();
                            }
                        }
                    } else { // we have 4 slides
                        const leftTime = now - this.lastLeft;
                        const rightTime = now - this.lastRight;
                        if (this.leftSlides.includes(slideIds[i])) {
                            if (leftTime > gap) {

                                const slideIdArr = slideIds[i].split("");
                                const sliderIdStart = slideIdArr.slice(0, 5);
                                const sliderIdFinish = slideIdArr.slice(5, slideIdArr.length);
                                const sliderId = [...sliderIdStart, "r", ...sliderIdFinish].join("");
                                addNote(sliderId);
                                
                                // addNote(slideIds[i]);
                                this.lastLeft = performance.now();
                            }
                        } else { // we're on the right side
                            if (rightTime > gap) {

                                const slideIdArr = slideIds[i].split("");
                                const sliderIdStart = slideIdArr.slice(0, 5);
                                const sliderIdFinish = slideIdArr.slice(5, slideIdArr.length);
                                const sliderId = [...sliderIdStart, "r", ...sliderIdFinish].join("");
                                addNote(sliderId);
                                
                                // addNote(slideIds[i]);
                                this.lastRight = performance.now();
                            }
                        }
                    }
                } else {
                    addNote(slideIds[i]);
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