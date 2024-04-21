// models/StudentProfile.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    firstName: String,
    lastName: String,
    birthday: Date,
    gender: String,
    email: String,
    phone: String,
    // address: String,
    city: String,
    state: String,
    // zip: String,
    // courseCategory: String,
    language: String,
    image: String,
  },
  { timestamps: true }
);

const StudentProfile = mongoose.model(
  "StudentProfile",
  studentProfileSchema
);
module.exports = StudentProfile;
