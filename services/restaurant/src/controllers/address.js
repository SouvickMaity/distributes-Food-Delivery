import mongoose from "mongoose";

import Address from "../models/Address.js";


    export const addAddress = async (req, res) => {
    try {
        const user = req.user;

        if (!user) {
        return res.status(401).json({
            message: "Unauthorized",
        });
        }

        const { mobile, formattedAddress, latitude, longitude } = req.body;

        if (
        !mobile ||
        !formattedAddress ||
        latitude === undefined ||
        longitude === undefined
        ) {
        return res.status(400).json({
            message: "Please give all fields",
        });
        }

        const newAddress = await Address.create({
        userId: user._id.toString(),
        mobile,
        formattedAddress,
        location: {
            type: "Point",
            coordinates: [Number(longitude), Number(latitude)],
        },
        });

        return res.json({
        message: "Address Added successfully",
        address: newAddress,
        });
    } catch (error) {
        console.error("Add Address Error:", error);

        return res.status(500).json({
        message: "Internal Server Error",
        });
    }
    };

    export const deleteAddress = async (req, res) => {
    try {
        const user = req.user;

        if (!user) {
        return res.status(401).json({
            message: "Unauthorized",
        });
        }

        const { id } = req.params;

        if (!id) {
        return res.status(400).json({
            message: "id is required",
        });
        }

        const address = await Address.findOne({
        _id: id,
        userId: user._id.toString(),
        });

        if (!address) {
        return res.status(404).json({
            message: "Address not found",
        });
        }

        await address.deleteOne();

        return res.json({
        message: "Address deleted Successfully",
        });
    } catch (error) {
        console.error("Delete Address Error:", error);

        return res.status(500).json({
        message: "Internal Server Error",
        });
    }
    };

    export const getMyAddresses = async (req, res) => {
    try {
        const user = req.user;

        if (!user) {
        return res.status(401).json({
            message: "Unauthorized",
        });
        }

        const addresses = await Address.find({
        userId: user._id.toString(),
        }).sort({ createdAt: -1 });

        return res.json(addresses);
    } catch (error) {
        console.error("Get My Addresses Error:", error);

        return res.status(500).json({
        message: "Internal Server Error",
        });
    }
    };

