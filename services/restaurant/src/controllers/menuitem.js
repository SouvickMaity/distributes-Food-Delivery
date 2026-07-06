import axios from "axios";
import getBuffer from "../config/datauri.js";

import Restaurant from "../models/Restaurant.js";
import MenuItems from "../models/MenuItems.js";


    export const addMenuItem = async (req, res) => {
    try {
        if (!req.user) {
        return res.status(401).json({
            message: "Please login",
        });
        }

        const restaurant = await Restaurant.findOne({ ownerId: req.user._id });

        if (!restaurant) {
        return res.status(404).json({
            message: "NO Restaurant found",
        });
        }

        const { name, description, price } = req.body;

        if (!name || !price) {
        return res.status(400).json({
            message: "Name and price are required",
        });
        }

        const file = req.file;

        if (!file) {
        return res.status(400).json({
            message: "Please give image",
        });
        }

        const fileBuffer = getBuffer(file);

        if (!fileBuffer?.content) {
        return res.status(500).json({
            message: "Failed to create file buffer",
        });
        }

        const { data: uploadResult } = await axios.post(
        `${process.env.UTILS_SERVICE}/api/upload`,
        {
            buffer: fileBuffer.content,
        }
        );

        const item = await MenuItems.create({
        name,
        description,
        price,
        restaurantId: restaurant._id,
        image: uploadResult.url,
        });

        return res.json({
        message: "Item Added Successfully",
        item,
        });
    } catch (error) {
        console.error("Add Menu Item Error:", error);

        return res.status(500).json({
        message: "Internal Server Error",
        });
    }
    };

    export const getAllItems = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
        return res.status(400).json({
            message: "Id is required",
        });
        }

        const items = await MenuItems.find({ restaurantId: id });

        return res.json(items);
    } catch (error) {
        console.error("Get All Items Error:", error);

        return res.status(500).json({
        message: "Internal Server Error",
        });
    }
    };

    export const deleteMenuItem = async (req, res) => {
    try {
        if (!req.user) {
        return res.status(401).json({
            message: "Please login",
        });
        }

        const { itemId } = req.params;

        if (!itemId) {
        return res.status(400).json({
            message: "Id is required",
        });
        }

        const item = await MenuItems.findById(itemId);

        if (!item) {
        return res.status(404).json({
            message: "No item found",
        });
        }

        const restaurant = await Restaurant.findOne({
        _id: item.restaurantId,
        ownerId: req.user._id,
        });

        if (!restaurant) {
        return res.status(404).json({
            message: "NO Restaurant found",
        });
        }

        await item.deleteOne();

        return res.json({
        message: "Menu item deleted successfully",
        });
    } catch (error) {
        console.error("Delete Menu Item Error:", error);

        return res.status(500).json({
        message: "Internal Server Error",
        });
    }
    };

    export const toggleMenuItemAvailability = async (req, res) => {
    try {
        if (!req.user) {
        return res.status(401).json({
            message: "Please login",
        });
        }

        const { itemId } = req.params;

        if (!itemId) {
        return res.status(400).json({
            message: "Id is required",
        });
        }

        const item = await MenuItems.findById(itemId);

        if (!item) {
        return res.status(404).json({
            message: "No item found",
        });
        }

        const restaurant = await Restaurant.findOne({
        _id: item.restaurantId,
        ownerId: req.user._id,
        });

        if (!restaurant) {
        return res.status(404).json({
            message: "NO Restaurant found",
        });
        }

        item.isAvailable = !item.isAvailable;
        await item.save();

        return res.json({
        message: `Item Marked as ${
            item.isAvailable ? "available" : "unavailable"
        }`,
        item,
        });
    } catch (error) {
        console.error("Toggle Menu Item Availability Error:", error);

        return res.status(500).json({
        message: "Internal Server Error",
        });
    }
    };

    
