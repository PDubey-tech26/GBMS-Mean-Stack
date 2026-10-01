require("dotenv").config();

const mongoose = require("mongoose");

async function connectDB() {
  try {
    const uri =
      process.env.MONGO_URI ||
      "mongodb://127.0.0.1:27017/gbms";

    console.log("MongoDB URI loaded:", uri ? "YES" : "NO");

    await mongoose.connect(uri);

    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;