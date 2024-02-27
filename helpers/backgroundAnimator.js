class BackgroundAnimator {
    constructor(masterInfo) {
        this.masterInfo = masterInfo;
        this.valsQueue = []; // contains objects in form [valsArr, timestamp]
        this.initializeColors();
        this.initializeBackground();
    }

    addValsArrayToQueue(vals) {
        this.valsQueue.push([vals, performance.now()]);
    }

    // newVals is CURRENT vals - we'll store it for later and use the older one
    animateBackground(newVals) {
        this.addValsArrayToQueue(newVals);
        
        // const targetTime = performance.now() - this.masterInfo.songDelay + masterInfo.autoAdjustment;
        const targetTime = performance.now() - this.masterInfo.songDelay;
        let valsToUse = null;
        let numObselete = 0;

        for (let i = 0; i < this.valsQueue.length; i++) {
            const thisVal = this.valsQueue[i];
            if (thisVal[1] < targetTime) {
                numObselete += 1;
            } else {
                valsToUse = thisVal[0];
                break;
            }
        }
        for (let i = 0; i < numObselete; i++) {
            this.valsQueue.shift();
        }
        if (valsToUse && !document.mobile) {
            let total = 0;

            // determine new widths for colors
            valsToUse.forEach((val) => {
                total += val;
            });
            if (total > 0) {
                const fractions = valsToUse.map((val) => {
                    return (1.0 * val) / total;
                });
                const a = fractions[0] * 60;
                const b = a + 10;
                const c = b + (fractions[1] * 60);
                const d = c + 10;
                const e = d + (fractions[2] * 60);
                const f = e + 10;

                // determine new colors
                this.colors.forEach((row, rIdx) => {
                    return row.map((color, cIdx) => {
                        if (Math.random() > 0.8) {
                            color[1] = color[1] === 1 ? -1 : 1
                        }
                        const nextIdx = rIdx === this.colors.length - 1 ? rIdx : rIdx + 1;
                        const maxVal = rIdx === this.colors.length - 1 ? 250 : this.colors[nextIdx][cIdx][0];
                        if (color[0] > maxVal - 5 && color[1] === 1) {
                            color[1] = -1;
                        }
                        if (color[0] < 40 && color[1] === -1) {
                            color[1] = 1;
                        }
                        if (Math.random() > 0.8) {
                            color[0] += color[1] * Math.floor(5 * Math.random());
                        }
                    });
                });

                const colsToUse = this.colors.map((row) => {
                    return row.map((col) => {
                        return col[0];
                    }).join(",");
                });
                
                ["background-left", "fog-top-left", "fog-gradient-left"].forEach((eleId) => {
                    document.getElementById(eleId).style.background = `linear-gradient(
                        to right,
                        rgba(${colsToUse[0]},0.95) ${a}%,
                        rgba(${colsToUse[1]},0.95) ${b}% ${c}%,
                        rgba(${colsToUse[2]},0.95) ${d}% ${e}%,
                        rgba(${colsToUse[3]},0.95) ${f}%
                    )`
                });
                ["background-right", "fog-top-right", "fog-gradient-right"].forEach((eleId) => {
                    document.getElementById(eleId).style.background = `linear-gradient(
                        to left,
                        rgba(${colsToUse[0]},0.95) ${a}%,
                        rgba(${colsToUse[1]},0.95) ${b}% ${c}%,
                        rgba(${colsToUse[2]},0.95) ${d}% ${e}%,
                        rgba(${colsToUse[3]},0.95) ${f}%
                    )`;
                });
            }
        }
    }

    initializeColors() {
        const a1 = Math.floor(240 * Math.random());
        const a2 = Math.floor(240 * Math.random());
        const a3 = Math.floor(240 * Math.random());
        const b1 = Math.floor(a1 + ((255 - a1) * Math.random()));
        const b2 = Math.floor(a2 + ((255 - a2) * Math.random()));
        const b3 = Math.floor(a3 + ((255 - a3) * Math.random()));
        const c1 = Math.floor(b1 + ((255 - b1) * Math.random()));
        const c2 = Math.floor(b2 + ((255 - b2) * Math.random()));
        const c3 = Math.floor(b3 + ((255 - b3) * Math.random()));
        const d1 = Math.floor(c1 + ((255 - c1) * Math.random()));
        const d2 = Math.floor(c2 + ((255 - c2) * Math.random()));
        const d3 = Math.floor(c3 + ((255 - c3) * Math.random()));
        this.colors = [
            [[a1, 1], [a2, -1], [a3, 1]],
            [[b1, -1], [b2, 1], [b3, -1]],
            [[c1, 1], [c2, -1], [c3, 1]],
            [[d1, -1], [d2, 1], [d3, -1]]
        ];
        // const a1 = Math.floor(240 * Math.random());
        // const a2 = Math.floor(240 * Math.random());
        // const a3 = Math.floor(240 * Math.random());
        // const b1 = Math.floor(a1 * Math.random());
        // const b2 = Math.floor(a2 * Math.random());
        // const b3 = Math.floor(a3 * Math.random());
        // const c1 = Math.floor(b1 * Math.random());
        // const c2 = Math.floor(b2 * Math.random());
        // const c3 = Math.floor(b3 * Math.random());
        // const d1 = Math.floor(c1 * Math.random());
        // const d2 = Math.floor(c2 * Math.random());
        // const d3 = Math.floor(c3 * Math.random());
        // this.colors = [
        //     [[d1, -1], [d2, 1], [d3, -1]],
        //     [[c1, 1], [c2, -1], [c3, 1]],
        //     [[b1, -1], [b2, 1], [b3, -1]],
        //     [[a1, 1], [a2, -1], [a3, 1]]
        // ];
    }

    initializeBackground() {
        if (!document.mobile) {
            const colsToUse = this.colors.map((row) => {
                return row.map((col) => {
                    return col[0];
                }).join(",");
            });
            ["background-left", "fog-top-left", "fog-gradient-left"].forEach((eleId) => {
                document.getElementById(eleId).style.background = `linear-gradient(
                    to right,
                    rgba(${colsToUse[0]},0.95) 20%,
                    rgba(${colsToUse[1]},0.95) 30% 45%,
                    rgba(${colsToUse[2]},0.95) 55% 70%,
                    rgba(${colsToUse[3]},0.95) 80%
                )`
            });
            ["background-right", "fog-top-right", "fog-gradient-right"].forEach((eleId) => {
                document.getElementById(eleId).style.background = `linear-gradient(
                    to left,
                    rgba(${colsToUse[0]},0.95) 20%,
                    rgba(${colsToUse[1]},0.95) 30% 45%,
                    rgba(${colsToUse[2]},0.95) 55% 70%,
                    rgba(${colsToUse[3]},0.95) 80%
                )`;
            });
        } else {
            
        }
    }
}