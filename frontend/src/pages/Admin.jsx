import axios from "axios";
import { useEffect, useState } from "react";
import { adminService } from "../main";

import AdminRestaurantCard from "../components/AdminRestaurantCard";
import RiderAdmin from "../components/RiderAdmin";
import PlatformAnalytics from "../components/PlatformAnalytics";

const Admin = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState("restaurant");

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");

      const [restaurantRes, riderRes] = await Promise.all([
        axios.get(
          `${adminService}/api/v1/admin/restaurant/pending`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),

        axios.get(
          `${adminService}/api/v1/admin/rider/pending`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),
      ]);

      setRestaurants(restaurantRes.data.restaurants || []);
      setRiders(riderRes.data.riders || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-gray-500 text-lg">
          Loading Admin Dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">

      <h1 className="text-3xl font-bold">
        Admin Dashboard
      </h1>

      {/* Tabs */}

      <div className="flex flex-wrap gap-3">

        <button
          onClick={() => setTab("restaurant")}
          className={`rounded-lg px-5 py-2 font-medium transition ${
            tab === "restaurant"
              ? "bg-red-500 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          🏪 Restaurant Approval
        </button>

        <button
          onClick={() => setTab("rider")}
          className={`rounded-lg px-5 py-2 font-medium transition ${
            tab === "rider"
              ? "bg-red-500 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          🛵 Rider Approval
        </button>

        <button
          onClick={() => setTab("analytics")}
          className={`rounded-lg px-5 py-2 font-medium transition ${
            tab === "analytics"
              ? "bg-red-500 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          📊 Analytics
        </button>

      </div>

      {/* Restaurant Approval */}

      {tab === "restaurant" && (
        <div>

          <h2 className="mb-4 text-2xl font-semibold">
            Pending Restaurant Requests
          </h2>

          {restaurants.length === 0 ? (
            <div className="rounded-xl bg-white p-8 text-center shadow">
              <p className="text-gray-500">
                No pending restaurant requests.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {restaurants.map((restaurant) => (
                <AdminRestaurantCard
                  key={restaurant._id}
                  restaurant={restaurant}
                  onVerify={fetchData}
                />
              ))}
            </div>
          )}

        </div>
      )}

      {/* Rider Approval */}

      {tab === "rider" && (
        <div>

          <h2 className="mb-4 text-2xl font-semibold">
            Pending Rider Requests
          </h2>

          {riders.length === 0 ? (
            <div className="rounded-xl bg-white p-8 text-center shadow">
              <p className="text-gray-500">
                No pending rider requests.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {riders.map((rider) => (
                <RiderAdmin
                  key={rider._id}
                  rider={rider}
                  onVerify={fetchData}
                />
              ))}
            </div>
          )}

        </div>
      )}

      {/* Analytics */}

      {tab === "analytics" && (
        <PlatformAnalytics />
      )}

    </div>
  );
};

export default Admin;
