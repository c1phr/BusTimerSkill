'use strict';
var AWS = require('aws-sdk');
var bus_timer = require('./bus_timer.js');
var AlexaSkill = require('./AlexaSkill.js');
const APP_ID = process.env['app_id'];

const decrypted = process.env['mbta_api'];

var BusTimer = function (callback) {
    this.callback = callback;
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
BusTimer.prototype = Object.create(AlexaSkill.prototype);
BusTimer.prototype.constructor = BusTimer;

BusTimer.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("BusTimer onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

BusTimer.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("BusTimer onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    var speechOutput = "Which bus and stop would you like to know about?";
    var repromptText = "Ask about a Boston area bus";
    response.ask(speechOutput, repromptText);
};

BusTimer.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("BusTimer onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

BusTimer.prototype.intentHandlers = {
    // register custom intent handlers
    "GetBusPredictionIntent": function (intent, session, response) {        
        var route = intent.slots.Route.value;
        var stop = intent.slots.Stop.value;
        var direction = intent.slots.Direction.value;        
        if (route === undefined || stop === undefined) {
            response.tell("I'm sorry, I was unable to find that bus or stop.");
        }
        bus_timer.getPrediction(route, stop, direction, decrypted).then(function(time){
            var responseText = "The next bus will arrive in " + time + " minutes";
            console.log(responseText);
            response.tellWithCard(responseText, "MBTA " + route + " - " + stop, responseText);            
        })
        .catch(function(err){
            console.log(err);
            if (err.message === "ROUTE") {
                response.tell("I'm sorry, I was unable to find that bus route.");
            }
            else if (err.message === "STOP") {
                response.tell("I'm sorry, I was unable to find that stop on that route.");
            }
            else {
                response.tell("I'm sorry, I was unable to find that bus or stop.");
            }            
        });        
    },
    "AMAZON.HelpIntent": function (intent, session, response) {
        response.ask("Ask me when your bus will arrive at a particular stop.", "Ask me when your bus will arrive at a particular stop.");
    },
    "AMAZON.StopIntent": function(intent, session, response) {
        response.cancel();
    },
    "AMAZON.CancelIntent": function(intent, session, response) {
        response.cancel();
    },
    "AMAZON.NoIntent": function(intent, session, response) {
        response.cancel();
    }
}; 
 
function processEvent(event, context, callback) {
    if (decrypted === undefined) {        
        callback(new Error("Missing API Key"));
        context.fail("Missing API Key");        
    }
    var busTimer = new BusTimer();
    busTimer.execute(event, context);
}

exports.handler = (event, context, callback) => {
    processEvent(event, context, callback);   
};