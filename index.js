'use strict';

const Alexa = require('alexa-sdk');
const request = require('request');

const APP_ID = undefined;  // TODO replace with your app ID (OPTIONAL).

var handlers = {
    "StatusIntent": function () {
        this.response.speak("Today's CloudLink forecast is sunny");
        this.emit(':responseReady');
    },
    "NexusStatusIntent": function () {
        GetDeployServerResponseTime()
            .then(data => {
                let responseTime = data.elapsedTime;
                this.response.speak("The current response time for Nexus is " + responseTime + " milliseconds");
                this.emit(':responseReady');
            })
            .catch(err =>{
                this.response.speak("I'm having trouble reaching the Nexus server right now, please try again");
                this.emit(':responseReady');
            })

    },
    "LaunchRequest": function () {
        this.response.speak("Welcome to Cloud Link");
        this.emit(':responseReady');
    }
};

exports.handler = function (event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers);
    alexa.execute();
};

function GetDeployServerResponseTime() {
    return new Promise((resolve, reject) => {
        var options = {
            url: 'https://deploy.mitel.io',
            method: 'GET',
            time: true
        }

        request(options, function (error, response, body) {
            if (error) {
                reject(error);
            }
            else {
                if (response.statusCode == 200) {
                    //console.log('Web interface status', response.statusMessage);
                    resolve(response);
                }
                if (response.statusCode >= 400 && response.statusCode < 600) {
                    console.log('Error reaching the web interface', response.statusCode, response.statusMessage);
                    reject(response);
                }
            }
        })
    })
}
