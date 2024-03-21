const mongoose = require("mongoose");

const DB = process.env.ConnectionString;

mongoose
  .connect(DB)
  .then(() => console.log("Database Connected"))
  .catch((err) => console.log("errr", err));
