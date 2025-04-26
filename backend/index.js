import express from 'express';
import mongoose from 'mongoose';
import userRoutes from './routes/userRoute.js';
import NewsRoutes from './routes/NewsRoute.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const dbUrl = process.env.DB_URL || "";
const __dirname = path.resolve();

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use((req,res,next)=>{res.send("hiFromServer");next()})

// Routes
app.use('/users', userRoutes);
app.use('/news', NewsRoutes);

// MongoDB Connection
try {
  mongoose
    .connect(`${dbUrl}DBMS`, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      console.log("Connected to MongoDB");
      app.listen(3000, () => console.log("Server running on port 3000"));
    })
    .catch((error) => console.log("MongoDB connection failed:", error.message));
} catch (err) {
  console.log(`Error Occurred : ${err}`)
}
// finally{
//   // module.exports = serverless(app);
// }