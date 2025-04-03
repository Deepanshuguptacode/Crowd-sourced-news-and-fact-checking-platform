const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoute');
const NewsRoutes = require('./routes/NewsRoute');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // Add this line
const path = require('path');
const app = express();
app.use(cors());
// Middleware
app.use(express.json());
app.use(cookieParser()); // Add this line
app.use('/uploads', express.static(path.join(__dirname,'uploads')));
// app.use((req,res,next)=>{res.send("hiFromServer");next()})
// Routes
app.use('/users', userRoutes);
app.use('/news', NewsRoutes);

// MongoDB Connection
mongoose
  .connect('mongodb://localhost:27017/DBMS', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(3000, () => console.log("Server running on port 3000"));
  })
  .catch((error) => console.log("MongoDB connection failed:", error.message));
