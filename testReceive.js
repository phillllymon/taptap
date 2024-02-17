console.log("I am the follower");

const connector = new Connector(onMessage, onConnect);

function onMessage (message) {
    console.log("message received: " + message);
};

function onConnect () {
    console.log("Connected!");
};


document.getElementById("start").addEventListener("click", () => {
    const id = document.getElementById("num").value;
    console.log("trying to find connection with id " + id);
    connector.findConnection(id);
});

document.getElementById("send").addEventListener("click", () => {
    connector.send("test message");
});