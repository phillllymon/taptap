class Connector {
    constructor() {

        this.connection = new RTCPeerConnection();
        this.channel = this.connection.createDataChannel("channel");
        this.channel.onopen = this.handleChannelStatusChange;
        this.channel.onclose = this.handleChannelStatusChange;

        document.getElementById("connect-stream-button").addEventListener("click", () => {
            console.log("Trying to connect");
            setMessage("not connected");
            const streamId = document.getElementById("stream-id").value;
            this.connect(streamId);
        });

        document.getElementById("cancel-stream-button").addEventListener("click", () => {
            document.getElementById("stream-modal").classList.add("hidden");
            document.getElementById("modal-background").classList.add("hidden");
        });

        // unsure if necessary
        // this.receiveChannel = null;
        this.connection.ondatachannel = this.receiveChannelCallback;
    }

    connect(streamId) {
        console.log("Looking for offer...");
        setMessage("searching for stream");

        let lookForOfferAttempts = 0;
        const offerInterval = setInterval(() => {
            getFromDatabase(`${streamId}offer`).then((offerStr) => {
                if (offerStr) {
                    console.log("offer found");
                    setMessage("stream found");
                    clearInterval(offerInterval);
                    this.connection.setRemoteDescription(JSON.parse(offerStr));
                    this.getCandidates(streamId).then(() => {
                        this.connection.createAnswer().then((answer) => {
                            this.connection.setLocalDescription(answer);
                            setMessage("attempting connection");
                            console.log("sending answer");
                            saveToDatabase(`${streamId}answer`, JSON.stringify(answer)).then(() => {
                                console.log("answer sent");
                            });
                        }).catch((err) => { 
                            console.log("ERROR creating answer");
                            console.log(err.message);
                        });
                    }).catch((err) => {
                        console.log("ERROR getting candidates");
                        console.log(err.message);
                    });
                } else {
                    console.log("no offer yet");
                }
            });
            lookForOfferAttempts += 1;
            if (lookForOfferAttempts > 20) {
                console.log("Took too long looking for offer");
                clearInterval(offerInterval);
            }
        }, 2000);
    }

    getCandidates(streamId) {
        return new Promise((resolve) => {
            getFromDatabase(`${streamId}candidateNum`).then((num) => {
                const n = JSON.parse(num);
                for (let i = 0; i < n + 1; i++) {
                    const candidateKey = `${streamId}candidate${n}`;
                    getFromDatabase(candidateKey).then((can) => {
                        this.connection.addIceCandidate(JSON.parse(can)).then(() => {
                            if (i === n) {
                                resolve();
                            }
                        });
                    });
                }
            });
        });
    }

    handleChannelStatusChange() {
        if (this.channel) {
            if (this.channel.readyState === "open") {
                setMessage("connected");
                console.log("Channel now OPEN");
            } else {
                setMessage("disconnected");
                console.log("Channel now CLOSED");
            }
        }
    }

    receiveChannelCallback(event) {
        this.receiveChannel = event.channel;
                
        this.receiveChannel.onmessage = handleReceiveMessage;
    }
    
    handleReceiveMessage(e) {
        console.log("data received");
        this.streamPlayer.setData(e.data);
    }
}

// for unknown reasons, could not get this to work without being an outside function and 
// relying on streamPlayer to simply already be defined globally
function handleReceiveMessage(e) {
    if (e.data === "test") {
        console.log("test message received");
    } else if (e.data === "channel open") {
        masterInfo.streaming = true;
        document.getElementById("stream-status").innerText = "connected";
        masterInfo.currentSong = "streaming";
        document.getElementById("song-label").innerText = "streaming";
        document.getElementById("stream-mode").innerText = "Stop streaming";
        hideModal("stream");
    } else {
        console.log("other message woo!");
        streamPlayer.setData(e.data);
    }
}

function setMessage(message) {
    document.getElementById("stream-status").innerText = message;
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
  