'use strict';

const Alexa = require('alexa-sdk');

const APP_ID = undefined;  // TODO replace with your app ID (OPTIONAL).

var handlers = {
    "StatusIntent": function () {
    this.response.speak("Today's CloudLink forecast is sunny"); 
    this.emit(':responseReady');
  },
  "LaunchRequest": function () {
    this.response.speak("Welcome to Cloud Link"); 
    this.emit(':responseReady');
  }
};

exports.handler = function(event, context, callback){
  var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers);
    alexa.execute();
};
