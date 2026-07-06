import axios from "axios";
import { adminService } from "../main";
import toast from "react-hot-toast";

const AdminRestaurantCard = ({ restaurant, onVerify }) => {
  const verify = async () => {
    try {
      await axios.patch(
        `${adminService}/api/v1/verify/restaurant/${restaurant._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      toast.success("Restaurant verified");
      onVerify();
    } catch (error) {
      console.log(error);
      toast.error("Failed to verify restaurant");
    }
  };

  return (
    <div className="space-y-2 rounded-xl bg-white p-4 shadow">
      <img
        src={restaurant.image}
        alt={restaurant.name}
        className="h-40 w-full rounded object-cover"
      />

      <h3>{restaurant.name}</h3>

      <p className="text-sm text-gray-500">{restaurant.phone}</p>

      <p>{restaurant.autoLocation?.formattedAddress}</p>

      <button
        onClick={verify}
        className="w-full rounded bg-green-500 py-2 text-white hover:bg-green-600"
      >
        Verify Restaurant
      </button>
    </div>
  );
};

export default AdminRestaurantCard;

