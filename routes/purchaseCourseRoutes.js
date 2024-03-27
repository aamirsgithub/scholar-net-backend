const express = require("express");
const Course = require("../model/Course");
const Purchase = require("../model/PurchaseCourse");
const router = express.Router();
const isAuthenticated = require("../middleware/auth");
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);

router.post("/checkout-session", isAuthenticated, async (req, res) => {
  try {
    const line_items = req.body.items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          // Ensure metadata includes courseId for each item
          metadata: {
            courseId: item.courseId, // Assuming each item includes a courseId
          },
        },
        unit_amount: item.price * 100,
      },
      quantity: item.quantity || 1,
    }));

    // Creating the Stripe checkout session with the line items
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: line_items,
      success_url: `http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:3000/cancel`,
      // Optionally, you can include metadata at the session level if needed
    });

    // Respond with the URL to the Stripe checkout session
    res.json({ url: session.url });
  } catch (e) {
    console.error("Error creating checkout session:", e);
    res.status(500).json({ error: e.message });
  }
});

router.get("/payment-success", isAuthenticated, async (req, res) => {
  const sessionId = req.query.session_id;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
      limit: 100,
    });

    for (const item of lineItems.data) {
      const metadata = item.price.product.metadata;

      if (metadata && metadata.courseId) {
        // Assuming req.user._id is the authenticated student's ID
        const newPurchase = new Purchase({
          courseId: mongoose.Types.ObjectId(metadata.courseId), // Ensure the courseId is correctly formatted as ObjectId
          studentId: req.user._id,
        });
        await newPurchase.save();
      }
    }

    res.json({ message: "Success" });
  } catch (error) {
    console.error("Error processing payment success:", error);
    res.status(500).send("Error processing your payment. Please try again.");
  }
});

// const express = require("express");
// const Course = require("../model/Course");
// const Purchase = require("../model/PurchaseCourse");
// const router = express.Router();
// const isAuthenticated = require("../middleware/auth");
// const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);

// router.post("/checkout-session", isAuthenticated, async (req, res) => {
//   try {

//     const line_items = req.body.items.map((item) => ({
//       price_data: {
//         currency: "usd",
//         product_data: {
//           name: item.name,
//           metadata: {
//             courseId: item.courseId,
//             instructorId: item.instructorId
//           },
//         },
//         unit_amount: item.price * 100,
//       },
//       quantity: 1,
//     }));

//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ["card"],
//       mode: "payment",
//       line_items: line_items,
//       success_url: `http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `http://localhost:3000/cancel`,
//     });

//     res.json({ url: session.url });
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// });

// router.get("/payment-success", isAuthenticated, async (req, res) => {
//   const sessionId = req.query.session_id;
//   console.log("Session ID:", sessionId);
//   try {
//     const session = await stripe.checkout.sessions.retrieve(sessionId);
//     console.log("Stripe Session:", session); // Check session retrieval
//     const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100 });
//     console.log("Line Items:", lineItems.data); // Inspect line items

//     for (const item of lineItems.data) {
//       console.log("Processing item:", item); // Inspect each item
//       const metadata = item.price.product.metadata; // Adjust based on actual structure
//       console.log("Metadata:", metadata); // Confirm metadata access
//       // Process each item...
//     }

//     res.json({ message: "Success" });
//   } catch (error) {
//     console.error("Error processing payment success:", error);
//     res.status(500).send("Error processing your payment. Please try again.");
//   }
// });

module.exports = router;
