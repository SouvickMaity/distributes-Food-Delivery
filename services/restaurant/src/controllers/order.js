import axios from "axios";

import Address from "../models/Address.js";
import Cart from "../models/Cart.js";

import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import { publishEvent } from "../config/order.publisher.js";



    export const createOrder = async (req, res) => {
    try {
    const user = req.user;

    if (!user) {
        return res.status(401).json({
        message: "Unauthorized",
        });
    }

    const { paymentMethod, addressId } = req.body;

    if (!addressId) {
        return res.status(400).json({
        message: "Address is required",
        });
    }

    const address = await Address.findOne({
        _id: addressId,
        userId: user._id,
    });

    if (!address) {
        return res.status(404).json({
        message: "Address Not found",
        });
    }

    const getDistanceKm = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;

        const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return +(R * c).toFixed(2);
    };

    const cartItems = await Cart.find({ userId: user._id })
        .populate("itemId")
        .populate("restaurantId");

    if (cartItems.length === 0) {
        return res.status(400).json({
        message: "Cart is empty",
        });
    }

    const firstCartItem = cartItems[0];

    if (!firstCartItem || !firstCartItem.restaurantId) {
        return res.status(400).json({
        message: "Invalid Cart Data",
        });
    }

    const restaurantId = firstCartItem.restaurantId._id;

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
        return res.status(404).json({
        message: "No restaurant with this id",
        });
    }

    if (!restaurant.isOpen) {
        return res.status(404).json({
        message: "Sorry this restaurant is closed for now",
        });
    }

    const distance = getDistanceKm(
        address.location.coordinates[1],
        address.location.coordinates[0],
        restaurant.autoLocation.coordinates[1],
        restaurant.autoLocation.coordinates[0]
    );

    let subtotal = 0;

    const orderItems = cartItems.map((cart) => {
        const item = cart.itemId;

        if (!item) {
        throw new Error("Invalid cart item");
        }

        const itemTotal = item.price * cart.quauntity;

        subtotal += itemTotal;

        return {
        itemId: item._id.toString(),
        name: item.name,
        price: item.price,
        quauntity: cart.quauntity,
        };
    });

    const deliveryFee = subtotal < 250 ? 49 : 0;
    const platfromFee = 7;
    const totalAmount = subtotal + deliveryFee + platfromFee;

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const [longitude, latitude] = address.location.coordinates;

    const riderAmount = Math.ceil(distance) * 17;

    const order = await Order.create({
        userId: user._id.toString(),
        restaurantId: restaurantId.toString(),
        restaurantName: restaurant.name,
        riderId: null,
        distance,
        riderAmount,
        items: orderItems,
        subtotal,
        deliveryFee,
        platfromFee,
        totalAmount,
        addressId: address._id.toString(),
        deliveryAddress: {
        fromattedAddress: address.formattedAddress,
        mobile: address.mobile,
        latitude,
        longitude,
        },
        paymentMethod,
        paymentStatus: "pending",
        status: "placed",
        expiresAt,
    });

    await Cart.deleteMany({
        userId: user._id,
    });

    return res.json({
        message: "Order created successfully",
        orderId: order._id.toString(),
        amount: totalAmount,
    });
    } catch (error) {
    console.error("Create Order Error:", error);

    return res.status(500).json({
        message: "Internal Server Error",
    });
    }
    };


        export const fetchOrderForPayment = async (req, res) => {
    try {
        if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
        return res.status(403).json({
            message: "Forbidden",
        });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
        return res.status(404).json({
            message: "Order not found",
        });
        }

        if (order.paymentStatus !== "pending") {
        return res.status(400).json({
            message: "Order already paid",
        });
        }

        return res.json({
        orderId: order._id,
        amount: order.totalAmount,
        currency: "INR",
        });
    } catch (error) {
        console.error("Fetch Order For Payment Error:", error);

        return res.status(500).json({
        message: "Internal Server Error",
        });
    }
    };


    export const fetchRestaurantOrders = async (req, res) => {
    try {
        const user = req.user;
        const { restaurantId } = req.params;

        if (!user) {
        return res.status(401).json({
            message: "Unauthorized",
        });
        }

        if (!restaurantId) {
        return res.status(400).json({
            message: "Restaurant id is required",
        });
        }

        const limit = req.query.limit ? Number(req.query.limit) : 0;

        const orders = await Order.find({
        restaurantId,
        paymentStatus: "paid",
        })
        .sort({ createdAt: -1 })
        .limit(limit);

        return res.json({
        success: true,
        count: orders.length,
        orders,
        });
    } catch (error) {
        console.error("Fetch Restaurant Orders Error:", error);

        return res.status(500).json({
        message: "Internal Server Error",
        });
    }
    };

    const ALLOWED_STATUSES = ["accepted", "preparing", "ready_for_rider"];

    export const updateOrderStatus = async (req, res) => {
    try {
        const user = req.user;

        const { orderId } = req.params;
        const { status } = req.body;

        if (!user) {
        return res.status(401).json({
            message: "Unauthorized",
        });
        }

        if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({
            message: "Invalid order status",
        });
        }

        const order = await Order.findById(orderId);

        if (!order) {
        return res.status(404).json({
            message: "Order not found",
        });
        }

        if (order.paymentStatus !== "paid") {
        return res.status(404).json({
            message: "Order not completed",
        });
        }

        const restaurant = await Restaurant.findById(order.restaurantId);

        if (!restaurant) {
        return res.status(404).json({
            message: "Restaurant not found",
        });
        }

        if (restaurant.ownerId !== user._id.toString()) {
        return res.status(401).json({
            message: "You are not allowed to update this order",
        });
        }

        order.status = status;

        await order.save();

        await axios.post(
        `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
        {
            event: "order:update",
            room: `user:${order.userId}`,
            payload: {
            orderId: order._id,
            status: order.status,
            },
        },
        {
            headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
            },
        }
        );

        // Now assign riders
        if (status === "ready_for_rider") {
        console.log(
            "Publishing Order ready for rider event for order",
            order._id
        );

        await publishEvent("ORDER_READY_FOR_RIDER", {
            orderId: order._id.toString(),
            restaurantId: restaurant._id.toString(),
            location: restaurant.autoLocation,
        });

        console.log("Event Published successfully");
        }

        return res.json({
        message: "Order status updated successfully",
        order,
        });
    } catch (error) {
        console.error("Update Order Status Error:", error);

        return res.status(500).json({
        message: "Internal Server Error",
        });
    }
    };


    export const getMyOrders = async (req, res) => {
    try {
        if (!req.user) {
        return res.status(401).json({
            message: "Unauthorized",
        });
        }

        const orders = await Order.find({
        userId: req.user._id.toString(),
        paymentStatus: "paid",
        }).sort({ createdAt: -1 });

        return res.json({ orders });
    } catch (error) {
        console.error("Get My Orders Error:", error);

        return res.status(500).json({
        message: "Internal Server Error",
        });
    }
    };

    export const fetchSingleOrder = async (req, res) => {
    try {
        if (!req.user) {
        return res.status(401).json({
            message: "Unauthorized",
        });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
        return res.status(404).json({
            message: "Order not found",
        });
        }

        if (order.userId !== req.user._id.toString()) {
        return res.status(401).json({
            message: "You are not allowed to view this order",
        });
        }

        return res.json(order);
    } catch (error) {
        console.error("Fetch Single Order Error:", error);

        return res.status(500).json({
        message: "Internal Server Error",
        });
    }
    };


    export const assignRiderToOrder = async (req, res) => {
    try {
        if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
        return res.status(403).json({
            message: "Forbidden",
        });
        }

        const { orderId, riderId, riderName, riderPhone } = req.body;

        const orderAvailable = await Order.findOne({
        riderId,
        status: { $ne: "delivered" },
        });

        if (orderAvailable) {
        return res.status(400).json({
            message: "You already have an order",
        });
        }

        const order = await Order.findById(orderId);

        if (!order) {
        return res.status(404).json({
            message: "Order not found",
        });
        }

        if (order.riderId !== null) {
        return res.status(400).json({
            message: "Order already taken",
        });
        }

        const orderUpdated = await Order.findOneAndUpdate(
        { _id: orderId, riderId: null },
        {
            riderId,
            riderName,
            riderPhone,
            status: "rider_assigned",
        },
        { new: true }
        );

        await axios.post(
        `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
        {
            event: "order:rider_assigned",
            room: `user:${order.userId}`,
            payload: order,
        },
        {
            headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
            },
        }
        );

        await axios.post(
        `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
        {
            event: "order:rider_assigned",
            room: `restaurant:${order.restaurantId}`,
            payload: order,
        },
        {
            headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
            },
        }
        );

        return res.json({
        message: "Rider Assigned Successfully",
        success: true,
        order: orderUpdated,
        });
    } catch (error) {
        console.error("Assign Rider To Order Error:", error);

        return res.status(500).json({
        message: "Internal Server Error",
        });
    }
    };


    export const getCurrentOrderForRider = async (req, res) => {
    try {
        if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
        return res.status(403).json({
            message: "Forbidden",
        });
        }

        const { riderId } = req.query;

        if (!riderId) {
        return res.status(400).json({
            message: "Rider id is required",
        });
        }

        const order = await Order.findOne({
        riderId,
        status: { $ne: "delivered" },
        }).populate("restaurantId");

        if (!order) {
        return res.status(404).json({
            message: "Order not found",
        });
        }

        return res.json(order);
    } catch (error) {
        console.error("Get Current Order For Rider Error:", error);

        return res.status(500).json({
        message: "Internal Server Error",
        });
    }
    };



    export const updateOrderStatusRider = async (req, res) => {
    try {
        if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
        return res.status(403).json({
            message: "Forbidden",
        });
        }

        const { orderId } = req.body;

        const order = await Order.findById(orderId);

        if (!order) {
        return res.status(404).json({
            message: "Order not found",
        });
        }

        if (order.status === "rider_assigned") {
        order.status = "picked_up";

        await order.save();

        await axios.post(
            `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
            {
            event: "order:rider_assigned",
            room: `restaurant:${order.restaurantId}`,
            payload: order,
            },
            {
            headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
            },
            }
        );

        await axios.post(
            `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
            {
            event: "order:rider_assigned",
            room: `user:${order.userId}`,
            payload: order,
            },
            {
            headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
            },
            }
        );

        return res.json({
            message: "Order updated Successfully",
        });
        }

        if (order.status === "picked_up") {
        order.status = "delivered";

        await order.save();

        await axios.post(
            `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
            {
            event: "order:rider_assigned",
            room: `restaurant:${order.restaurantId}`,
            payload: order,
            },
            {
            headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
            },
            }
        );

        await axios.post(
            `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
            {
            event: "order:rider_assigned",
            room: `user:${order.userId}`,
            payload: order,
            },
            {
            headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
            },
            }
        );

        return res.json({
            message: "Order updated Successfully",
        });
        }

        return res.status(400).json({
        message: "Invalid order status",
        });
    } catch (error) {
        console.error("Update Order Status Rider Error:", error);

        return res.status(500).json({
        message: "Internal Server Error",
        });
    }
    };


    





