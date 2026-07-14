import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AppProvider } from "./context/AppContext.jsx";
import "leaflet/dist/leaflet.css";
import { SocketProvider } from "./context/SocketContext.jsx";

export const authService = 'https://food-delivery-auth-service-latest.onrender.com'
export const restaurantService = 'https://food-delivery-restaurant-service-latest.onrender.com'
export const utilsService = 'https://food-delivery-utils-service-latest.onrender.com'
export const realtimeService = 'https://food-delivery-realtime-service-latest.onrender.com'
export const riderService = 'https://rider-service-diml.onrender.com'
export const adminService = 'https://food-delivery-quickbite-admin-latest.onrender.com'


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


