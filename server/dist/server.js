import "dotenv/config";
import express from 'express';
import cors from "cors";
import connectMongoDB from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import restaurantRouter from './routes/restaurantRoutes.js';
import bookingRouter from "./routes/bookingRoutes.js";
import ownerRouter from "./routes/ownerRoutes.js";
import adminRouter from './routes/adminRoutes.js';
const app = express();
await connectMongoDB();
// Middleware
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 4000;
app.use((req, res, next) => {
    console.log("REQUEST:", req.method, req.url);
    next();
});
app.get('/', (req, res) => {
    res.send('Server is Live!');
});
app.use('/api/auth', authRouter);
app.use('/api/restaurants', restaurantRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/owner', ownerRouter);
app.use('/api/admin', adminRouter);
//Global error handler
app.use((err, req, res, next) => {
    console.log('Unhandle Error', err);
    res.status(500).json({
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
});
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
