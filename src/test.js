var bus_timer = require('./bus_timer.js');
console.log(bus_timer.getPrediction);
bus_timer.getPrediction("426", "market street at commuter rail", undefined, 'wX9NwuHnZU2ToO7GmGR9uw').then(function(prediction) {
    console.log(prediction);
});