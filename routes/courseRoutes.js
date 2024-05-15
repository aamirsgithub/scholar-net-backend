const express = require("express");
const Course = require("../model/Course");
const router = express.Router();
const upload = require("../middleware/multer");
const isAuthenticated = require("../middleware/auth");
const ffmpeg = require("fluent-ffmpeg");
// const fs = require("fs");
ffmpeg.setFfmpegPath("C:\\FFmpeg\\bin\\ffmpeg.exe");
ffmpeg.setFfprobePath("C:\\FFmpeg\\bin\\ffprobe.exe");
const AssemblyAI = require("assemblyai").AssemblyAI;
const Filter = require("bad-words");

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
module.exports = router;
