const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const upload = require("../middleware/multer");
const isAuthenticated = require("../middleware/auth");
const Transaction = require("../model/Transaction");
const Course = require("../model/Course");
// const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg"); // convert video to audio
ffmpeg.setFfmpegPath("C:\\FFmpeg\\bin\\ffmpeg.exe");
ffmpeg.setFfprobePath("C:\\FFmpeg\\bin\\ffprobe.exe");
const AssemblyAI = require("assemblyai").AssemblyAI; // convert audio to text
const Filter = require("bad-words"); // detects profanity/badwordss

const filter = new Filter();

function detectProfanity(text) {
  if (filter.isProfane(text)) {
    return {
      hasProfanity: true,
      filteredText: filter.clean(text),
    };
  } else {
    return {
      hasProfanity: false,
      filteredText: text,
    };
  }
}

function transcribeAudio(apiKey, fileUrl) {
  const client = new AssemblyAI({ apiKey });

  return new Promise((resolve, reject) => {
    client.transcripts
      .create({ audio_url: fileUrl })
      .then((transcript) => {
        resolve(transcript.text);
      })
      .catch((error) => {
        console.error("Error in transcription API call: ", error);
        reject(error);
      });
  });
}

function extractAndTranscribeAudio(videoPath, outputPath, apiKey) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .output(outputPath)
      .noVideo()
      .audioCodec("libmp3lame")
      .on("end", async () => {
        try {
          const transcription = await transcribeAudio(apiKey, outputPath);
          resolve({ audioPath: outputPath, transcription: transcription });
        } catch (error) {
          console.error("Error during transcription: ", error);
          reject("Error in transcription: " + error);
        }
      })
      .on("error", (err) => {
        console.error("Error extracting audio: ", err);
        reject("Error extracting audio: " + err);
      })
      .run();
  });
}

router.post("/api/extract-audio", upload.single("video"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No video file provided" });
  }

  const videoPath = req.file.path;
  const audioOutputPath = `uploads/audios/${Date.now()}-${
    req.file.filename
  }.mp3`;
  const apiKey = "5f1861647d9741b3b6f543710a071003";

  try {
    const result = await extractAndTranscribeAudio(
      videoPath,
      audioOutputPath,
      apiKey
    );
    const profanityCheck = detectProfanity(result.transcription);

    //final Response for frontend
    res.json({
      audioPath: result.audioPath,
      transcription: result.transcription,
      hasProfanity: profanityCheck.hasProfanity,
      filteredText: profanityCheck.filteredText,
    });
  } catch (error) {
    console.error("Failed operation: ", error);
    res.status(500).json({ message: error });
  }
});

router.post(
  "/api/upload-basic-course",
  isAuthenticated,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "content[0][video]", maxCount: 1 },
    { name: "content[1][video]", maxCount: 1 },
    { name: "content[2][video]", maxCount: 1 },
    { name: "content[3][video]", maxCount: 1 },
    { name: "content[4][video]", maxCount: 1 },
    { name: "content[5][video]", maxCount: 1 },
    { name: "content[6][video]", maxCount: 1 },
    { name: "content[7][video]", maxCount: 1 },
    { name: "content[8][video]", maxCount: 1 },
    { name: "content[9][video]", maxCount: 1 },
    { name: "content[10][video]", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      let content = [];
      if (typeof req.body.content === "string") {
        content = JSON.parse(req.body.content);
      } else {
        content = req.body.content;
      }

      content.forEach((item, index) => {
        const videoField = `content[${index}][video]`;
        if (req.files[videoField]) {
          const videoFile = req.files[videoField][0];
          item.video = videoFile.path;
        }
      });

      const courseData = {
        ...req.body,
        image: req.files["image"] ? req.files["image"][0].path : "",
        content: content,
        actual_price: parseFloat(req.body.actual_price),
        discounted_price: parseFloat(req.body.discounted_price),
        course_creator: req.user._id,
        instructor_name: req.user.displayName,
        instructor_email: req.user.email,
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

router.get("/api/fetch-all-courses", async (req, res) => {
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

router.get(
  "/api/fetch-single-course/:courseId",
  isAuthenticated,
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const course = await Course.findById(courseId).populate("course_creator");

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
  }
);

async function getPurchasedCourses(userId) {
  // Fetch transactions where status is 'completed'
  const transactions = await Transaction.find({ userId, status: "completed" });

  // Extract course IDs from transactions
  const courseIds = transactions.flatMap((t) =>
    t.items.map((item) => item.courseId)
  );

  // Fetch course details for the extracted IDs
  const courses = await Course.find({ _id: { $in: courseIds } }).populate(
    "course_creator",
    "displayName"
  );

  return courses.map((course) => {
    return {
      _id: course._id,
      category: course.category,
      course_name: course.course_name,
      description: course.description,
      language: course.language,
      actual_price: course.actual_price,
      discounted_price: course.discounted_price,
      what_you_will_learn: course.what_you_will_learn,
      content: course.content.map((contentItem) => {
        return {
          title: contentItem.title,
          description: contentItem.description,
          video: `http://localhost:5000/${contentItem.video.replace(
            /\\/g,
            "/"
          )}`,
          _id: contentItem._id,
        };
      }),
      image: `http://localhost:5000/${course.image.replace(/\\/g, "/")}`,
      course_creator: course.course_creator.displayName,
      instructor_name: course.instructor_name,
      instructor_email: course.instructor_email,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      __v: course.__v,
    };
  });
}

router.get(
  "/api/purchased-courses/:userId",
  isAuthenticated,
  async (req, res) => {
    try {
      const userId = req.params.userId;
      const purchasedCourses = await getPurchasedCourses(userId);
      res.json(purchasedCourses);
    } catch (error) {
      console.error("Failed to fetch purchased courses", error);
      res.status(500).send("Internal server error");
    }
  }
);

router.get(
  "/api/instructor-courses/:instructorId",
  isAuthenticated,
  async (req, res) => {
    const { instructorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      return res.status(400).json({ message: "Invalid instructor ID" });
    }

    try {
      const objectIdInstructorId = new mongoose.Types.ObjectId(instructorId);
      const courses = await Course.find({
        course_creator: objectIdInstructorId,
      }).populate("course_creator", "displayName");

      const formattedCourses = courses.map((course) => ({
        _id: course._id,
        category: course.category,
        course_name: course.course_name,
        description: course.description,
        language: course.language,
        actual_price: course.actual_price,
        discounted_price: course.discounted_price,
        what_you_will_learn: course.what_you_will_learn,
        content: course.content.map((contentItem) => ({
          title: contentItem.title,
          description: contentItem.description,
          video: contentItem.video
            ? `http://localhost:5000/${contentItem.video.replace(/\\/g, "/")}`
            : null,
          _id: contentItem._id,
        })),
        image: course.image
          ? `http://localhost:5000/${course.image.replace(/\\/g, "/")}`
          : null,
        course_creator: course.course_creator.displayName,
        instructor_name: course.instructor_name,
        instructor_email: course.instructor_email,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        __v: course.__v,
      }));

      res.json(formattedCourses);
    } catch (error) {
      console.error("Error fetching instructor's courses:", error);
      res
        .status(500)
        .json({ message: "Error fetching courses", error: error.message });
    }
  }
);

module.exports = router;
