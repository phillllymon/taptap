console.log("Oh hello");



document.getElementById("bt").addEventListener("click", () => {
    navigator.bluetooth.requestDevice({ acceptAllDevices: true }).then((device) => {
        console.log(device.name);

        device.gatt.blocklist = false;

        console.log(device.gatt.blocklist);

        return device.gatt.connect();

        


    });
});


