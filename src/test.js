var bus_timer = require('./bus_timer.js');
var assert = require('assert');

describe('bus timer tests', function() {
    it ('should return a time with a stop, route, and no direction', function(done) {        
        bus_timer.getPrediction("426", "market street at commuter rail", undefined, process.env['mbta_api']).then(function(prediction) {
            assert(prediction !== undefined);
            done();
        });
    });
    it ('should return a time with a stop, route, and direction', function(done) {        
        bus_timer.getPrediction("426", "cliftondale square", "outbound", process.env['mbta_api']).then(function(prediction) {
            assert(prediction !== undefined);
            done();
        });
    });
})