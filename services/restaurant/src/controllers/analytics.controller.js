import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";

export const getRestaurantAnalytics = async (req, res) => {
try {
    const { restaurantId } = req.params;
    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
    return res.status(404).json({
        success: false,
        message: "Restaurant not found",
    });
    }

    // Check ownership
    if (restaurant.ownerId.toString() !== req.user._id) {
    return res.status(403).json({
        success: false,
        message: "You are not authorized to access this analytics.",
    });
    }


    const today = new Date();
    const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
    );

    const startOfMonth = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
    );

    const analytics = await Order.aggregate([
    {
        $match: {
        restaurantId: restaurantId,
        status: "delivered",
        paymentStatus: "paid",
        },
    },
    {
        $facet: {
        // Total Sales
        totalSales: [
            {
            $group: {
                _id: null,
                totalSales: {
                $sum: "$totalAmount",
                },
            },
            },
        ],

        // Today's Sales
        todaySales: [
            {
            $match: {
                createdAt: {
                $gte: startOfToday,
                },
            },
            },
            {
            $group: {
                _id: null,
                todaySales: {
                $sum: "$totalAmount",
                },
            },
            },
        ],

        // Monthly Sales
        monthlySales: [
            {
            $match: {
                createdAt: {
                $gte: startOfMonth,
                },
            },
            },
            {
            $group: {
                _id: null,
                monthlySales: {
                $sum: "$totalAmount",
                },
            },
            },
        ],

        // Orders Today
        ordersToday: [
            {
            $match: {
                createdAt: {
                $gte: startOfToday,
                },
            },
            },
            {
            $count: "ordersToday",
            },
        ],

        // Top 5 Selling Dishes
        topSellingItems: [
            {
            $unwind: "$items",
            },
            {
            $group: {
                _id: "$items.name",
                sold: {
                $sum: "$items.quauntity",
                },
            },
            },
            {
            $sort: {
                sold: -1,
            },
            },
            {
            $limit: 5,
            },
            {
            $project: {
                _id: 0,
                name: "$_id",
                sold: 1,
            },
            },
        ],
        },
    },
    ]);

    const data = analytics[0];

    res.status(200).json({
    success: true,
    data: {
        totalSales: data.totalSales[0]?.totalSales || 0,

        todaySales: data.todaySales[0]?.todaySales || 0,

        monthlySales: data.monthlySales[0]?.monthlySales || 0,

        ordersToday: data.ordersToday[0]?.ordersToday || 0,

        topSellingItems: data.topSellingItems,
    },
    });
} catch (error) {
    console.error(error);

    res.status(500).json({
    success: false,
    message: error.message,
    });
}
};

