import express from "express";
import { getRestaurantAnalytics } from "../controllers/analytics.controller.js";
import { isAuth, isSeller } from "../middlewares/isAuth.js";


const router = express.Router();


router.get("/:restaurantId",isAuth,isSeller, getRestaurantAnalytics);

export default router;


