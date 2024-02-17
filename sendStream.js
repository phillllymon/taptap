let lastLeft = performance.now();
let lastMid = performance.now();
let lastRight = performance.now();
const leftSlides = ["slide-left", "slide-a"];
const rightSlides = ["slide-b", "slide-right"];
const rightId = "slide-right";
const leftId = "slide-left";

let chunksA = [];
let chunksB = [];
const timing = 10000;
let wait;
let currentRecorder = "A";

const array1 = [0];
const times1 = [0];

const array2 = [0];
const times2 = [0];

const array3 = [0];
const times3 = [0];

const array4 = [0];
const times4 = [0];

// TODO: save these to database from game and fetch here
const songDelay = 4000;
const notesPerSecond = 8;
const slideIds = [
    "slide-left",
    "slide-a",
    "slide-b",
    "slide-right"
];
const data = [
    array1,
    array2,
    array3,
    array4
];


// will be sent along with the song pieces
let notesArrA = [];
let notesArrB = [];
let startTime = performance.now();

// p2p woo!
const connector = new Connector((m) => {console.log(m)}, () => {console.log("p2p connected")});
console.log("connection id: " + connector.offerConnection());

// navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
navigator.mediaDevices.getUserMedia({ audio: {
    noiseSuppression: false,
    echoCancellation: false
} }).then((stream) => {

    const mediaRecorderA = new MediaRecorder(stream);
    const mediaRecorderB = new MediaRecorder(stream);

    // analyzer stuff ----------------START
    const audioCtx = new AudioContext();
    const audioSource = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    audioSource.connect(analyser);
    analyser.fftSize = 32;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);




    

    let time = performance.now();
    animate();

    function animate() {
        time = performance.now();
        
        analyser.getByteFrequencyData(dataArray);

        array1.push(averageOf(dataArray.slice(0, 4)));
        array2.push(averageOf(dataArray.slice(4, 8)));
        array3.push(averageOf(dataArray.slice(8, 12)));
        array4.push(averageOf(dataArray.slice(12, 16)));
        times1.push(time);
        times2.push(time);
        times3.push(time);
        times4.push(time);

        // get arrays down to data for songDelay time
        while (times1[0] < time - songDelay) {
            array1.shift();
            times1.shift();
        }
        while (times2[0] < time - songDelay) {
            array2.shift();
            times2.shift();
        }
        while (times3[0] < time - songDelay) {
            array3.shift();
            times3.shift();
        }
        while (times4[0] < time - songDelay) {
            array4.shift();
            times4.shift();
        }

        for (let i = 0; i < slideIds.length; i++) {
            const arr = data[i];
            const midIdx = Math.floor(arr.length / 2);
            const midVal = arr[midIdx] - arr[midIdx - 1];
            const leg = arr.length / (2 * notesPerSecond);
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

            if (midVal > beforeMax && midVal > afterMax) {
                const noteTime = performance.now() - startTime;
                if (slideIds.length > 2) {
                    const now = performance.now();
                    const gap = (1.0 / notesPerSecond) * 1000;
                    if (slideIds.length === 3) {
                        const leftTime = now - lastLeft;
                        const midTime = now - lastMid;
                        const rightTime = now - lastRight;
                        if (slideIds[i] === rightId) {
                            if (leftTime > gap || midTime > gap) {
                                addNote(slideIds[i], noteTime);
                                lastRight = performance.now();
                            }
                        } else if (slideIds[i] === leftId) {
                            if (midTime > gap || rightTime > gap) {
                                addNote(slideIds[i], noteTime);
                                lastLeft = performance.now();
                            }
                        } else {
                            if (leftTime > gap || rightTime > gap) {
                                addNote(slideIds[i], noteTime);
                                lastMid = performance.now();
                            }
                        }
                    } else { // we have 4 slides
                        const leftTime = now - lastLeft;
                        const rightTime = now - lastRight;
                        if (leftSlides.includes(slideIds[i])) {
                            if (leftTime > gap) {
                                addNote(slideIds[i], noteTime);
                                lastLeft = performance.now();
                            }
                        } else { // we're on the right side
                            if (rightTime > gap) {
                                addNote(slideIds[i], noteTime);
                                lastRight = performance.now();
                            }
                        }
                    }
                } else {
                    addNote(slideIds[i], noteTime);
                }
            }
        }

        



        // for equalizer on sendStream page
        for (let i = 0; i < 16; i++) {
            document.getElementById(`col${i}`).style.height = `${dataArray[i]}px`;
        }
        requestAnimationFrame(animate);
    }

    // analyzer stuff ------------------END

    [
        [mediaRecorderA, chunksA, notesArrA],
        [mediaRecorderB, chunksB, notesArrB]
    ].forEach((recordSet) => {
        recordSet[0].ondataavailable = (e) => {
            recordSet[1].push(e.data);
        };
        recordSet[0].onstop = () => {
            const blob = new Blob(recordSet[1], { type: "audio/ogg; codecs=opus" });
            
            // clear chunks array
            const numChunks = recordSet[1].length;
            for(let i = 0; i < numChunks; i++) {
                recordSet[1].shift();
            }

            const reader = new FileReader();
            reader.onload = (readerE) => {
                const str = btoa(readerE.target.result);
                const strToSave = JSON.stringify({
                    data: recordSet[2],
                    str: str
                });
    
                // what I want.....
                console.log("WANT TO SEND")
                if (connector.connected) {
                    // console.log(strToSave);
                    console.log("-----SENDING-----");
                    connector.send(strToSave);
                }

                // old way (stupid way)
                // saveToDatabase("streamData", strToSave);

                // clear notes array
                const numNotes = recordSet[2].length;
                for(let i = 0; i < numNotes; i++) {
                    recordSet[2].shift();
                }
            };
            reader.readAsBinaryString(blob);
        };
    });

    document.getElementById("record").addEventListener("click", () => {
        const player = currentRecorder === "A" ? mediaRecorderA : mediaRecorderB;

        player.start();
        startTime = performance.now();
        wait = setTimeout(() => {
            switchRecorder();
        }, timing);
        console.log("recording....");
    });

    document.getElementById("stop").addEventListener("click", () => {
        clearTimeout(wait);
        console.log("stopped");
    });

    function switchRecorder() {
        if (currentRecorder === "A") {
            mediaRecorderB.start();
            startTime = performance.now();
            mediaRecorderA.stop();
            currentRecorder = "B";
        } else {
            mediaRecorderA.start();
            startTime = performance.now();
            mediaRecorderB.stop();
            currentRecorder = "A";
        }
        wait = setTimeout(() => {
            switchRecorder();
        }, timing);
    }
});

function addNote(slideId, time) {
    const notesArr = currentRecorder === "A" ? notesArrA : notesArrB;
    notesArr.push([slideId, time]);
}

function averageOf(arr) {
    let sum = 0;
    arr.forEach((val) => {
        sum += val;
    });
    return sum / arr.length;
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


