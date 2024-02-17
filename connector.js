class Connector {
    constructor(onMessage, onConnect) {
        this.connected = false;
        this.connection = null;
        this.channel = null;
        this.receiveChannel = null;
        this.waitForOffer = null;
        this.waitForAnswer = null;
        this.candidateNum = 0;
        this.offerNum = null;
        this.onMessage = onMessage;
        this.onConnect = onConnect;
    }

    offerConnection() {
        this.connection = new RTCPeerConnection();
        this.channel = this.connection.createDataChannel("channel");
        this.channel.onopen = () => {
            console.log("CHANNEL OPEN!");
            this.connected = true;
        };
        
        this.connection.ondatachannel = (event) => {
            this.receiveChannel = event.channel;
            this.receiveChannel.onmessage = (event) => {
                this.onMessage(event.data);
            };
            // this.receiveChannel.onmessage = (event) => {
            //     const m = event.data;
            //     console.log("message: " + m);
            // };
        };
        
        this.offerNum = Math.floor(100000 * Math.random());
        console.log("BBBBBBBBB");
        this.connection.onicecandidate = (e) => {
            // if (e.candidate) {
            if (e.candidate && this.candidateNum === 0) {
                const candidateKey = `${this.offerNum}candidate${this.candidateNum}`;
                saveToDatabase(candidateKey, JSON.stringify(e.candidate));
                saveToDatabase(`${this.offerNum}candidateNum`, JSON.stringify(this.candidateNum));
                this.candidateNum += 1;
            }
        };

        this.connection.createOffer().then((offer) => {
            this.connection.setLocalDescription(offer);
            const offerStr = JSON.stringify(offer);
            const offerKey = `offer${this.offerNum}`;
            saveToDatabase(offerKey, offerStr);

            let checks = 0;
            this.waitForAnswer = setInterval(() => {
                console.log("checking for answer.....");
                getFromDatabase(`answer${this.offerNum}`).then((res) => {
                    if (res) {
                        clearInterval(this.waitForAnswer);
                        const answer = JSON.parse(res);
                        this.connection.setRemoteDescription(answer).then(() => {
                            console.log("Answer received and accepted");
                        });
                    }
                });

                checks += 1;
                if (checks > 20) {
                    clearInterval(this.waitForAnswer);
                    console.log("Timed out waiting for offer");
                }
            }, 5000);
        });

        return this.offerNum;
    }

    findConnection(offerNum) {
        return new Promise((resolve) => {

            this.connection = new RTCPeerConnection();
            this.channel = this.connection.createDataChannel("channel");
            this.channel.onopen = () => {
                console.log("CHANNEL OPEN!")
                this.connected = true;
            };

            this.connection.ondatachannel = (event) => {
                console.log("WE GOT A CHANNEL!");
                this.receiveChannel = event.channel;
                this.receiveChannel.onmessage = (event) => {
                    this.onMessage(event.data);
                };
                // this.receiveChannel.onmessage = (event) => {
                //     const m = event.data;
                //     console.log("message: " + m);
                // };
            };

            const offerKey = `offer${offerNum}`;
            let checks = 0;
            this.waitForOffer = setInterval(() => {
                console.log("checking for offer.....");
                getFromDatabase(offerKey).then((res) => {
                    if (res) {
                        clearInterval(this.waitForOffer);
                        const offer = JSON.parse(res);
                        this.connection.setRemoteDescription(offer).then(() => {
                            getCandidates(offerNum, this.connection).then(() => {
                                this.connection.createAnswer().then((answer) => {
                                    this.connection.setLocalDescription(answer).then(() => {
                                        saveToDatabase(`answer${offerNum}`, JSON.stringify(answer)).then(() => {
                                            console.log("offer found and answer sent");
                                            resolve(true);
                                        });
                                    });
                                });
                            });
                        });
                    }
                });

                checks += 1;
                if (checks > 20) {
                    clearInterval(this.waitForOffer);
                    console.log("Timed out waiting for offer");
                    resolve(false);
                }
            }, 5000);
        });
    }

    send(message) {
        if (this.connected) {
            console.log("attempting to send.....");
            this.channel.send(message);
        } else {
            console.log("not connected");
        }
    }

    closeConnection() {

    }
}






function getCandidates(offerNum, connection) {
    return new Promise((resolve) => {
        getFromDatabase(`${offerNum}candidateNum`).then((num) => {
            const n = JSON.parse(num);
            for (let i = 0; i < n + 1; i++) {
                const candidateKey = `${offerNum}candidate${n}`;
                getFromDatabase(candidateKey).then((can) => {
                    const candidate = JSON.parse(can);
                    connection.addIceCandidate(candidate).then(() => {
                        console.log("i is " + i);
                        if (i === n) {
                            resolve();
                        }
                    });
                });
            }
        });
    });
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
                if (r.message === "successfully retrieved") {
                    resolve(r.value);
                } else {
                    resolve(false);
                }
            });
        });
    });
}