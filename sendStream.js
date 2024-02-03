









    





// navigator.mediaDevices.selectAudioOutput().then((res) => {
    // console.log(res);
    // navigator.mediaDevices.getUserMedia({ audio: true }).then((r) => {
    //     console.log(r);
    // });
// });


const playButton = document.getElementById("play");


playButton.addEventListener("click", () => {
    navigator.mediaDevices.enumerateDevices().then((res) => {
        console.log(res);
    });
});

console.log("here");

navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    const mediaRecorder = new MediaRecorder(stream);

    const recordButton = document.getElementById("record");
    const stopButton = document.getElementById("stop");
    // const playButton = document.getElementById("play");

    const audio0 = new Audio();
    const audio1 = new Audio();
    const audio2 = new Audio();
    const audio3 = new Audio();
    const audio4 = new Audio();

    // const audioCtx = new AudioContext();
    // audioCtx.createMediaElementSource(audio0);
    // audioCtx.setSinkId("HSZ1HBpdQ23QbiicQxlzYUaYEX+qazokaQdqJFq0gbE=").then((res) => {
    //     console.log(res);
    // });

    let chunks = [];
    let startTime;
    let blob;
    let theInterval;
    let audio = audio0;
    
    const clips = [];

    // recordButton.addEventListener("click", () => {
    //     mediaRecorder.start();
    //     setTimeout(() => {
    //         mediaRecorder.stop();
    //         blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
    //         const audioURL = window.URL.createObjectURL(blob);
    //         audio1.src = audioURL;
    //     }, 2000);
    // });

    stopButton.addEventListener("click", () => {
        mediaRecorder.stop();
        console.log("no longer recording");
    });
    
    let i = 0;
    recordButton.addEventListener("click", () => {
        mediaRecorder.start();
        console.log("recording...");
        theInterval = setInterval(() => {
            if (i > 4) {
                mediaRecorder.stop();
                clearInterval(theInterval);
                console.log("done recording");
            } else {
                if (i === 0) {
                    audio = audio0;
                }
                if (i === 1) {
                    audio = audio1;
                }
                if (i === 2) {
                    audio = audio2;
                }
                if (i === 3) {
                    audio = audio3;
                }
                if (i === 4) {
                    audio = audio4;
                }
                mediaRecorder.stop();
                mediaRecorder.start();
                
                

                // chunks = [];
                // mediaRecorder.start();
                
                
                console.log("C");
                i += 1;
            }
        }, 1000);
    });

    

    mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
        blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
        chunks = [];
        const audioURL = window.URL.createObjectURL(blob);
        audio.src = audioURL;
    };
    [
        ["play0", audio0],
        ["play1", audio1],
        ["play2", audio2],
        ["play3", audio3],
        ["play4", audio4],
    ].forEach((set) => {
        document.getElementById(set[0]).addEventListener("click", () => {
            set[1].play();
        });
    });
       
    document.getElementById("playAll").addEventListener("click", () => {
        let j = 0;
        const playInterval = setInterval(() => {
            if (j > 4) {
                clearInterval(playInterval);
                console.log("done playing");
            } else {
                if (j === 0) {
                    
                    audio0.play();
                }
                if (j === 1) {
                    audio0.pause();
                    audio1.play();
                }
                if (j === 2) {
                    audio1.pause();
                    audio2.play();
                }
                if (j === 3) {
                    audio2.pause();
                    audio3.play();
                }
                if (j === 4) {
                    audio3.pause();
                    audio4.play();
                }
                j += 1;
            }
        }, 1000);
    });

});



// const mediaRecorder = new MediaRecorder(stream);


