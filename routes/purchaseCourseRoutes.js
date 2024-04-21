const express = require("express");
const Course = require("../model/Course");
const Transaction = require("../model/Transaction");
const Purchase = require("../model/PurchaseCourse");
const router = express.Router();
const isAuthenticated = require("../middleware/auth");
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);

router.post("/checkout-session", isAuthenticated, async (req, res) => {
  try {
    // First, check if the user has already purchased any of the courses
    const userCompletedTransactions = await Transaction.find({
      userId: req.user._id,
      status: "completed",
      "items.courseId": { $in: req.body.items.map((item) => item.courseId) },
    });

    // console.log(userCompletedTransactions)

    if (userCompletedTransactions.length > 0) {
      // Iterate over each item and check if it's already purchased
      const alreadyPurchasedCourses = [];
      userCompletedTransactions.forEach((transaction) => {
        transaction.items.forEach((item) => {
          if (
            req.body.items.some((reqItem) => reqItem.courseId === item.courseId)
          ) {
            alreadyPurchasedCourses.push(item.courseId);
          }
        });
      });

      if (alreadyPurchasedCourses.length > 0) {
        return res.status(400).json({
          error:
            "You have already purchased one or more of the selected courses.",
          courseIds: alreadyPurchasedCourses,
        });
      }
    }

    // Map through items to attach instructorId from the Courses collection
    const itemsWithInstructor = await Promise.all(
      req.body.items.map(async (item) => {
        const course = await Course.findById(item.courseId);
        if (!course) {
          throw new Error(`Course not found for ID: ${item.courseId}`);
        }
        return {
          ...item,
          instructorId: course.course_creator.toString(),
        };
      })
    );

    const transaction = new Transaction({
      userId: req.user._id,
      items: itemsWithInstructor,
      status: "pending",
    });
    await transaction.save();

    const line_items = itemsWithInstructor.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      client_reference_id: transaction._id.toString(),
      success_url: `http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:3000/cancel`,
    });

    res.status(201).json({ url: session.url });
  } catch (e) {
    console.error("Error creating checkout session:", e);
    res.status(500).json({ error: e.message });
  }
});

//when STRIPE redirect user to the payment success page, this API is called
router.get("/payment-success", isAuthenticated, async (req, res) => {
  const sessionId = req.query.session_id;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const transactionId = session.client_reference_id;

    // Retrieve the transaction from the database
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found." });
    }

    // Example logic to process the transaction
    // Update transaction status
    transaction.status = "completed";
    // console.log(" transaction:",  transaction);
    await transaction.save();

    // Further processing, such as enrolling the user in the courses
    // This part is highly specific to your application's logic

    res.json({ message: "Payment successful and courses processed." });
  } catch (error) {
    console.error("Error processing payment success:", error);
    res.status(500).send("Error processing your payment. Please try again.");
  }
});





// Endpoint to check if a course is purchased by the user
router.post('/api/check-purchase', async (req, res) => {
  const { userId, courseId } = req.body; // Data will be sent in the request body
  try {
      const transaction = await Transaction.findOne({
          userId: userId,
          "items.courseId": courseId,
          status: 'completed'
      }, 'purchaseDate items.$');

      if (transaction) {
          res.json({
              purchased: true,
              purchaseDate: transaction.purchaseDate,
              details: transaction.items.find(item => item.courseId === courseId)
          });
      } else {
          res.json({ purchased: false });
      }
  } catch (error) {
      console.error('Error checking purchase status:', error);
      res.status(500).send('Server error');
  }
});


module.exports = router;
