class Connector {
    constructor(masterInfo) {
        this.masterInfo = masterInfo;

        this.connection = new RTCPeerConnection();
        this.channel = this.connection.createDataChannel("channel");
        this.channel.onopen = this.handleChannelStatusChange;
        this.channel.onclose = this.handleChannelStatusChange;
        this.streamId = 0;

        this.nextSendMessage = 0;
        this.nextReceiveMessage = 0;

        document.getElementById("connect-stream-button").addEventListener("click", () => {
            console.log("Trying to connect");
            setMessage("attempting to connect");
            const streamId = document.getElementById("enter-stream-id").value;
            this.connect(streamId);
        });

        document.getElementById("cancel-stream-button").addEventListener("click", () => {
            document.getElementById("stream-modal").classList.add("hidden");
            document.getElementById("modal-background").classList.add("hidden");
        });

        // unsure if necessary
        this.receiveChannel = null;
        this.connection.ondatachannel = this.receiveChannelCallback;

        this.connection.onicecandidate = (e) => {
            if (e.candidate) {
                console.log("sending candidate");
                const objToSend = {
                    type: "candidate",
                    candidate: e.candidate
                };
                this.sendMessage(JSON.stringify(objToSend));
            }
        }

        this.connection.addEventListener("icegatheringstatechange", (e) => {
            console.log("ICE gathering state change: " + e.target.iceGatheringState);
        });
    }

    dealWithMessage(message) {
        const messageObj = JSON.parse(message);
        setMessage("communication established");
        if (messageObj.type === "candidate") {
            console.log("received candidate");
            this.connection.addIceCandidate(messageObj.candidate);
        }
        if (messageObj.type === "offer") {
            console.log("received offer");

            this.connection.setRemoteDescription(messageObj.offer).then(() => {
                this.connection.createAnswer().then((answer) => {
                    this.connection.setLocalDescription(answer).then(() => {
                        const objToSend = {
                            type: "answer",
                            answer: answer
                        };
                        this.sendMessage(JSON.stringify(objToSend));
                    });
                });
            });
        }
    }

    connect(streamId) {
        this.streamId = streamId;
        let mailboxChecks = 0;
        const checkInterval = setInterval(() => {
            this.getMessages();
            mailboxChecks += 1;
            if (mailboxChecks > 30) {
                clearInterval(checkInterval);
                console.log("timed out");
                setMessage("could not connect");
            }
            if (this.channel.readyState === "open") {
                setMessage("connected to source");
                setTimeout(() => {
                    setMessage("listening for music");
                }, 1000);
                clearInterval(checkInterval);
            }
        }, 2000);
    }

    getMessages() {
        console.log("looking for a message");
        const nextMessageKey = `${this.streamId}fromHost${this.nextReceiveMessage}`;
        getFromDatabase(nextMessageKey).then((message) => {
            if (message) {
                this.dealWithMessage(message);
                this.nextReceiveMessage += 1;
                this.getMessages();
            }
        });
    }

    sendMessage(message) {
        const messageKey = `${this.streamId}fromRemote${this.nextSendMessage}`;
        saveToDatabase(messageKey, message);
        this.nextSendMessage += 1;
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
        document.getElementById("song-label").innerText = "awaiting music";
        setTimeout(() => {
            document.getElementById("song-label").innerText = "keep your shirt on";
        }, 2000);
        hideModal("stream");
        masterInfo.streaming = true;
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
        fetch("https://beatburner.com/api/", {
        // fetch("https://graffiti.red/API/public/", {
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
        fetch("https://beatburner.com/api/", {
        // fetch("https://graffiti.red/API/public/", {
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
  