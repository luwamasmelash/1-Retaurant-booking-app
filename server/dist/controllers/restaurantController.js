import { Restaurant } from '../models/Restaurant.js';
import jwt from 'jsonwebtoken';
import { User } from "../models/User.js";
import { Booking } from "../models/Booking.js";
export const getRestaurants = async (req, res) => {
    try {
        const { search, priceRange, rating, location, sort } = req.query;
        // Build query object
        const queryObj = { status: "approved" };
        if (search) {
            queryObj.$or = [
                { name: { $regex: search, $options: "i" } },
                { tags: { $regex: search, $options: "i" } },
                { location: { $regex: search, $options: "i" } },
            ];
        }
        if (priceRange) {
            const prices = Array.isArray(priceRange) ? priceRange : [priceRange];
            queryObj.priceRange = { $in: prices };
        }
        if (rating) {
            queryObj.rating = { $gte: parseFloat(rating) };
        }
        if (location) {
            queryObj.location = { $regex: location, $options: "i" };
        }
        // Sorting
        let sortOption = { createdAt: -1 };
        if (sort === "rating") {
            sortOption = { rating: -1 };
        }
        else if (sort === "price_low") {
            sortOption = { priceRange: 1 };
        }
        else if (sort === "price_high") {
            sortOption = { priceRange: -1 };
        }
        const restaurant = await Restaurant.find(queryObj).sort(sortOption);
        res.json(restaurant);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
// Get featured and exclusive restaurants
// GET /api/restaurants/featured
export const getFeaturedRestaurants = async (req, res) => {
    try {
        const featured = await Restaurant.find({
            status: "approved",
            $or: [{ featured: true }, { exclusive: true }]
        }).limit(6);
        res.json(featured);
    }
    catch (error) {
        console.error("Get Featured Restaurants Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
// Get single restaurant by slug
// GET /api/restaurants/:slug
export const getRestaurantBySlug = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ slug: req.params.slug });
        if (!restaurant) {
            res.status(404).json({ message: "Restaurant not found" });
            return;
        }
        // If not approved, verify authorization (owner or admin)
        if (restaurant.status !== "approved") {
            let isAuthorized = false;
            if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
                try {
                    const token = req.headers.authorization.split(" ")[1];
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    const user = await User.findById(decoded.id);
                    if (user && (user.role === "admin" || (user.role === "owner" && restaurant.owner.toString() === user._id.toString()))) {
                        isAuthorized = true;
                    }
                }
                catch (err) {
                    // Ignore token verify error
                }
            }
            if (!isAuthorized) {
                res.status(404).json({ message: "Restaurant not found or pending approval" });
                return;
            }
        }
        res.json(restaurant);
    }
    catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
};
// Get dynamic seat availability for slots
// GET /api/restaurants/:id/availability
export const getRestaurantAvailability = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            res.status(400).json({ message: "Please provide a date" });
            return;
        }
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            res.status(404).json({ message: "Restaurant not found" });
            return;
        }
        const bookingDate = new Date(date);
        // Get all active bookings on this date for the restaurant
        const startOfDay = new Date(bookingDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(bookingDate.setHours(23, 59, 59, 999));
        const existingBookings = await Booking.find({
            restaurant: req.params.id,
            date: { $gte: startOfDay, $lte: endOfDay },
            status: { $ne: "cancelled" }
        });
        // Calculate dynamic seat availability for each slot
        const availability = restaurant.availableSlots.map((slot) => {
            const totalBookedGuests = existingBookings
                .filter((b) => b.time === slot)
                .reduce((sum, b) => sum + b.guests, 0);
            const remainingSeats = Math.max(0, restaurant.totalSeats - totalBookedGuests);
            return {
                slot,
                remainingSeats,
                isAvailable: remainingSeats > 0
            };
        });
        res.json(availability);
    }
    catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
};
