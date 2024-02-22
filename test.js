console.log("here");

document.getElementById("test-button").addEventListener("touchstart", () => {
    console.log("CLICK");
    document.getElementById("then-button").addEventListener("touchstart", () => {
        document.getElementById("full").requestFullscreen();

    });


});