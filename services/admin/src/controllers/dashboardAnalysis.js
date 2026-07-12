import {
getUserCollection,
getRestaurantCollection,
getRiderCollection,
getOrderCollection,
} from "../util/collection.js";


// ===============================
// Platform Dashboard Statistics
// ===============================

export const getDashboardStats = async (req, res) => {
try {
const users = await getUserCollection();
const restaurants = await getRestaurantCollection();
const riders = await getRiderCollection();
const orders = await getOrderCollection();


const [
    totalUsers,
    totalRestaurants,
    totalRiders,
    totalOrders,
    activeRestaurants,
    onlineRiders,
    revenue,
] = await Promise.all([


    // Total Customers
    users.countDocuments({
    role: "customer",
    }),


    // Total Restaurants
    restaurants.countDocuments(),


    // Total Riders
    riders.countDocuments(),


    // Total Orders
    orders.countDocuments(),


    // Verified + Open Restaurants
    restaurants.countDocuments({
    isVerified: true,
    isOpen: true,
    }),


    // Online Riders
    riders.countDocuments({
    isOnline: true,
    }),


    // Platform Revenue
    orders
    .aggregate([
        {
        $match: {
            status: "delivered",
            paymentStatus: "paid",
        },
        },

        {
        $group: {
            _id: null,

            totalPlatformRevenue: {
            $sum: "$platfromFee",
            },
        },
        },
    ])
    .toArray(),
]);


return res.status(200).json({
    success: true,

    data: {
    totalUsers,

    totalRestaurants,

    totalRiders,

    totalOrders,

    platformRevenue:
        revenue.length > 0
        ? revenue[0].totalPlatformRevenue
        : 0,


    activeRestaurants,

    onlineRiders,
    },
});


} catch (error) {

console.error(error);

return res.status(500).json({
    success: false,
    message: "Failed to fetch dashboard statistics",
});

}
};





// ===============================
// Revenue Graph Analytics
// Last 7 Days
// ===============================


export const getRevenueAnalytics = async (req, res) => {

try {

const orders = await getOrderCollection();


const startDate = new Date();

startDate.setDate(
    startDate.getDate() - 6
);

startDate.setHours(
    0,
    0,
    0,
    0
);



const revenue = await orders
    .aggregate([

    {
        $match: {

        status: "delivered",

        paymentStatus: "paid",

        createdAt: {
            $gte: startDate,
        },

        },
    },


    {
        $group: {

        _id: {

            year: {
            $year: "$createdAt",
            },

            month: {
            $month: "$createdAt",
            },

            day: {
            $dayOfMonth: "$createdAt",
            },

        },


        revenue: {

            $sum: "$platfromFee",

        },

        },

    },


    {
        $sort: {

        "_id.year": 1,

        "_id.month": 1,

        "_id.day": 1,

        },

    },

    ])
    .toArray();





const graphData = [];



for(let i = 0; i < 7; i++){

    const current = new Date(startDate);


    current.setDate(
    startDate.getDate() + i
    );



    const found = revenue.find(
    (item)=>


        item._id.year === current.getFullYear()
        &&

        item._id.month === current.getMonth()+1
        &&

        item._id.day === current.getDate()

    );



    graphData.push({

    date:
        current.toLocaleDateString(
        "en-US",
        {
            weekday:"short",
        }
        ),


    revenue:
        found
        ?
        found.revenue
        :
        0,

    });


}




return res.status(200).json({

    success:true,

    data:graphData,

});



} catch(error){


console.error(error);


return res.status(500).json({

    success:false,

    message:"Failed to fetch revenue analytics",

});


}

};