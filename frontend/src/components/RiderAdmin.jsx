import toast from "react-hot-toast";
import { adminService } from "../main";
import axios from "axios";

const RiderAdmin = ({ rider, onVerify }) => {
  const verify = async () => {
    try {
      await axios.patch(
        `${adminService}/api/v1/verify/rider/${rider._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      toast.success("Rider verified");
      onVerify();
    } catch (error) {
      console.log(error);
      toast.error("Failed to verify rider");
    }
  };

  return (
    <div className="space-y-2 rounded-xl bg-white p-4 shadow">
      <img
        src={rider.picture}
        alt="Rider"
        className="h-40 w-full rounded object-cover"
      />

      <h3>{rider.phoneNumber}</h3>

      <p className="text-sm text-gray-500">
        Phone: {rider.phone}
      </p>

      <p>Aadhaar: {rider.aadharNumber}</p>

      <p>DL Number: {rider.drivingLicenseNumber}</p>

      <button
        onClick={verify}
        className="w-full rounded bg-green-500 py-2 text-white hover:bg-green-600"
      >
        Verify Rider
      </button>
    </div>
  );
};

export default RiderAdmin;
