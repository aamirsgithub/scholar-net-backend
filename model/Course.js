const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const courseContentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  video: {
    type: String,
    // required: true,
  },
});

const courseSchema = new Schema(
  {
    category: String,
    course_name: String,
    description: String,
    language: String,
    actual_price: Number,
    discounted_price: Number,
    what_you_will_learn: String,
    content: [courseContentSchema],
    image: String,
    course_creator: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
