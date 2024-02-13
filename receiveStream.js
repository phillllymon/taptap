console.log("I am the receiver");

const audioA = new Audio();

document.getElementById("play").addEventListener("click", () => {
    audioA.play();
});

console.log("querying database....");
getFromDatabase("streamData").then((res) => {
    console.log("data received");
    const obj = JSON.parse(res);
    audioA.src = `data:audio/x-wav;base64,${obj.str}`;
    console.log("A ready to play");
});


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