const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const purchaseSchema = new Schema({
  studentId: {
    type: ObjectId,
    ref: "User",
    required: true,
  },
  courseId: {
    type: ObjectId,
    ref: "Course",
    required: true,
  },
  purchaseDate: {
    type: Date,
    default: Date.now,
  },
});

const Purchase = mongoose.model("Purchase", purchaseSchema);

module.exports = Purchase;
