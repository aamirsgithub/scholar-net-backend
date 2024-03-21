const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // googleId: String,
    displayName: { type: String, required: true },
    email: { type: String, required: true },
    image: String,
    password: { type: String, required: true },
    role: { type: String, required: true },
  },
  { timestamps: true }
);

const userdb = new mongoose.model("User", userSchema);

module.exports = userdb;
