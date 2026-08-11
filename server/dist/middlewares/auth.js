import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
export const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "Not authorized, no token" });
        return;
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        res.status(401).json({ message: "Not authorized, no token" });
        return;
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            res.status(401).json({
                message: "Not authorized, user not found",
            });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.log("Auth Middleware Error:", error);
        res.status(401).json({
            message: "Not authorized, token failed",
        });
    }
};
export const adminOnly = (req, res, next) => {
    if (req.user?.role === "admin") {
        next();
    }
    else {
        res.status(401).json({
            message: "Access denied, admin role required",
        });
    }
};
export const ownerOnly = (req, res, next) => {
    if (req.user?.role === "admin" || req.user?.role === "owner") {
        next();
    }
    else {
        res.status(401).json({
            message: "Access denied, restaurant owner role required",
        });
    }
};
