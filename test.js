console.log("here");

const radioStream = "https://23093.live.streamtheworld.com/KQMVFM.mp3?dist=hubbard&source=hubbard-web&ttag=web&gdpr=0";
const player = new Audio();
player.src = radioStream;
player.crossOrigin = "anonymous";


const player2 = new Audio(radioStream);

document.getElementById("file-input").addEventListener("change", (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (readerE) => {
        const str = btoa(readerE.target.result);
        const newSongData = `data:audio/x-wav;base64,${str}`;
        
        player.src = newSongData;
    };
    reader.readAsBinaryString(file);
});

// ---------------- silent play and capture data
const audioCtx = new AudioContext();
// audioCtx.destination = { playSound: true };
const audioSource = audioCtx.createMediaElementSource(player);
const analyser = audioCtx.createAnalyser();
audioSource.connect(analyser);
audioCtx.setSinkId({ type: "none" });
analyser.connect(audioCtx.destination);
analyser.fftSize = 32;
dataArray = new Uint8Array(analyser.frequencyBinCount);

// ----------------- record segment
let playerB;
let arr = [];
let recordAudioCtx;
let dest;
let recorder;
let stream;


function animate() {
    analyser.getByteFrequencyData(dataArray);
    dataArray.forEach((val, i) => {
        document.getElementById(`col${i}`).style.height = `${val}px`;
    });
    requestAnimationFrame(animate);
}

document.getElementById("record-button").addEventListener("click", () => {
    player.play();
    animate();

    // audioCtx = new AudioContext();
    dest = audioCtx.createMediaStreamDestination();
    recorder = new MediaRecorder(dest.stream);
    stream = audioCtx.createMediaStreamSource(player.captureStream());
    stream.connect(dest);

    recorder.ondataavailable = (e) => {
        arr.push(e.data);
    };
    recorder.onstop = () => {

        console.log("recorder stopped");

        const blob = new Blob(arr, { type: "audio/ogg; codecs=opus" });
        const reader = new FileReader();
        reader.onload = (readerE) => {

            console.log("reader loaded");

            const str = btoa(readerE.target.result);

            console.log("here");
            console.log(str);

            playerB = new Audio(`data:audio/x-wav;base64,${str}`);
        };
        reader.readAsBinaryString(blob);
    };

    recorder.start();
});

document.getElementById("stop-button").addEventListener("click", () => {
    player.pause();
    // player2.pause();
    recorder.stop();
});

const audioA = new Audio(radioStream);
const audioB = new Audio(radioStream);

document.getElementById("play-button").addEventListener("click", () => {
    playerB.play();
    
    
    // audioA.play();
    // audioB.play();
    // setTimeout(() => {
    //     audioB.play();
    // }, 4000);
    // setInterval(() => {
    //     console.log(audioA.currentTime + "  " + audioB.currentTime);
    // }, 1000);
});

