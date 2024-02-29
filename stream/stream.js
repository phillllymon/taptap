let streamId;
let channel;
const connection = new RTCPeerConnection();

let candidateNum = 0;

// unsure if this is necessary
let receiveChannel;

// recorder part
const timing = 10000;

let chunksA = [];
let chunksB = [];

let notesArrA = [];
let notesArrB = [];

let currentRecorder = "A";
let wait;

document.getElementById("start-listening").addEventListener("click", () => {
    navigator.mediaDevices.getUserMedia({ audio: {
        noiseSuppression: false,
        echoCancellation: false
    } }).then((stream) => {
        const mediaRecorderA = new MediaRecorder(stream);
        const mediaRecorderB = new MediaRecorder(stream);

        let player = mediaRecorderA;

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
                    console.log("WANT TO SEND");
                    if (channel && channel.readyState === "open") {
                        channel.send(strToSave);
                    }

                    // clear notes array
                    const numNotes = recordSet[2].length;
                    for(let i = 0; i < numNotes; i++) {
                        recordSet[2].shift();
                    }
                };
                reader.readAsBinaryString(blob);
            };
        });
    
        player.start();

        wait = setTimeout(() => {
            switchRecorder(mediaRecorderA, mediaRecorderB);
        }, timing);
        console.log("recording....");

        const audioCtx = new AudioContext();
        // audioCtx.destination = { playSound: false };
        const audioSource = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        audioSource.connect(analyser);
        analyser.connect(audioCtx.destination);
        analyser.fftSize = 32;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        animate();
        function animate() {
            analyser.getByteFrequencyData(dataArray);
            for (let i = 0; i < dataArray.length; i++) {
                const colId = `col${i}`;
                document.getElementById(colId).style.height = `${Math.max(4, dataArray[i])}px`;
            }
            requestAnimationFrame(animate);
        }

    });
});

function switchRecorder(recorderA, recorderB) {
    if (currentRecorder === "A") {
        recorderB.start();
        recorderA.stop();
        currentRecorder = "B"
    } else {
        recorderA.start();
        recorderB.stop();
        currentRecorder = "A"
    }
    wait = setTimeout(() => {
        switchRecorder(recorderA, recorderB);
    }, timing);
}

// connection stuff below

document.getElementById("test-message").addEventListener("click", () => {
    const message = "test";
    console.log("attempting test message: " + message);

    channel.send(message);
});

document.getElementById("start-connect").addEventListener("click", () => {
    console.log("offering connection");
    streamId = Math.floor(1000000 * Math.random());
    document.getElementById("stream-id").innerText = streamId;

    channel = connection.createDataChannel("channel");
    channel.onopen = handleChannelStatusChange;
    channel.onclose = handleChannelStatusChange;

    connection.ondatachannel = receiveChannelCallback;

    connection.onicecandidate = (e) => {
        if (e.candidate) {
            console.log("sending new candidate");
            const candidateKey = `${streamId}candidate${candidateNum}`;
            saveToDatabase(candidateKey, JSON.stringify(e.candidate)).then((res) => {
                console.log(res);
            });
            saveToDatabase(`${streamId}candidateNum`, JSON.stringify(candidateNum)).then((res) => {
                console.log(res);
            });
            candidateNum += 1;
        }
    }

    connection.createOffer().then((offer) => {
        connection.setLocalDescription(offer);
        const offerStr = JSON.stringify(offer);
        console.log("sending offer");
        saveToDatabase(`${streamId}offer`, offerStr).then((res) => {
            console.log(res);
        });
    }).catch((err) => {
        console.log("ERROR with offer create");
        console.log(err.message);
    });

    let lookForAnswerAttempts = 0;
    const answerInterval = setInterval(() => {
        console.log("checking for answer " + lookForAnswerAttempts);
        getFromDatabase(`${streamId}answer`).then((answerStr) => {
            if (answerStr) {
                console.log("answer received");
                connection.setRemoteDescription(JSON.parse(answerStr));
                clearInterval(answerInterval);
            } else {
                console.log("no answer yet");
            }
        });
        lookForAnswerAttempts += 1;
        if (lookForAnswerAttempts > 30) {
            console.log("Took too long to get answer");
            clearInterval(answerInterval);
        }
    }, 2000);
});

function receiveChannelCallback(event) {
    receiveChannel = event.channel;
    receiveChannel.onmessage = handleReceiveMessage;
}

function handleReceiveMessage(event) {
    console.log("MESSAGE: " + event.data);
}

function handleChannelStatusChange() {
    if (channel) {
        if (channel.readyState === "open") {
            console.log("Channel now OPEN");
            channel.send("channel open");
        } else {
            console.log("Channel now CLOSED");
        }
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
            res.json(res).then((r) => {
                resolve(r);
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
                if (r.value) {
                    resolve(r.value);
                } else {
                    resolve(false);
                }
            });
        });
    });
}