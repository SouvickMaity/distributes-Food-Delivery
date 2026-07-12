import axios from "axios";
import { useEffect, useState } from "react";
import { adminService } from "../main";
import {
ResponsiveContainer,
LineChart,
Line,
CartesianGrid,
Tooltip,
XAxis,
YAxis,
} from "recharts";

const StatCard = ({ title, value }) => (
<div className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md">
<h3 className="text-sm font-medium text-gray-500">{title}</h3>

<p className="mt-3 text-3xl font-bold text-gray-800">
    {value}
</p>
</div>
);

const PlatformAnalytics = () => {
const [stats, setStats] = useState(null);
const [revenueData, setRevenueData] = useState([]);
const [loading, setLoading] = useState(true);

const fetchAnalytics = async () => {
try {
    const token = localStorage.getItem("token");

    const [dashboardRes, revenueRes] = await Promise.all([
    axios.get(`${adminService}/api/v1/admin/dashboard`, {
        headers: {
        Authorization: `Bearer ${token}`,
        },
    }),

    axios.get(`${adminService}/api/v1/admin/revenue`, {
        headers: {
        Authorization: `Bearer ${token}`,
        },
    }),
    ]);

    setStats(dashboardRes.data.data);
    setRevenueData(revenueRes.data.data);
} catch (error) {
    console.log(error);
} finally {
    setLoading(false);
}
};

useEffect(() => {
fetchAnalytics();
}, []);

if (loading) {
return (
    <div className="flex justify-center py-12">
    <p className="text-gray-500">Loading Platform Analytics...</p>
    </div>
);
}

return (
<div className="space-y-8">
    {/* Dashboard Cards */}

    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
    <StatCard
        title="👥 Total Users"
        value={stats?.totalUsers ?? 0}
    />

    <StatCard
        title="🍽 Total Restaurants"
        value={stats?.totalRestaurants ?? 0}
    />

    <StatCard
        title="🛵 Total Riders"
        value={stats?.totalRiders ?? 0}
    />

    <StatCard
        title="📦 Total Orders"
        value={stats?.totalOrders ?? 0}
    />

    <StatCard
        title="💵 Platform Revenue"
        value={`₹${(stats?.platformRevenue ?? 0).toLocaleString()}`}
    />

    <StatCard
        title="🟢 Active Restaurants"
        value={stats?.activeRestaurants ?? 0}
    />

    <StatCard
        title="🟢 Online Riders"
        value={stats?.onlineRiders ?? 0}
    />
    </div>

    {/* Revenue Graph */}

    <div className="rounded-xl border bg-white p-6 shadow-sm">
    <h2 className="mb-6 text-2xl font-bold text-gray-800">
        Revenue Analysis (Last 7 Days)
    </h2>

    <ResponsiveContainer width="100%" height={350}>
        <LineChart data={revenueData}>
        <CartesianGrid strokeDasharray="3 3" />

        <XAxis dataKey="date" />

        <YAxis />

        <Tooltip />

        <Line
            type="monotone"
            dataKey="revenue"
            stroke="#ef4444"
            strokeWidth={3}
            dot={{ r: 5 }}
        />
        </LineChart>
    </ResponsiveContainer>
    </div>
</div>
);
};

export default PlatformAnalytics;

