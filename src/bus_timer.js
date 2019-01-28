'use strict';
var request = require('request-promise-native');

const mbtaApi = 'https://api-v3.mbta.com/';
var api_key;

var getPrediction = function(route, stop, direction, apiKey) {
    console.log("Get Prediction called with Route: " + route + " Stop: " + stop + " Direction: " + direction);    
    api_key = apiKey;
    return getRoute(route).then(function(route) {        
        var routeId = route.id    
        var directionIdx = findDirectionId(direction, route.attributes.direction_names);
        return getStopId(routeId, stop, directionIdx).then(function(stopId) {        
            return getTime(routeId, stopId);
        });    
    }).catch(function(exception) {
        console.error(exception);
        return undefined;
    });
}

var getTime = function(route, stop) {
    if (route === undefined) {
        throw Error("ROUTE");
    }
    if (stop === undefined) {
        throw Error("STOP");
    }
    var predictionOpts = {
        uri: mbtaApi + 'predictions',
        qs: {            
            "filter[stop]": stop
        }
    };
    return httpGet(predictionOpts).then(function(predictionData) {
        console.log(predictionData.data[0].attributes)
        if (predictionData.data === undefined || predictionData.data.length === 0 || predictionData.data[0].attributes.arrival_time === undefined) {
            return undefined;
        }
        var predictedArrival = convertDateToUTC(new Date(predictionData.data[0].attributes.arrival_time));
        var now = convertDateToUTC(new Date());
        var diffDate = Math.abs(predictedArrival - now);
        return Math.floor((diffDate/1000)/60);
    });
}

var getRoute = function(routeName) {    
    var routeOpts = {
        uri: mbtaApi + 'routes',
        qs: {}
    }
    if (isNumber(routeName)) { // Short circuit for bus route inputs (id === route number for MBTA)
        routeOpts.uri += '/' + parseInt(routeName);
    }
    return httpGet(routeOpts).then(function(routeData) {
        var possibleRoutes = [];
        if (Array.isArray(routeData.data)) {
            routeData.data.forEach(function(modeElem) {
                modeElem.route.forEach(function(routeElem) {
                    var matchConfidence = fuzzyMatch(routeName, routeElem.attributes.short_name);
                    if (matchConfidence > 0) {
                        possibleRoutes.push({route: routeElem, confidence: matchConfidence});
                    }
                });
            });
        }
        else {            
            possibleRoutes.push({route: routeData.data, confidence: 1000})
        }
        possibleRoutes.sort(function(a, b) {
            return b.confidence - a.confidence;
        });        
        var route = possibleRoutes.length > 0 ? possibleRoutes[0].route : undefined;
        return route
    });
}

var getStopId = function(route, stopName, directionIdx) {
    var stopOpts = {
        uri: mbtaApi + 'stops',
        qs: {
            "filter[route]": route,
            "filter[direction_id]": directionIdx
        }
    };
    stopName = stopName.toLowerCase();
    return httpGet(stopOpts).then(function(stops) {
        var possibleStops = [];        
        stops.data.forEach(function(stop) {                   
            var matchConfidence = fuzzyMatch(stopName, stop.attributes.name.toLowerCase());
                if (matchConfidence > 0) {
                    possibleStops.push({stop: stop, confidence: matchConfidence});
                }
        });        
        possibleStops.sort(function(a, b) {
            return b.confidence - a.confidence;
        });                
        return possibleStops.length > 0 ? possibleStops[0].stop.id : undefined;
    });
}

// Helpers

var fuzzyMatch = function(source, toMatch) {
    var sourceSplit = source.split(' ');
    var matchSplit = toMatch.split(' ');
    var confidence = 0;
    sourceSplit.forEach(function(sourceWord) {
        if (matchSplit.indexOf(sourceWord) > -1) {
            confidence++;
        }
    });
    return confidence / matchSplit.length;
}

var findDirectionId = function(directionIntent, directionArray) {
    var dirIntent = directionIntent.toLowerCase();
    var dirArray = directionArray.map(function(dir) { return dir.toLowerCase(); });
    return dirArray.indexOf(dirIntent);
}

var httpGet = function(opts, callback) {
    opts.qs.api_key = api_key;
    opts.qs.format = 'json';
    opts.json = true;    
    return request(opts);    
}

var isNumber = function(input) {
    return !isNaN(parseInt(input)) && isFinite(input);
}

var convertDateToUTC = function(date) { 
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()); 
}

exports.getPrediction = getPrediction;

// getPrediction("426", "Salem St @ Cutler Highway", "Inbound").then(function(prediction) {
//     console.log(prediction);
// });