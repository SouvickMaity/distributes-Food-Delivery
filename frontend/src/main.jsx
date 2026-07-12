import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AppProvider } from "./context/AppContext.jsx";
import "leaflet/dist/leaflet.css";
import { SocketProvider } from "./context/SocketContext.jsx";

export const authService = 'https://distributes-food-delivery-auth.onrender.com'
export const restaurantService = 'https://distributes-food-delivery-restaurant1.onrender.com'
export const utilsService = 'https://distributes-food-delivery-utils.onrender.com'
export const realtimeService = 'https://distributes-food-delivery-realtime.onrender.com'
export const riderService = 'https://distributes-food-delivery-rider.onrender.com'
export const adminService = 'https://distributes-food-delivery.onrender.com'


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AppProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </AppProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);


