'use strict';

// const Alexa = require('alexa-sdk');

// const APP_ID = undefined;  // TODO replace with your app ID (OPTIONAL).

// var handlers = {
//     "StatusIntent": function () {
//         this.response.speak("Today's CloudLink forecast is sunny");
//         this.emit(':responseReady');
//     },
//     "NexusStatusIntent": function () {
//         GetDeployServerResponseTime()
//             .then(data => {
//                 let responseTime = data.elapsedTime;
//                 this.response.speak("The current response time for Nexus is " + responseTime + " milliseconds");
//                 this.emit(':responseReady');
//             })
//             .catch(err =>{
//                 this.response.speak("I'm having trouble reaching the Nexus server right now, please try again");
//                 this.emit(':responseReady');
//             })

//     },
//     "LaunchRequest": function () {
//         this.response.speak("Welcome to Cloud Link");
//         this.emit(':responseReady');
//     }
// };

// exports.handler = function (event, context, callback) {
//     var alexa = Alexa.handler(event, context);
//     alexa.registerHandlers(handlers);
//     alexa.execute();
// };

'use strict';

const Alexa = require('ask-sdk-core');
const request = require('request');
// use 'ask-sdk' if standard SDK module is installed

// Code for the handlers here

let skill;

exports.handler = async function (event, context) {
    console.log(`REQUEST++++${JSON.stringify(event)}`);
    if (!skill) {
        skill = Alexa.SkillBuilders.custom()
            .addRequestHandlers(
                LaunchRequestHandler,
                StatusIntentIntentHandler,
                HelpIntentHandler,
                CancelAndStopIntentHandler,
                SessionEndedRequestHandler,
                NexusStatusIntentHandler
            )
            .addErrorHandlers(ErrorHandler)
            .create();
    }

    return skill.invoke(event, context);
}

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speechText = 'Welcome to the Alexa Skills Kit, you can say hello!';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .withSimpleCard('Hello World', speechText)
            .getResponse();
    }
};

const StatusIntentIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'StatusIntent';
    },
    handle(handlerInput) {

        const speechText = 'Todays CloudLink forecast is sunny';

        return handlerInput.responseBuilder
            .speak(speechText);
    }
};

const NexusStatusIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'NexusStatusIntent';
    },
    handle(handlerInput) {

        let speechText = '';
        GetDeployServerResponseTime()
            .then(data => {
                speechText = "The current response time for Nexus is " + data.elapsedTime + " milliseconds"
            })
            .catch(err => {
                speechText = "I'm having trouble reaching the Nexus server right now, please try again";
            })

        return handlerInput.responseBuilder
            .speak(speechText);
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speechText = 'You can say hello to me!';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .withSimpleCard('Hello World', speechText)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speechText = 'Goodbye!';

        return handlerInput.responseBuilder
            .speak(speechText)
            .withSimpleCard('Hello World', speechText)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        //any cleanup logic goes here
        return handlerInput.responseBuilder.getResponse();
    }
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
