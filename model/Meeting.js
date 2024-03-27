const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const meetingSchema = new Schema(
  {
    InstructorId: {
      type: ObjectId,
      required: true,
      ref: "InstructorProfile",
    },
    zoomMeetingId: String,
    topic: String,
    startUrl: String,
    joinUrl: String,
    password: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Meeting = mongoose.model("Meeting", meetingSchema);

module.exports = Meeting;
