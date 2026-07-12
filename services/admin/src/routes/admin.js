import express from "express";
import { isAdmin, isAuth } from "../middlewares/isAuth.js";
import {
  getPendingRestaurant,
  getPendingRiders,
  verifyRestaurant,
  verifyRider,
} from "../controllers/admin.js";
import { getDashboardStats, getRevenueAnalytics } from "../controllers/dashboardAnalysis.js";

const router = express.Router();

router.get("/admin/restaurant/pending", isAuth, isAdmin, getPendingRestaurant);
router.get("/admin/rider/pending", isAuth, isAdmin, getPendingRiders);
router.patch("/verify/rider/:id", isAuth, isAdmin, verifyRider);
router.patch("/verify/restaurant/:id", isAuth, isAdmin, verifyRestaurant);
router.get("/admin/dashboard", isAuth, isAdmin, getDashboardStats);
router.get("/admin/revenue", isAuth, isAdmin, getRevenueAnalytics);



export default router;
