const isAuthenticated = (req, res, next) => {
  console.log("req.isAuthenticated in auth.js  : ", req.isAuthenticated());
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
};

module.exports = isAuthenticated;
