console.log("Oh hello");



document.getElementById("bt").addEventListener("click", () => {
    navigator.bluetooth.requestDevice({ filters: [{ name: 'OnePlus Nord N20 5G' }] }).then((device) => {
        console.log(device.name);

        device.gatt.blocklist = false;

        console.log(device.gatt.blocklist);

        return device.gatt.connect();

        


    });
});


