// models/ZoomToken.js
const mongoose = require('mongoose');

const zoomTokenSchema = new mongoose.Schema({
    access_token: {
        type: String,
        required: true,
    },
    expires_at: {
        type: Date,
        required: true,
    },
});

const ZoomToken = mongoose.model('ZoomToken', zoomTokenSchema);

module.exports = ZoomToken;
