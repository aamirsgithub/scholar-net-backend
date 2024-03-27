require('dotenv').config();
const { createZoomMeeting } = require('../utils/zoomHelpers');
const Meeting = require('../model/Meeting');

exports.startMeeting = async (req, res) => {
    const { InstructorId } = req.body; 

    // Proceed with creating the Zoom meeting
    const meetingDetails = {
        topic: 'New Meeting',
        type: 1, // Instant meeting
    };
    
    const meetingResponse = await createZoomMeeting('me', meetingDetails);
    
    if (meetingResponse) {
        const newMeeting = new Meeting({
            InstructorId, 
            zoomMeetingId: meetingResponse.id,
            topic: meetingResponse.topic,
            startUrl: meetingResponse.start_url,
            joinUrl: meetingResponse.join_url,
            password: meetingResponse.password, // Be cautious with password handling
        });
        await newMeeting.save();

        res.json({ success: true, joinUrl: newMeeting.joinUrl });
    } else {
        res.status(500).send('Failed to create meeting.');
    }
};