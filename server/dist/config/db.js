import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI;
const connectMongoDB = async () => {
    try {
        if (!MONGODB_URI) {
            throw new Error("MONGODB_URI is not defined");
        }
        await mongoose.connect(MONGODB_URI);
        console.log("connected to MongoDB");
    }
    catch (error) {
        console.log("error connecting to MongoDB", error.message);
    }
};
export default connectMongoDB;
