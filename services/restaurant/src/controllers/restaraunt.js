import axios from "axios";
import getBuffer from "../config/datauri.js";
import Restaurant from "../models/Restaurant.js";
import jwt from "jsonwebtoken";

export const addRestraunt = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const existingRestaurant = await Restaurant.findOne({
      ownerId: user._id,
    });

    if (existingRestaurant) {
      return res.status(400).json({
        message: "You already have a restaurant",
      });
    }

    const {
      name,
      description,
      latitude,
      longitude,
      formattedAddress,
      phone,
    } = req.body;

    if (!name || !latitude || !longitude) {
      return res.status(400).json({
        message: "Please give all details",
      });
    }

    const file = req.file;

    if (!file) {
      return res.status(400).json({
        message: "Please give image",
      });
    }

    const fileBuffer = getBuffer(file);

    if (!fileBuffer || !fileBuffer.content) {
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

    const restaurant = await Restaurant.create({
      name,
      description,
      phone,
      image: uploadResult.url,
      ownerId: user._id,
      autoLocation: {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)],
        formattedAddress,
      },
      isVerified: false,
    });

    return res.status(201).json({
      message: "Restaurant created successfully",
      restaurant,
    });
  } catch (error) {
    console.error("Add Restaurant Error:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const fetchMyRestaurant = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Please Login",
      });
    }

    const restaurant = await Restaurant.findOne({
      ownerId: req.user._id,
    });

    if (!restaurant) {
      return res.status(400).json({
        message: "No Restaurant found",
      });
    }

    if (!req.user.restaurantId) {
      const token = jwt.sign(
        {
          user: {
            ...req.user,
            restaurantId: restaurant._id.toString(),
          },
        },
        process.env.JWT_SEC,
        {
          expiresIn: "15d",
        }
      );

      return res.json({
        restaurant,
        token,
      });
    }

    return res.json({
      restaurant,
    });
  } catch (error) {
    console.error("Fetch My Restaurant Error:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};


export const updateStatusRestaurant = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({
        message: "Please Login",
      });
    }

    const { status } = req.body;

    if (typeof status !== "boolean") {
      return res.status(400).json({
        message: "Status must be boolean",
      });
    }

    const restaurant = await Restaurant.findOneAndUpdate(
      {
        ownerId: req.user._id,
      },
      {
        isOpen: status,
      },
      {
        new: true,
      }
    );

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found",
      });
    }

    return res.json({
      message: "Restaurant status Updated",
      restaurant,
    });
  } catch (error) {
    console.error("Update Restaurant Status Error:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};


export const updateRestaurant = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({
        message: "Please Login",
      });
    }

    const { name, description } = req.body;

    const restaurant = await Restaurant.findOneAndUpdate(
      {
        ownerId: req.user._id,
      },
      {
        name,
        description,
      },
      {
        new: true,
      }
    );

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found",
      });
    }

    return res.json({
      message: "Restaurant Updated",
      restaurant,
    });
  } catch (error) {
    console.error("Update Restaurant Error:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};


export const getNearbyRestaurant = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      radius = 5000,
      search = "",
    } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        message: "Latitude and longitude are required",
      });
    }

    const query = {
      isVerified: true,
    };

    if (search && typeof search === "string") {
      query.name = {
        $regex: search,
        $options: "i",
      };
    }


    
    const restaurants = await Restaurant.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [Number(longitude), Number(latitude)],
          },
          distanceField: "distance",
          maxDistance: Number(radius),
          spherical: true,
          query,
        },
      },
      {
        $sort: {
          isOpen: -1,
          distance: 1,
        },
      },
      {
        $addFields: {
          distanceKm: {
            $round: [{ $divide: ["$distance", 1000] }, 2],
          },
        },
      },
    ]);

    return res.json({
      success: true,
      count: restaurants.length,
      restaurants,
    });
  } catch (error) {
    console.error("Get Nearby Restaurant Error:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};



export const fetchSingleRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found",
      });
    }

    return res.json(restaurant);
  } catch (error) {
    console.error("Fetch Single Restaurant Error:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

