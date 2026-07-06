import { ObjectId } from "mongodb";
import {
  getRestaurantCollection,
  getRiderCollection,
} from "../util/collection.js";

export const getPendingRestaurant = async (req, res) => {
  try {
    const restaurants = await (await getRestaurantCollection())
      .find({ isVerified: false })
      .toArray();

    return res.json({
      count: restaurants.length,
      restaurants,
    });
  } catch (error) {
    console.error("Get Pending Restaurants Error:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const getPendingRiders = async (req, res) => {
  try {
    const riders = await (await getRiderCollection())
      .find({ isVerified: false })
      .toArray();

    return res.json({
      count: riders.length,
      riders,
    });
  } catch (error) {
    console.error("Get Pending Riders Error:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const verifyRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    if (typeof id !== "string") {
      return res.status(400).json({
        message: "Invalid restaurant id",
      });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid object id",
      });
    }

    const result = await (
      await getRestaurantCollection()
    ).updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          isVerified: true,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "Restaurant not found",
      });
    }

    return res.json({
      message: "Restaurant verified successfully",
    });
  } catch (error) {
    console.error("Verify Restaurant Error:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const verifyRider = async (req, res) => {
  try {
    const { id } = req.params;

    if (typeof id !== "string") {
      return res.status(400).json({
        message: "Invalid rider id",
      });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid object id",
      });
    }

    const result = await (
      await getRiderCollection()
    ).updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          isVerified: true,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "Rider not found",
      });
    }

    return res.json({
      message: "Rider verified successfully",
    });
  } catch (error) {
    console.error("Verify Rider Error:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

