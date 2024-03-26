// // zoomUtils.js
// const crypto = require('crypto');

// function generateSignature(apiKey, apiSecret, meetingNumber, role) {
//     const timestamp = new Date().getTime() - 30000;
//     const msg = Buffer.from(apiKey + meetingNumber + timestamp + role).toString('base64');
//     const hash = crypto.createHmac('sha256', apiSecret).update(msg).digest('base64');
//     const signature = Buffer.from(`${apiKey}.${meetingNumber}.${timestamp}.${role}.${hash}`).toString('base64');

//     return signature;
// }

// module.exports = { generateSignature };
