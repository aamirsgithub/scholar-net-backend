const express = require("express");
const router = express.Router();
const zoomController = require("../controller/zoomController");
const Meeting = require("../model/Meeting");

// Route to start a Zoom meeting
router.post("/api/zoom/start-meeting", zoomController.startMeeting);

// Route to get meeting details by courseId
router.post("/api/zoom/meeting-details", async (req, res) => {
  const { instructorId } = req.body;
  try {
    const meeting = await Meeting.findOne({ InstructorId: instructorId });
    if (meeting) {
      res.json(meeting);
    } else {
      res.status(404).send("Meeting not found.");
    }
  } catch (error) {
    console.error("Failed to fetch meeting details:", error);
    res.status(500).send("Server error");
  }
});


// Route to fetch meeting details by instructorId, received in the request body
router.post("/api/zoom/meeting-details", async (req, res) => {
  const { instructorId } = req.body; // Ensure this matches the case used in the frontend request

  try {
    const meeting = await Meeting.findOne({ instructor: instructorId }); // Adjust this if your Meeting model's field name differs
    if (meeting) {
      // Respond with the meeting details
      res.json(meeting);
    } else {
      // If no meeting is found, send a 404 response
      res.status(404).send("Meeting not found.");
    }
  } catch (error) {
    console.error("Failed to fetch meeting details:", error);
    // Handle server errors
    res.status(500).send("Server error");
  }
});


module.exports = router;
