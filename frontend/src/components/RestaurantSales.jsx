import { useEffect, useState } from "react";
import axios from "axios";
import { restaurantService } from "../main";

const Card = ({ title, value }) => (
<div className="rounded-xl bg-white shadow-md p-5 border">
    <h3 className="text-gray-500 text-sm">{title}</h3>
    <p className="text-3xl font-bold mt-2 text-gray-800">
    {value}
    </p>
</div>
);

const RestaurantSales = ({ restaurantId }) => {
const [loading, setLoading] = useState(true);
const [analytics, setAnalytics] = useState(null);

const fetchAnalytics = async () => {
    
    try {
    const { data } = await axios.get(
        `${restaurantService}/api/analytics/${restaurantId}`,
        {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        }
    );

    setAnalytics(data.data);
    } catch (error) {
    console.log(error);
    } finally {
    setLoading(false);
    }
};

useEffect(() => {
    if (restaurantId) {
    fetchAnalytics();
    }
}, [restaurantId]);

if (loading) {
    return (
    <div className="flex justify-center py-10">
        Loading analytics...
    </div>
    );
}

return (
    <div className="space-y-8">

    {/* Cards */}
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

        <Card
        title="Total Sales"
        value={`₹${analytics.totalSales.toLocaleString()}`}
        />

        <Card
        title="Today's Sales"
        value={`₹${analytics.todaySales.toLocaleString()}`}
        />

        <Card
        title="Monthly Sales"
        value={`₹${analytics.monthlySales.toLocaleString()}`}
        />

        <Card
        title="Orders Today"
        value={analytics.ordersToday}
        />

    </div>

    {/* Top Selling Dishes */}

    <div className="rounded-xl bg-white shadow-md">

        <div className="border-b px-6 py-4">
        <h2 className="text-xl font-semibold">
            Top 5 Selling Dishes
        </h2>
        </div>

        <div className="divide-y">

        {analytics.topSellingItems.length === 0 ? (
            <div className="p-6 text-gray-500">
            No sales yet.
            </div>
        ) : (
            analytics.topSellingItems.map((item, index) => (
            <div
                key={index}
                className="flex justify-between items-center px-6 py-4"
            >
                <div className="flex items-center gap-4">

                <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center font-bold text-red-600">
                    {index + 1}
                </div>

                <div>
                    <p className="font-semibold">
                    {item.name}
                    </p>
                </div>

                </div>

                <div className="font-bold text-green-600">
                {item.sold} Sold
                </div>
            </div>
            ))
        )}

        </div>

    </div>

    </div>
    );
};

export default RestaurantSales;

