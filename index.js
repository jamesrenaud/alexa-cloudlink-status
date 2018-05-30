'use strict';

const Alexa = require('ask-sdk');
const request = require('request');

let skill;
let incidentTitle;
let incidentMessage;
let incidentStatus;

let statusResponses = [
    "The incident is currently scheduled.",
    "We're currently investigating the issue.",
    "The issue has been identified and we are working towards a resolution.",
    "The issue has been resolved and we are monitoring for any re-occurrences."
]

let innovationDayIssueId = 62;

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
        return CheckForBadComponents()
            .then(data => {
                if (data) {
                    speechText = 'The CloudLink cloud is currently sunny, blue skies, and rainbows. All services are reporting operational. <say-as interpret-as="interjection">Yay!</say-as>';
                }
                else {
                    let tempdate = incidentStatus.split(' ');
                    let temptime = tempdate[1].split(':');
                    let date = tempdate[0].replace(/-/g, '').toString();
                    let time = formatAMPM(new Date(tempdate));
                    speechText = '<say-as interpret-as="interjection">uh oh!</say-as> <p>A component is reporting an unhealthy state. <say-as interpret-as="interjection">shucks!</say-as></p><p> The affected service is ' + incidentTitle + '</p> <p>its currently reporting a status of ' + incidentMessage + '</p> <p>This status was updated on <say-as interpret-as="date">' + date + '</say-as> at ' + time + '</p>';
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

const CheckForIncidentsHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'IncidentCheckIntent';
    },
    handle(handlerInput) {

        let speechText;

        return CheckForIncidents()
            .then(data => {
                if (data) {
                    speechText = '<p>There are currently no issues being reported on the CloudLink cloud.</p> <p><say-as interpret-as="interjection">Booya!</say-as></p>'
                }
                else {
                    speechText = '<p>An incident has been reported on the CloudLink Cloud. <say-as interpret-as="interjection">dun dun dun!</say-as></p><p> The title of the incident is ' + incidentTitle + '</p> <p>The message of the incident is ' + incidentMessage + '</p> <p>' + statusResponses[incidentStatus] + '</p>';
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

const SendChatMessageHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'SendChatIntent';
    },
    handle(handlerInput) {
        let targetTeam = handlerInput.requestEnvelope.request.intent.slots.group.value;
        let speechText;

        return SendChatMessage('This is a page from the DevOps team for the ' + targetTeam + ' team. Please standby for more information.')
            .then(data => {
                speechText = 'The chat has been started with the ' + targetTeam + ' team, you should receive a notification in Sparrow shortly.'
            })
            .then(data => {
                console.log(speechText);
                return handlerInput.responseBuilder
                    .speak(speechText)
                    .getResponse();
            })
            .catch(err => {
                speechText = 'Im having trouble sending a page to the ' + targetTeam + ' team. Please try again.';
                return handlerInput.responseBuilder
                    .speak(speechText)
                    .getResponse();
            })
    }
};

const SendSmsMessageHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'SendSmsIntent';
    },
    handle(handlerInput) {
        let targetTeam = handlerInput.requestEnvelope.request.intent.slots.group.value;
        let speechText;

        return SendSmsMessage('This is a page from the DevOps team for the ' + targetTeam + ' team. Please check Sparrow for the chat stream.')
            .then(data => {
                speechText = 'An SMS has been sent to the ' + targetTeam + ' team to check for messages in Sparrow.'
            })
            .then(data => {
                console.log(speechText);
                return handlerInput.responseBuilder
                    .speak(speechText)
                    .getResponse();
            })
            .catch(err => {
                speechText = 'Im having trouble sending a page to the ' + targetTeam + ' team. Please try again.';
                return handlerInput.responseBuilder
                    .speak(speechText)
                    .getResponse();
            })
    }
};

const AffectedUsersIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AffectedUsersIntent';
    },
    handle(handlerInput) {
        let userCount = Math.floor(getRandomArbitrary(250, 1500));

        const speechText = 'Based on the issue analysis, CloudLink is reporting ' + userCount + ' users are affected by this issue.'

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .withSimpleCard('Hello World', speechText)
            .getResponse();
    }
};

const UpdateCustomersIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'UpdateCustomersIntent';
    },
    handle(handlerInput) {
        //let userCount = Math.floor(getRandomArbitrary(250, 1500));


        const speechText = 'Based on the issue analysis, CloudLink is reporting ' + userCount + ' users are affected by this issue.'

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .withSimpleCard('Hello World', speechText)
            .getResponse();
    }
};

const OpenStatusIssueIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'OpenStatusIssueIntent';
    },
    handle(handlerInput) {
        if (handlerInput.requestEnvelope.request.dialogState === 'STARTED') {
            return Dialog.delegate();
        }
        else if (handlerInput.requestEnvelope.request.dialogState === 'COMPLETED') {

        }
        else {

        }
        let description = handlerInput.requestEnvelope.request.intent.slots.group.value;
        let userCount = getRandomArbitrary(5, 250);

        const speechText = 'Based on the AI analysis, CloudLink reports ' + userCount + ' users are affected by this issue.'

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .withSimpleCard('Hello World', speechText)
            .getResponse();
    }
};

const UpdateComponentIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'UpdateComponentIntent';
    },
    handle(handlerInput) {
        let component = '31'
        let componentStatus = handlerInput.requestEnvelope.request.intent.slots.statusColor.value;
        let statusCode;
        let speechText;
        switch (componentStatus) {
            case 'green':
                statusCode = 1
                break;
            case 'yellow':
                statusCode = 2
                break;
            case 'orange':
                statusCode = 3
                break;
            case 'red':
                statusCode = 4
                break;
        }

        return UpdateComponentStatus(statusCode, component)
            .then(data => {
                speechText = 'I have updated the audio quality service status to ' + componentStatus;
            })
            .then(data => {
                console.log(speechText);
                return handlerInput.responseBuilder
                    .speak(speechText)
                    .getResponse();
            })
            .catch(err => {
                speechText = 'Im having trouble setting the component to ' + componentStatus + '. Please try again.';
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
                            incidentStatus = incident.status;
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

function OpenIncident(description) {
    return new Promise((resolve, reject) => {
        let statusCreds = {
            url: "https://status.dev.mitel.io",
            apiKey: "sTSldlMMXfMMdh4VOVy5"
        }

        var options = {
            url: statusCreds.url + '/api/v1/incidents/' + innovationDayIssueId,
            method: 'PUT',
            headers: {
                'X-Cachet-Token': statusCreds.apiKey
            },
            json: true,
            body: {
                message: description,
                status: 1
            }
        }

        request(options, function (error, response, body) {
            if (error) {
                console.log(error);
                reject(error);
            }
            else {
                if (response.statusCode == 200) {
                    resolve(true);
                }
                else {
                    let data = JSON.parse(response.body);
                    reject(data);
                }
            }
        })
    })
}

function CheckForBadComponents() {
    return new Promise((resolve, reject) => {
        let statusCreds = {
            url: "https://status.dev.mitel.io",
            apiKey: "sTSldlMMXfMMdh4VOVy5"
        }

        var options = {
            url: statusCreds.url + '/api/v1/components?per_page=100',
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
                    data.data.find(function (component) {
                        if (component.status_name != 'Operational') {
                            isCloudHealthy = false;
                            incidentTitle = component.name
                            incidentMessage = component.status_name;
                            incidentStatus = component.updated_at;
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

function SendChatMessage(message) {
    return new Promise((resolve, reject) => {
        let options = {
            url: 'https://workflow.dev.api.mitel.io/2017-09-01/webhooks/activities/c0313d39-aaec-40a4-bf17-1881a7ae4a99/workers',
            method: 'POST',
            headers: {
                'x-mitel-accountid': '105990045',
                'x-mitel-shared-secret': 'welcome1'
            },
            json: true,
            body: {
                inputs: {
                    contacts: [
                        "james.renaud@mitel.com",
                        "megan.annett@mitel.com",
                        "paul-h.vandenbosch@mitel.com"
                    ],
                    operation: "startChat",
                    chatMessage: message
                },
                throughputs: {}
            }
        }

        request(options, function (error, response, body) {
            if (error) {
                console.log(error);
                reject(error);
            }
            else {
                if (response.statusCode == 202) {
                    resolve(true);
                }
                else {
                    let data = JSON.parse(response.body);
                    resolve(data);
                }
            }
        })
    })
}

function SendCustomerEmail() {
    return new Promise((resolve, reject) => {
        let options = {
            url: 'https://workflow.dev.api.mitel.io/2017-09-01/webhooks/activities/c0313d39-aaec-40a4-bf17-1881a7ae4a99/workers',
            method: 'POST',
            headers: {
                'x-mitel-accountid': '105990045',
                'x-mitel-shared-secret': 'welcome1'
            },
            json: true,
            body: {
                inputs: {
                    contacts: [
                        "mitelcl1@gmail.com"
                    ],
                    operation: "sendFollowUp"
                },
                throughputs: {}
            }
        }

        request(options, function (error, response, body) {
            if (error) {
                console.log(error);
                reject(error);
            }
            else {
                if (response.statusCode == 202) {
                    resolve(true);
                }
                else {
                    let data = JSON.parse(response.body);
                    resolve(data);
                }
            }
        })
    })
}

function UpdateComponentStatus(statusCode, componentId) {
    return new Promise((resolve, reject) => {
        let statusCreds = {
            url: "https://status.dev.mitel.io",
            apiKey: "sTSldlMMXfMMdh4VOVy5"
        }

        var options = {
            url: statusCreds.url + '/api/v1/components/' + componentId,
            method: 'PUT',
            json: true,
            headers: {
                'Content-Type': 'application/json',
                'X-Cachet-Token': statusCreds.apiKey
            },
            body: {
                status: statusCode
            }
        }

        request(options, function (error, response, body) {
            if (error) {
                console.log(error);
                reject(error);
            }
            else {
                if (response.statusCode == 200) {
                    resolve(true);
                }
                else {
                    let data = JSON.parse(response.body);
                    reject(data);
                }
            }
        })
    })
}

function SendSmsMessage(message) {
    return new Promise((resolve, reject) => {
        let options = {
            url: 'https://workflow.dev.api.mitel.io/2017-09-01/webhooks/activities/c0313d39-aaec-40a4-bf17-1881a7ae4a99/workers',
            method: 'POST',
            headers: {
                'x-mitel-accountid': '105990045',
                'x-mitel-shared-secret': 'welcome1'
            },
            json: true,
            body: {
                inputs: {
                    contacts: [
                        "james.renaud@mitel.com"
                    ],
                    operation: "sendSms",
                    phoneNumber: '6138048049',
                    chatMessage: message
                },
                throughputs: {}
            }
        }

        request(options, function (error, response, body) {
            if (error) {
                console.log(error);
                reject(error);
            }
            else {
                if (response.statusCode == 202) {
                    resolve(true);
                }
                else {
                    let data = JSON.parse(response.body);
                    resolve(data);
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
                CheckForIncidentsHandler,
                SendChatMessageHandler,
                SendSmsMessageHandler,
                AffectedUsersIntentHandler,
                OpenStatusIssueIntentHandler,
                UpdateComponentIntentHandler
            )
            .addErrorHandlers(ErrorHandler)
            .create();
    }

    return skill.invoke(event, context);
}

function formatAMPM(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    var strTime = hours + ' ' + minutes + ' ' + ampm;
    return strTime;
}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}