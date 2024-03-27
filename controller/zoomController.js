require("dotenv").config();
const { createZoomMeeting } = require("../utils/zoomHelpers");
const Meeting = require("../model/Meeting");

exports.startMeeting = async (req, res) => {
  const { InstructorId } = req.body;

  // Proceed with creating the Zoom meeting
  const meetingDetails = {
    topic: "New Meeting",
    type: 1, // Instant meeting
  };

  const meetingResponse = await createZoomMeeting("me", meetingDetails);

  if (meetingResponse) {
    // Attempt to find and update the meeting, or create a new one if it doesn't exist
    const updatedMeeting = await Meeting.findOneAndUpdate(
      { InstructorId: InstructorId }, // Find a document with this InstructorId
      {
        zoomMeetingId: meetingResponse.id,
        topic: meetingResponse.topic,
        startUrl: meetingResponse.start_url,
        joinUrl: meetingResponse.join_url,
        password: meetingResponse.password, // Be cautious with password handling
        createdAt: Date.now(), // Optionally update the createdAt to current time if necessary
      },
      {
        new: true, // Return the updated document
        upsert: true, // Create a new document if one doesn't exist
        runValidators: true, // Ensure the update obeys the schema
        setDefaultsOnInsert: true, // If creating a new one, apply default schema values
      }
    );

    res.json({ success: true, joinUrl: updatedMeeting.joinUrl });
  } else {
    res.status(500).send("Failed to create meeting.");
  }
};

// require('dotenv').config();
// const { createZoomMeeting } = require('../utils/zoomHelpers');
// const Meeting = require('../model/Meeting');

// exports.startMeeting = async (req, res) => {
//     const { InstructorId } = req.body;

//     // Proceed with creating the Zoom meeting
//     const meetingDetails = {
//         topic: 'New Meeting',
//         type: 1, // Instant meeting
//     };

//     const meetingResponse = await createZoomMeeting('me', meetingDetails);

//     if (meetingResponse) {
//         const newMeeting = new Meeting({
//             InstructorId,
//             zoomMeetingId: meetingResponse.id,
//             topic: meetingResponse.topic,
//             startUrl: meetingResponse.start_url,
//             joinUrl: meetingResponse.join_url,
//             password: meetingResponse.password, // Be cautious with password handling
//         });
//         await newMeeting.save();

//         res.json({ success: true, joinUrl: newMeeting.joinUrl });
//     } else {
//         res.status(500).send('Failed to create meeting.');
//     }
// };
