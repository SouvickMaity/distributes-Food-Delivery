import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoute from "./routes/auth.js";
import cors from "cors";
import axios from "axios";

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());

app.use("/api/auth", authRoute);

app.get("/api/location/reverse", async (req, res) => {
  try {
    const { lat, lon } = req.query;

    const { data } = await axios.get(
      "https://nominatim.openstreetmap.org/reverse",
      {
        params: {
          format: "json",
          lat,
          lon,
        },
        headers: {
          "User-Agent": "FoodDeliveryApp/1.0",
        },
      }
    );

    res.json(data);
    
  } catch (err) {
    res.status(500).json({ message: "Location fetch failed" });
    console.log(err);
  }
});



const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Auth service is running on port ${PORT}`);
  connectDB();
});
