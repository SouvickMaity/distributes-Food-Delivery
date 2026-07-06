import axios from "axios";
import getBuffer from "../config/datauri.js";
import { Rider } from "../model/Rider.js";

export const addRiderProfile = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (user.role !== "rider") {
      return res.status(403).json({
        message: "Only riders can create rider profile",
      });
    }

    const file = req.file;

    if (!file) {
      return res.status(400).json({
        message: "Rider Image is required",
      });
    }

    const fileBuffer = getBuffer(file);

    if (!fileBuffer?.content) {
      return res.status(500).json({
        message: "Failed to generate image buffer",
      });
    }

    const { data: uploadResult } = await axios.post(
      `${process.env.UTILS_SERVICE}/api/upload`,
      {
        buffer: fileBuffer.content,
      }
    );

    const {
      phoneNumber,
      aadharNumber,
      drivingLicenseNumber,
      latitude,
      longitude,
    } = req.body;

    if (
      !phoneNumber ||
      !aadharNumber ||
      !drivingLicenseNumber ||
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const existingProfile = await Rider.findOne({
      userId: user._id,
    });

    if (existingProfile) {
      return res.status(400).json({
        message: "Rider profile already exists",
      });
    }

    const riderProfile = await Rider.create({
      userId: user._id,
      picture: uploadResult.url,
      phoneNumber,
      aadharNumber,
      drivingLicenseNumber,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      isAvailble: false,
      isVerified: false,
    });

    return res.status(201).json({
      message: "Rider profile created successfully",
      riderProfile,
    });
  } catch (error) {
    console.error("Add Rider Profile Error:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const fetchMyProfile = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const account = await Rider.findOne({
      userId: user._id,
    });

    return res.json(account);
  } catch (error) {
    console.error("Fetch My Profile Error:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};



export const toggleRiderAvailablity = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (user.role !== "rider") {
      return res.status(403).json({
        message: "Only riders can create rider profile",
      });
    }

    const { isAvailble, latitude, longitude } = req.body;

    if (typeof isAvailble !== "boolean") {
      return res.status(400).json({
        message: "isAvailble must be boolean",
      });
    }

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        message: "Location is required",
      });
    }

    const rider = await Rider.findOne({
      userId: user._id,
    });

    if (!rider) {
      return res.status(404).json({
        message: "Rider profile not found",
      });
    }

    if (isAvailble && !rider.isVerified) {
      return res.status(403).json({
        message: "Rider is not verified",
      });
    }

    rider.isAvailble = isAvailble;

    rider.location = {
      type: "Point",
      coordinates: [longitude, latitude],
    };

    rider.lastActiveAt = new Date();

    await rider.save();

    return res.json({
      message: isAvailble
        ? "Rider is now online"
        : "Rider is now offline",
      rider,
    });
  } catch (error) {
    console.error("Toggle Rider Availability Error:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};



export const acceptOrder = async (req, res) => {
  try {
    const riderUserId = req.user?._id;
    const { orderId } = req.params;

    if (!riderUserId) {
      return res.status(400).json({
        message: "Please Login",
      });
    }

    const rider = await Rider.findOne({
      userId: riderUserId,
      isAvailble: true,
    });

    if (!rider) {
      return res.status(404).json({
        message: "Rider not found",
      });
    }

    try {
      const { data } = await axios.put(
        `${process.env.RESTAURANT_SERVICE}/api/order/assign/rider`,
        {
          orderId,
          riderId: rider._id.toString(),
          riderUserId: rider.userId,
          riderName: rider.picture,
          riderPhone: rider.phoneNumber,
        },
        {
          headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
          },
        }
      );

      if (data.success) {
        await Rider.findOneAndUpdate(
          {
            userId: riderUserId,
            isAvailble: true,
          },
          {
            isAvailble: false,
          },
          {
            new: true,
          }
        );

        return res.json({
          message: "Order accepted",
        });
      }

      return res.status(400).json({
        message: "Failed to accept order",
      });
    } catch (error) {
      return res.status(400).json({
        message: "Order already taken",
      });
    }
  } catch (error) {
    console.error("Accept Order Error:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};


export const fetchMyCurrentOrder = async (req, res) => {
  try {
    const riderUserId = req.user?._id;

    if (!riderUserId) {
      return res.status(400).json({
        message: "Please Login",
      });
    }

    const rider = await Rider.findOne({
      userId: riderUserId,
      isVerified: true,
    });

    if (!rider) {
      return res.status(404).json({
        message: "Rider not found",
      });
    }

    try {
      const { data } = await axios.get(
        `${process.env.RESTAURANT_SERVICE}/api/order/current/rider?riderId=${rider._id}`,
        {
          headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
          },
        }
      );

      return res.json({
        order: data,
      });
    } catch (error) {
      return res.status(500).json({
        message: error.response?.data?.message || "Failed to fetch current order",
      });
    }
  } catch (error) {
    console.error("Fetch Current Order Error:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};


export const updateOrderStatus = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        message: "Please Login",
      });
    }

    const rider = await Rider.findOne({
      userId: userId,
    });

    if (!rider) {
      return res.status(404).json({
        message: "Please Login",
      });
    }

    const { orderId } = req.params;

    try {
      const { data } = await axios.put(
        `${process.env.RESTAURANT_SERVICE}/api/order/update/status/rider`,
        { orderId },
        {
          headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
          },
        }
      );

      return res.json({
        message: data.message,
      });
    } catch (error) {
      console.log(error);

      return res.status(500).json({
        message:
          error.response?.data?.message || "Failed to update order status",
      });
    }
  } catch (error) {
    console.error("Update Order Status Error:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

