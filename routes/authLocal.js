const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const userdb = require("../model/User");


passport.use(
  "local",
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await userdb.findOne({ email: username });

      if (!user) {
        return done(null, false, { message: "User Not Found." });
      }

      if (password === user.password) {
        return done(null, user, { message: "Login successful" });
      } else {
        return done(null, false, { message: "Invalid Email or password" });
      }
    } catch (error) {
      return done(error);
    }
  })
);

module.exports = passport;

