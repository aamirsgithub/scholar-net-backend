const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;
const User = require("./User");

const postSchema = new mongoose.Schema(
  {
    caption: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    likes: [{ type: ObjectId, ref: "User" }],
    comments: [
      {
        comment: String,
        postedBy: { type: ObjectId, ref: "User" },
      },
    ],
    postedBy: {
      type: ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const Post = new mongoose.model("Post", postSchema);

module.exports = Post;
