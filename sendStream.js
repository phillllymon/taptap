


let chunksA = [];

const audioA = new Audio();
const audioB = new Audio();

[
    ["playA", audioA],
    ["playB", audioB],
].forEach((set) => {
    document.getElementById(set[0]).addEventListener("click", () => {
        set[1].play();
    });
});

// navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
navigator.mediaDevices.getUserMedia({ audio: {
    noiseSuppression: false,
    echoCancellation: false
} }).then((stream) => {

    const mediaRecorderA = new MediaRecorder(stream);
    console.log("recording...");
    
    mediaRecorderA.start();
    setTimeout(() => {
        mediaRecorderA.stop();
        console.log("done recording");
    }, 3000);

    mediaRecorderA.ondataavailable = (e) => {
        chunksA.push(e.data);
    };

    mediaRecorderA.onstop = () => {
        console.log("chunks length: " + chunksA.length);
        const blob = new Blob(chunksA, { type: "audio/ogg; codecs=opus" });

        newBlob = new Blob(chunksA, { type: "audio/ogg; codecs=opus" });

        

        fetch("https://graffiti.red/API/public/", {
            method: "POST",
            body: JSON.stringify({
                action: "retrieve",
                name: "test"
            })
        }).then((res) => {
            res.json().then((r) => {
                console.log(r);
            });
        });

        chunksA = [];
        const audioURL = window.URL.createObjectURL(blob);
        audioA.src = audioURL;
        console.log("A ready to play");

        // experiment with string saving here
        const reader = new FileReader();
        reader.onload = (readerE) => {
            const str = btoa(readerE.target.result);

            // console.log(typeof str);
            // console.log(str.length);

            const strToSave = JSON.stringify({
                data: "some other data",
                str: str
            });

            saveToDatabase("streamData", strToSave).then(() => {
                console.log("sent to database");
                getFromDatabase("streamData").then((val) => {
                    console.log("back from database");
                    const retrievedObj = JSON.parse(val);
                    console.log(retrievedObj.data);
                    const strToUse = retrievedObj.str;
                    audioB.src = `data:audio/x-wav;base64,${strToUse}`;
                    console.log("B ready");
                });
            });

            // audioB.src = `data:audio/x-wav;base64,${str}`;
        };
        reader.readAsBinaryString(blob);


        
        // END experiment
        
    };
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


