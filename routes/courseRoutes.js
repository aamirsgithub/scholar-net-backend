const express = require("express");
const Course = require("../model/Course");
const router = express.Router();
const upload = require("../middleware/multer");
const isAuthenticated = require("../middleware/auth");

router.post(
  "/api/upload-basic-course",
  isAuthenticated,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "content[0][video]", maxCount: 1 },
    { name: "content[1][video]", maxCount: 1 },
    // { name: "content[2][video]", maxCount: 1 },
    // { name: "content[3][video]", maxCount: 1 },
    // { name: "content[4][video]", maxCount: 1 },
    // { name: "content[5][video]", maxCount: 1 },
    // { name: "content[6][video]", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log(
        "Content type console log",
        typeof req.body.content,
        req.body.content
      );
      let content = [];
      if (typeof req.body.content === "string") {
        content = JSON.parse(req.body.content);
      } else {
        content = req.body.content;
      }

      content.forEach((item, index) => {
        // Attempt to assign video paths to corresponding content items
        const videoField = `content[${index}][video]`;
        if (req.files[videoField]) {
          const videoFile = req.files[videoField][0]; // Assuming maxCount is 1
          item.video = videoFile.path; // Add video path to content item
        }
      });

      const courseData = {
        ...req.body,
        image: req.files["image"] ? req.files["image"][0].path : "",
        content: content,
        actual_price: parseFloat(req.body.actual_price),
        discounted_price: parseFloat(req.body.discounted_price),
        course_creator: req.user._id,
      };

      // Create and save the course instance
      const course = new Course(courseData);
      await course.save();

      res.status(201).json(course);
    } catch (error) {
      console.error("Error saving course:", error);
      res
        .status(400)
        .json({ message: "Error saving course", error: error.message });
    }
  }
);

router.get("/api/fetch-all-courses", isAuthenticated, async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res
      .status(500)
      .json({ message: "Error fetching courses", error: error.message });
  }
});

router.get("/api/fetch-single-course/:courseId", isAuthenticated, async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json(course);
  } catch (error) {
    console.error("Error fetching course by ID:", error);
    res
      .status(500)
      .json({ message: "Error fetching course", error: error.message });
  }
});

module.exports = router;
