
const events = require('./events.json');
const handler = require('./index.js');

handler.handler(events.StatusGreenIntent, null, null);