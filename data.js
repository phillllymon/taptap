const gameDataConst = {
    songDelay: 4000, // ms
    targetBounds: {
        top: 382,   //px
        bottom: 420 //px
    },
    mobile: {
        travelLength: 1.49, // fraction of viewWidth
        targetBounds: {
            top: 0.93,      // fraction of travelLength
            bottom: 1.05    // fraction of travelLength
        }
    },
    minNoteGap: 120,    // ms between notes on the same slide
    allSlides: [
        "slide-left",
        "slide-a",
        "slide-b",
        "slide-right"
    ]
}

const gameDataLet = {
    travelLength: 400,
    slideLength: 500
}