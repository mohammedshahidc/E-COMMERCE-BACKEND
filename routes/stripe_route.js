const express = require("express");
const Stripe = require("stripe");
const Order = require("../model/order_schem");
const route = express.Router();

const handleStripeWebhook = async (req, res) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers["stripe-signature"];
    try {
        const event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        // Handle the event
        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            // Find the order associated with this session
            const order = await Order.findOne({ sessionId: session.id });
            if (order) {
                order.status = "completed";
                await order.save();
            }
            res.status(200).send("Webhook received");
        } else {
            // Handle other event types if necessary
            res.status(200).send("Event type not handled");
        }
    } catch (error) {
        console.error(`Webhook Error: ${error.message}`);
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
};

route.post(
    "/webhook",
    express.raw({ type: "application/json" }), // Fixed content type
    handleStripeWebhook // Use the handler function
);

export default route;
