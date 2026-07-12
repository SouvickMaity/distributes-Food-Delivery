import { useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketContext";
import audio from "../assets/quack.mp3";
import axios from "axios";
import { restaurantService } from "../main";
import OrderCard from "./OrderCard";

const ACTIVE_STATUSES = [
  "placed",
  "accepted",
  "preparing",
  "ready_for_rider",
  "rider_assigned",
  "picked_up",
];

const COMPLETED_STATUSES = ["delivered", "cancelled"];

const RestaurantOrders = ({ restaurantId }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // Used only to force a re-render every minute
  const [, setRefresh] = useState(0);

  const { socket } = useSocket();
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio(audio);
    audioRef.current.load();
  }, []);

  const unlockAudio = () => {
    if (audioRef.current) {
      audioRef.current
        .play()
        .then(() => {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setAudioUnlocked(true);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get(
        `${restaurantService}/api/order/restaurant/${restaurantId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setOrders(data.orders || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (restaurantId) {
      fetchOrders();
    }
  }, [restaurantId]);

  // Re-render every minute so completed orders disappear after 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setRefresh((prev) => prev + 1);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // New order socket
  useEffect(() => {
    if (!socket) return;

    const onNewOrder = () => {
      if (audioUnlocked && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
      }

      fetchOrders();
    };

    socket.on("order:new", onNewOrder);

    return () => {
      socket.off("order:new", onNewOrder);
    };
  }, [socket, audioUnlocked]);

  // Order updates
  useEffect(() => {
    if (!socket) return;

    const onUpdateOrder = () => {
      fetchOrders();
    };

    socket.on("order:rider_assigned", onUpdateOrder);
    socket.on("order:status_updated", onUpdateOrder);

    return () => {
      socket.off("order:rider_assigned", onUpdateOrder);
      socket.off("order:status_updated", onUpdateOrder);
    };
  }, [socket]);

  if (loading) {
    return <p className="text-gray-500">Loading Orders...</p>;
  }

  const activeOrders = orders.filter((order) =>
    ACTIVE_STATUSES.includes(order.status)
  );

  const recentCompletedOrders = orders.filter((order) => {
    if (!COMPLETED_STATUSES.includes(order.status)) return false;

    const completedTime = new Date(order.updatedAt).getTime();

    return Date.now() - completedTime < 5 * 60 * 1000;
  });

  return (
    <div className="space-y-6">
      {!audioUnlocked && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>

            <div>
              <p className="font-medium text-blue-900">
                Enable Sound Notifications
              </p>

              <p className="text-sm text-blue-700">
                Get notified when new orders arrive.
              </p>
            </div>
          </div>

          <button
            onClick={unlockAudio}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            Enable Sound
          </button>
        </div>
      )}

      {/* Active Orders */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Active Orders</h3>

        {activeOrders.length === 0 ? (
          <p className="text-gray-500">No active orders.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onStatusUpdate={fetchOrders}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recently Completed */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">
          Recently Completed (Last 5 Minutes)
        </h3>

        {recentCompletedOrders.length === 0 ? (
          <p className="text-gray-500">
            No recently completed orders.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {recentCompletedOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onStatusUpdate={fetchOrders}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantOrders;
