import type { NextFunction, Request, Response } from "express";
import { User } from "../models/User.js";
import type { IUser } from "../models/User.js";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
    user?: IUser;
}

interface JwtPayload {
    id: string;
}

export const protect = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
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
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET!
        ) as unknown as JwtPayload;

        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            res.status(401).json({
                message: "Not authorized, user not found",
            });
            return;
        }

        req.user = user;
        next();
    } catch (error) {
        console.log("Auth Middleware Error:", error);

        res.status(401).json({
            message: "Not authorized, token failed",
        });
    }
};

export const adminOnly = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (req.user?.role === "admin") {
        next();
    } else {
        res.status(401).json({
            message: "Access denied, admin role required",
        });
    }
};

export const ownerOnly = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (req.user?.role === "admin" || req.user?.role === "owner") {
        next();
    } else {
        res.status(401).json({
            message: "Access denied, restaurant owner role required",
        });
    }
};