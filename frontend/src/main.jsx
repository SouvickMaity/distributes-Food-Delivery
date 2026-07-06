import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AppProvider } from "./context/AppContext.jsx";
import "leaflet/dist/leaflet.css";
import { SocketProvider } from "./context/SocketContext.jsx";

export const authService = import.meta.env.VITE_AUTH_SERVICE;
export const restaurantService = import.meta.env.VITE_RESTAURANT_SERVICE;
export const utilsService = import.meta.env.VITE_UTILS_SERVICE;
export const realtimeService = import.meta.env.VITE_REALTIME_SERVICE;
export const riderService = import.meta.env.VITE_RIDER_SERVICE;
export const adminService = import.meta.env.VITE_ADMIN_SERVICE;

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


