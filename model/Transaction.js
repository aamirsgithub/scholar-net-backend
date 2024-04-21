const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const TransactionSchema = new Schema({
  userId: { type: ObjectId, ref: "User" },
  items: [
    {
      courseId: String,
      instructorId: String,
      name: String,
      price: Number,
      quantity: { type: Number, default: 1 },
    },
  ],
  status: { type: String, default: "pending" },
  purchaseDate: {
    type: Date,
    default: Date.now,
  },
});

const Transaction = mongoose.model("Transaction", TransactionSchema);

module.exports = Transaction;
