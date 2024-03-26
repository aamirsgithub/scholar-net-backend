// const express = require("express");
// const isAuthenticated = require("../middleware/auth");
// // At the top with other imports
// const { generateSignature } = require('../utils/zoomUtils');

// // Adding a route for generating a Zoom signature
// app.post('/api/zoom/signature',isAuthenticated, (req, res) => {
//     const { meetingNumber, role } = req.body;
//     const signature = generateSignature(process.env.ZOOM_SDK_KEY, process.env.ZOOM_SDK_SECRET, meetingNumber, role.toString());
//     res.json({ signature });
// });

const express = require("express");
const router = express.Router();
const zoomController = require("../controller/zoomController");
const Meeting = require("../model/Meeting");

// Route to start a Zoom meeting
router.post("/api/zoom/start-meeting", zoomController.startMeeting);

// Route to get meeting details by courseId
router.get("/api/zoom/meeting-details/:courseId", async (req, res) => {
  const { courseId } = req.params;
  try {
    const meeting = await Meeting.findOne({ courseId: courseId });
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

module.exports = router;
