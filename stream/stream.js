// recorder part
const timing = 10000;

let chunksA = [];
let chunksB = [];

let notesArrA = [];
let notesArrB = [];

const times = {
    A: 0,
    B: 0
}

let currentRecorder = "A";
let wait;

let timestamp = performance.now();

let channel;

// for note generation
let slideIds = [
    "slide-left",
    "slide-a",
    "slide-b",
    "slide-right"
];
let notesPerSecond = 8;
const addNote = () => {
    console.log("NEW NOTE WOO!");
};
const masterInfo = {
    maxTailLength: 500,
    minNoteGap: 200
}
const noteWriter = new NoteWriter(masterInfo);

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
        ].forEach((recordSet, n) => {
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
    
                const thisTime = n === 0 ? times.A : times.B;
                const reader = new FileReader();
                reader.onload = (readerE) => {

                    console.log("time: " + thisTime);

                    const str = btoa(readerE.target.result);
                    const strToSave = JSON.stringify({
                        data: recordSet[2],
                        str: str,
                        time: thisTime
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
    
        timestamp = performance.now();
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
        const now = performance.now();
        times.A = now - timestamp;
        timestamp = performance.now();
        recorderA.stop();
        currentRecorder = "B"
    } else {
        recorderA.start();
        const now = performance.now();
        times.B = now - timestamp;
        timestamp = performance.now();
        recorderB.stop();
        currentRecorder = "A"
    }
    wait = setTimeout(() => {
        switchRecorder(recorderA, recorderB);
    }, timing);
}

// connection stuff below






document.getElementById("start-connect").addEventListener("click", () => {
    console.log("offering connection");

    
    let streamId;
    
    const connection = new RTCPeerConnection();
    
    streamId = Math.floor(1000000 * Math.random());
    document.getElementById("stream-id").innerText = streamId;
    
    channel = connection.createDataChannel("channel");
    channel.onopen = handleChannelStatusChange;
    channel.onclose = handleChannelStatusChange;
    
    let receiveChannel;
    
    connection.ondatachannel = receiveChannelCallback;
    
    let nextSendMessage = 0;
    let nextReceiveMessage = 0;

    connection.onicecandidate = (e) => {
        if (e.candidate) {
            console.log("sending candidate");
            const objToSend = {
                type: "candidate",
                candidate: e.candidate
            };
            sendMessage(JSON.stringify(objToSend));
        }
    }

    connection.addEventListener("icegatheringstatechange", (e) => {
        console.log("ICE gathering state change: " + e.target.iceGatheringState);
    });

    // main
    connection.createOffer().then((offer) => {
        connection.setLocalDescription(offer).then(() => {
            const objToSend = {
                type: "offer",
                offer: offer
            };
            sendMessage(JSON.stringify(objToSend));
        });
    });

    let mailboxChecks = 0;
    const checkInterval = setInterval(() => {
        getMessages();
        mailboxChecks += 1;
        if (mailboxChecks > 30) {
            clearInterval(checkInterval);
            console.log("timed out");
        }
    }, 2000);

    function dealWithMessage(message) {
        const messageObj = JSON.parse(message);
        if (messageObj.type === "candidate") {
            console.log("received candidate");
            connection.addIceCandidate(messageObj.candidate);
        }
        if (messageObj.type === "answer") {
            console.log("received answer");
            connection.setRemoteDescription(messageObj.answer).then(() => {
                console.log("answer received and accepted");
            });
        }
    }

    function getMessages() {
        console.log("looking for a message");
        const nextMessageKey = `${streamId}fromRemote${nextReceiveMessage}`;
        getFromDatabase(nextMessageKey).then((message) => {
            if (message) {
                dealWithMessage(message);
                nextReceiveMessage += 1;
                getMessages();
            }
        });
    }

    function sendMessage(message) {
        const messageKey = `${streamId}fromHost${nextSendMessage}`;
        saveToDatabase(messageKey, message);
        nextSendMessage += 1;
    }

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
                clearInterval(checkInterval);
                channel.send("channel open");
            } else {
                console.log("Channel now CLOSED");
            }
        }
    }

    document.getElementById("test-message").addEventListener("click", () => {
        const message = "test";
        console.log("attempting test message: " + message);
    
        channel.send(message);
    });

});




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