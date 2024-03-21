const express = require("express");
const router = express.Router();
const localPassport = require("./authLocal");
const googlePassport = require("./authGoogle");
const isAuthenticated = require("../middleware/auth");

// local login
router.post("/auth/local/login", (req, res, next) => {
  localPassport.authenticate("local", (err, user, info) => {
    if (err) {
      return res.status(500).json({ message: "Internal Server Error" });
    }
    if (!user) {
      return res.status(401).json({ message: info.message || "Login Failed" });
    }
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ message: "Login Session creation failed" });
      }
      return res.status(200).json({ message: "Login successful", user });
    });
  })(req, res, next);
});


// Google OAuth for login
router.get(
  "/auth/google/callback/login",
  googlePassport.authenticate("google-login", {
    scope: ["profile", "email"],
    successRedirect: "http://localhost:3000/home",
    failureRedirect: "http://localhost:3000/login-failure",
  })
);

// Google OAuth for signup
router.get(
  "/auth/google/callback/signup",
  googlePassport.authenticate("google-signup", {
    scope: ["profile", "email"],
    successRedirect: "http://localhost:3000/signup/details",
    failureRedirect: "http://localhost:3000/login",
  })
);

module.exports = router;
