import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import Stripe from "stripe";
import { publishPaymentSuccess } from "../config/payment.producer.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const payWithStripe = async (req, res) => {
  try {
    const { orderId } = req.body;

    const { data } = await axios.get(
      `${process.env.RESTAURANT_SERVICE}/api/order/payment/${orderId}`,
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
      }
    );

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: "Tomato Food Order",
            },
            unit_amount: data.amount * 100,
          },
          quantity: 1,
        },
      ],

      metadata: {
        orderId,
      },

      success_url: `${process.env.FRONTEND_URL}/ordersuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout`,
    });

    return res.json({
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe Payment Error:", error);

    return res.status(500).json({
      message: "Stripe payment failed",
    });
  }
};

export const verifyStripe = async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return res.status(400).json({
        message: "Payment verification failed",
      });
    }

    const orderId = session.metadata?.orderId;

    if (!orderId) {
      return res.status(400).json({
        message: "Order ID not found in Stripe session",
      });
    }

    await publishPaymentSuccess({
      orderId,
      paymentId: sessionId,
      provider: "stripe",
    });

    return res.json({
      message: "Payment verified successfully",
    });
  } catch (error) {
    console.error("Stripe Verification Error:", error);

    return res.status(500).json({
      message: "Stripe payment verification failed",
    });
  }
};

