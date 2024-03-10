console.log("here");


const player = new Audio();
const radioPlayer = new Audio();

document.getElementById("file-input").addEventListener("change", (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (readerE) => {
        const str = btoa(readerE.target.result);
        const newSongData = `data:audio/x-wav;base64,${str}`;
        
        player.src = newSongData;

        const audioCtx = new AudioContext();
        const audioSource = audioCtx.createMediaElementSource(player);
        
        // audioCtx.setSinkId({ type: "none" });
        const myDelay = audioCtx.createDelay(4.0);
        myDelay.delayTime.setValueAtTime(4.0, player.currentTime);
        audioSource.connect(myDelay);
        myDelay.connect(audioCtx.destination);

        player.addEventListener("canplaythrough", () => {
            // console.log("ready to play");
            // const source2 = audioCtx.createMediaStreamSource(player.captureStream());
            // const player2 = new Audio(source2);
        });

        radioPlayer.src = "https://classicalking.streamguys1.com/king-fm-aac-128k";
        radioPlayer.crossOrigin = "anonymous";
        radioPlayer.addEventListener("canplaythrough", () => {
            console.log("radio ready");

            const radioSourceDelay = audioCtx.createMediaElementSource(radioPlayer);
            const radioDelay = audioCtx.createDelay(4.0);
            radioDelay.delayTime.setValueAtTime(4.0, radioPlayer.currentTime);
            radioSourceDelay.connect(radioDelay);
            radioDelay.connect(audioCtx.destination);
            
            const nowCtx = new AudioContext();
            const radioSource = nowCtx.createMediaStreamSource(radioPlayer.captureStream());
            const analyser = nowCtx.createAnalyser();
            radioSource.connect(analyser);
            nowCtx.setSinkId({ type: "none" });
            analyser.connect(nowCtx.destination);
            analyser.fftSize = 32;
            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            setInterval(() => {
                analyser.getByteFrequencyData(dataArray);
                console.log(dataArray);
            }, 500);
        });

    };
    reader.readAsBinaryString(file);
});




document.getElementById("play-button").addEventListener("click", () => {
    radioPlayer.play();
});

document.getElementById("stop-button").addEventListener("click", () => {
    radioPlayer.pause();
});

