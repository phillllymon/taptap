const gameDataConst = {
    songDelay: 4000, // ms
    maxTailLength: 500,
    targetBoundSizes: {
        top: 0.03,
        bottom: 0.02
    },
    mobile: {
        maxTailLength: 1.2,
        travelLength: 1.285, // fraction of viewWidth
        targetBounds: {
            top: 0.96,      // fraction of travelLength
            bottom: 1.03    // fraction of travelLength
        }
    },
    minNoteGap: 200,    // ms between notes on the same slide
    allSlides: [
        "slide-left",
        "slide-a",
        "slide-b",
        "slide-right"
    ]
}