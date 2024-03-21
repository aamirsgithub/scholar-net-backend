const express = require("express");
const isAuthenticated = require("../middleware/auth");
const userdb = require("../model/User");
const router = express.Router();
const bcrypt = require("bcryptjs");

router.post("/simple-signup", async (req, res) => {
  try {
    const { displayName, email, password, role } = req.body;

    if (!displayName || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await userdb.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const user = new userdb({ displayName, email, password, role });
    await user.save();

    res.status(201).json({ message: "Successfully registered" });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;


//sending user's data to frontend signup details page, this data is from google
router.get("/signup/details", async (req, res) => {
  try {
    if (req.isAuthenticated()) {
      const userFromGoogle = req.user;
      const userInDatabase = await userdb.findOne({
        googleId: userFromGoogle.googleId,
      });
      console.log("user from google :", userFromGoogle);
      console.log("--------------");
      console.log("user from DB :", userInDatabase);

      if (userInDatabase) {
        res.status(200).json({
          message: "You already have an account. Please login!",
          userData: userInDatabase,
        });
      } else {
        res.json(userFromGoogle);
      }
    } else {
      res.status(401).json({ message: "Not Authorized" });
    }
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//saving data in database after user click proceed button upon signup through google signup
router.post("/signup-proceed", async (req, res) => {
  try {
    if (req.isAuthenticated()) {
      const { googleId, displayName, email, image } = req.user;
      const googleUserData = {
        googleId: googleId,
        displayName: displayName,
        email: email,
        image: image,
      };

      const { username, password } = req.body;

      const existingUser = await userdb.findOne({ googleId: googleId });
      if (existingUser) {
        return res
          .status(409)
          .json({ message: "You already have an account. Please login!" });
      }
      bcrypt.hash(password, 12).then((hashedpassword) => {
        const userData = {
          ...googleUserData,
          username,
          // password,
          password: hashedpassword,
        };

        user = new userdb(userData);
        // await user.save();
        user.save();

        res.status(201).json({ message: "User successfully registered" });
      });
    } else {
      res.status(401).json({ message: "Not Authorized" });
    }
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});



module.exports = router;
