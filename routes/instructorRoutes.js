// routes/instructorRoutes.js
const express = require("express");
const router = express.Router();
const InstructorProfile = require("../model/InstructorProfile");
const upload = require("../middleware/multer");
const isAuthenticated = require("../middleware/auth");

// Route to create or update an instructor profile
router.post(
  "/api/instructor/profile",
  isAuthenticated,
  upload.single("image"),
  async (req, res) => {
    const { _id: userId } = req.user;

    console.log("Body fields:", req.body);
    console.log("File fields:", req.files);

    // const { userId } = req.user;
    const profileData = { ...req.body, user: userId };

    if (req.file) {
      profileData.image = req.file.path; // Include the path of the uploaded image
    }

    try {
      // Check if profile already exists for user
      let profile = await InstructorProfile.findOne({ user: userId });

      if (profile) {
        // Update existing profile
        profile = await InstructorProfile.findOneAndUpdate(
          { user: userId },
          { $set: profileData },
          { new: true }
        );
      } else {
        // Create new profile
        profile = new InstructorProfile(profileData);
        await profile.save();
      }

      res.status(201).json(profile);
    } catch (error) {
      console.error("Error with instructor profile:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Additional routes as needed for fetching instructor profile data

// Route to get the current instructor's profile
router.get("/api/instructor/profile", isAuthenticated, async (req, res) => {
  const { _id: userId } = req.user;

  try {
    const profile = await InstructorProfile.findOne({ user: userId }).populate(
      "user",
      "username email"
    ); // Optionally populate fields from the User model if needed

    if (!profile) {
      return res.status(404).json({ message: "Instructor profile not found" });
    }

    res.status(201).json(profile);
  } catch (error) {
    console.error("Error fetching instructor profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
