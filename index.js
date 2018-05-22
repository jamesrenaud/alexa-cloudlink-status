'use strict';

const Alexa = require('ask-sdk');
const request = require('request');

let skill;
let incidentTitle;
let incidentMessage;

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

const NexusStatusIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'NexusStatusIntent';
    },
    handle(handlerInput) {

        let speechText;
        return GetDeployServerResponseTime()
            .then(data => {
                speechText = "The current response time for Nexus is " + data.elapsedTime + " milliseconds"
            })
            .then(data => {
                console.log(speechText);
                return handlerInput.responseBuilder
                    .speak(speechText)
                    .getResponse();
            })
            .catch(err => {
                speechText = "I'm having trouble reaching the Nexus server right now, please try again";
                return handlerInput.responseBuilder
                    .speak(speechText)
                    .getResponse();
            })
    }
};

const StatusIntentIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'StatusIntent';
    },
    handle(handlerInput) {

        let speechText;

        // speechText = 'The CloudLink cloud is currently <say-as interpret-as="expletive">fucking</say-as> sunny, with blue skies, and rainbows. <say-as interpret-as="interjection">Booya!</say-as>';
        // return handlerInput.responseBuilder
        //     .speak(speechText)
        //     .getResponse();

        return CheckForIncidents()
            .then(data => {
                if (data) {
                    speechText = 'The CloudLink cloud is currently <say-as interpret-as="expletive">trend</say-as>ing sunny, blue skies, and rainbows. <say-as interpret-as="interjection">Booya!</say-as>';

                }
                else {
                    speechText = '<p>An incident has been reported on the CloudLink Cloud. <say-as interpret-as="interjection">dun dun dun!</say-as></p><p> The title of the incident is ' + incidentTitle + '</p> <p>The message of the incident is ' + incidentMessage + '</p><p> We are currently working on a fix</p> <audio src="https://s3.amazonaws.com/ask-soundlibrary/battle/amzn_sfx_battle_group_clanks_01.mp3"/>';
                }
            })
            .then(data => {
                console.log(speechText);
                return handlerInput.responseBuilder
                    .speak(speechText)
                    .getResponse();
            })
            .catch(err => {
                speechText = 'Im having trouble determining the forecast of the cloud right now, please try again';
                return handlerInput.responseBuilder
                    .speak(speechText)
                    .getResponse();
            })
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

function CheckForIncidents() {
    return new Promise((resolve, reject) => {
        let statusCreds = {
            url: "https://status.dev.mitel.io",
            apiKey: "sTSldlMMXfMMdh4VOVy5"
        }

        var options = {
            url: statusCreds.url + '/api/v1/incidents?per_page=100',
            method: 'GET',
            headers: {
                'X-Cachet-Token': statusCreds.apiKey
            }
        }

        request(options, function (error, response, body) {
            if (error) {
                console.log(error);
                reject(error);
            }
            else {
                if (response.statusCode == 200) {
                    let data = JSON.parse(response.body);
                    let isCloudHealthy = true;
                    data.data.find(function (incident) {
                        if (incident.status < 4 && incident.status != 0) {
                            isCloudHealthy = false;
                            incidentTitle = incident.name;
                            incidentMessage = incident.message;
                        }
                    })
                    resolve(isCloudHealthy);
                }
                else {
                    let data = JSON.parse(response.body);
                    reject(data);
                }
            }
        })
    })
}

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`Error handled: ${error.message}`);

        return handlerInput.responseBuilder
            .speak('Sorry, I can\'t understand the command. Please say again.')
            .reprompt('Sorry, I can\'t understand the command. Please say again.')
            .getResponse();
    },
};

exports.handler = async function (event, context) {
    console.log(`REQUEST++++${JSON.stringify(event)}`);
    if (!skill) {
        skill = Alexa.SkillBuilders.custom()
            .addRequestHandlers(
                LaunchRequestHandler,
                StatusIntentIntentHandler,
                NexusStatusIntentHandler,
                HelpIntentHandler,
                CancelAndStopIntentHandler,
                SessionEndedRequestHandler,
        )
            .addErrorHandlers(ErrorHandler)
            .create();
    }

    return skill.invoke(event, context);
}
