const express = require("express");
const router = express.Router();
const cloudinary = require("../utils/cloudinary");
const upload = require("../middleware/multer");
const Post = require("../model/postSchema");
const isAuthenticated = require("../middleware/auth");

// creating posts
router.post("/api/createpost", upload.single("file"), async (req, res) => {
  try {
    if (req.isAuthenticated()) {
      const { caption } = req.body;

      cloudinary.uploader.upload(req.file.path, async function (err, result) {
        if (err) {
          console.log(err);
          return res.status(500).json({
            success: false,
            message: "Error",
          });
        }

        try {
          const newPost = new Post({
            caption,
            imageUrl: result.secure_url,
            postedBy: req.user,
          });

          const savedPost = await newPost.save();
          // res.status(201).json(savedPost, { message: "Posted Successfully" });
          res
            .status(201)
            .json({
              success: true,
              message: "Posted Successfully",
              data: savedPost,
            });
        } catch (error) {
          console.error(error);
          res.status(500).json({ message: "Internal Server Error" });
        }
      });
    } else {
      res.status(401).json({ message: "Not Authorized" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Fetching Posts from DB
router.get("/api/posts", (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      Post.find()
        .populate("postedBy", "_id username image")
        .sort("-createdAt")
        .then((posts) => {
          // res.json({ posts });
          res.status(200).json({ posts });
        })
        .catch((err) => {
          console.log(err);
          res.status(500).json({ message: "Internal Server Error" });
        });
    } else {
      res.status(401).json({ message: "Not Authorized" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//liking post
router.put("/api/like", isAuthenticated, async (req, res) => {
  try {
    const result = await Post.findByIdAndUpdate(
      req.body.postId,
      {
        $push: { likes: req.user._id },
      },
      {
        new: true,
      }
    ).exec();

    res.status(200).json(result);
  } catch (err) {
    res.status(422).json({ error: err.message });
  }
});

//unliking post
router.put("/api/unlike", isAuthenticated, async (req, res) => {
  try {
    const result = await Post.findByIdAndUpdate(
      req.body.postId,
      {
        $pull: { likes: req.user._id },
      },
      {
        new: true,
      }
    ).exec();

    res.status(200).json(result);
  } catch (err) {
    res.status(422).json({ error: err.message });
  }
});

// Check like status
router.get("/api/checkLike/:postId", isAuthenticated, async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user._id;

    const post = await Post.findById(postId).exec();

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const isLiked = post.likes.includes(userId);

    // res.json({ isLiked });
    res.status(200).json({ isLiked });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//comments
router.put("/api/comment", isAuthenticated, async (req, res) => {
  try {
    const comment = {
      comment: req.body.comment,
      postedBy: req.user._id,
    };

    const result = await Post.findByIdAndUpdate(
      req.body.postId,
      {
        $push: { comments: comment },
      },
      {
        new: true,
      }
    )
      .populate("comments.postedBy", "_id username")
      .populate("postedBy", "_id username")
      .exec();

    // res.json(result);
    res.status(200).json(result);
  } catch (err) {
    res.status(422).json({ error: err.message });
  }
});

//fetching comments
router.get("/api/getComment", async (req, res) => {
  const postId = req.query.post_id;

  try {
    const post = await Post.findById(postId)
      .populate("comments.postedBy", "_id username")
      .exec();

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const comments = post.comments;
    // res.json(comments);
    res.status(200).json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
