require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const app = express();
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
require("./database/connection");
const User = require("./model/User");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const courseRoutes = require("./routes/courseRoutes");
const zoomRoutes = require("./routes/zoomRoutes");
const instructorRoutes = require("./routes/instructorRoutes");
const purchaseCourseRoutes = require("./routes/purchaseCourseRoutes");
const MongoStore = require("connect-mongo");
const PORT = process.env.PORT;

app.use("/uploads", express.static("uploads"));
app.use(express.static('public'));


app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);

// setup session
app.use(
  session({
    secret: process.env.SecretSessionKey,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: process.env.ConnectionString }),
    cookie: {
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// setup passport
app.use(passport.initialize());
app.use(passport.session());

// use routers
app.use(authRoutes);
app.use(userRoutes);
app.use(postRoutes);
app.use(courseRoutes);
app.use(zoomRoutes);
app.use(instructorRoutes);
app.use(purchaseCourseRoutes);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
