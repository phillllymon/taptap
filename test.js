console.log("I am the leader");

const connector = new Connector(onMessage, onConnect);

function onMessage (message) {
    console.log("message received: " + message);
};

function onConnect () {
    console.log("Connected!");
};

document.getElementById("start").addEventListener("click", () => {
    const id = connector.offerConnection();
    console.log("connection id: " + id);
});

document.getElementById("send").addEventListener("click", () => {
    connector.send("Woo a message!");
});