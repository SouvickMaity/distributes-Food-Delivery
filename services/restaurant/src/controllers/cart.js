import mongoose from "mongoose";

import Cart from "../models/Cart.js";

    export const addToCart = async (req, res) => {
    try {
        if (!req.user) {
        return res.status(401).json({
            message: "Please Login",
        });
        }

        const userId = req.user._id;

        const { restaurantId, itemId } = req.body;

        if (
        !mongoose.Types.ObjectId.isValid(restaurantId) ||
        !mongoose.Types.ObjectId.isValid(itemId)
        ) {
        return res.status(400).json({
            message: "Invalid restaurant and item id",
        });
        }

        const cartFromDifferentRestaurant = await Cart.findOne({
        userId,
        restaurantId: { $ne: restaurantId },
        });

        if (cartFromDifferentRestaurant) {
        return res.status(400).json({
            message:
            "You can order from only one restaurant at a time. Please clear your cart first to add items from this restaurant.",
        });
        }

        const cartItem = await Cart.findOneAndUpdate(
        { userId, restaurantId, itemId },
        {
            $inc: { quauntity: 1 },
            $setOnInsert: { userId, restaurantId, itemId },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return res.json({
        message: "Item added to cart",
        cart: cartItem,
        });
    } catch (error) {
        console.error("Add To Cart Error:", error);

        return res.status(500).json({
        message: "Internal Server Error",
        });
    }
    };


    export const fetchMyCart = async (req, res) => {
    try {
        if (!req.user) {
        return res.status(401).json({
            message: "Please Login",
        });
        }

        const userId = req.user._id;

        const cartItems = await Cart.find({ userId })
        .populate("itemId")
        .populate("restaurantId");

        let subtotal = 0;
        let cartLength = 0;

        for (const cartItem of cartItems) {
        const item = cartItem.itemId;

        subtotal += item.price * cartItem.quauntity;
        cartLength += cartItem.quauntity;
        }

        return res.json({
        success: true,
        cartLength,
        subtotal,
        cart: cartItems,
        });
    } catch (error) {
        console.error("Fetch My Cart Error:", error);

        return res.status(500).json({
        message: "Internal Server Error",
        });
    }
    };


    export const incrementCartItem = async (req, res) => {
    try {
        const userId = req.user?._id;

        const { itemId } = req.body;

        if (!userId || !itemId) {
        return res.status(400).json({
            message: "Invalid request",
        });
        }

        const cartItem = await Cart.findOneAndUpdate(
        { userId, itemId },
        { $inc: { quauntity: 1 } },
        { new: true }
        );

        if (!cartItem) {
        return res.status(404).json({
            message: "Item not found",
        });
        }

        return res.json({
        message: "Quantity increased",
        cartItem,
        });
    } catch (error) {
        console.error("Increment Cart Item Error:", error);

        return res.status(500).json({
        message: "Internal Server Error",
        });
    }
    };


    export const decrementCartItem = async (req, res) => {
    try {
        const userId = req.user?._id;

        const { itemId } = req.body;

        if (!userId || !itemId) {
        return res.status(400).json({
            message: "Invalid request",
        });
        }

        const cartItem = await Cart.findOne({ userId, itemId });

        if (!cartItem) {
        return res.status(404).json({
            message: "Item not found",
        });
        }

        if (cartItem.quauntity === 1) {
        await Cart.deleteOne({ userId, itemId });

        return res.json({
            message: "Item removed from cart",
        });
        }

        cartItem.quauntity -= 1;
        await cartItem.save();

        return res.json({
        message: "Quantity decreased",
        cartItem,
        });
    } catch (error) {
        console.error("Decrement Cart Item Error:", error);

        return res.status(500).json({
        message: "Internal Server Error",
        });
    }
    };


    export const clearCart = async (req, res) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
        return res.status(401).json({
            message: "Unauthorized",
        });
        }

        await Cart.deleteMany({ userId });

        return res.json({
        message: "Cart cleared successfully",
        });
    } catch (error) {
        console.error("Clear Cart Error:", error);

        return res.status(500).json({
        message: "Internal Server Error",
        });
    }
    };

    