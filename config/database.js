import mongoose from "mongoose";

const connectDB = async () => {
  try {
    if (!process.env.LIVE_URL) {
      throw new Error("Missing MONGO connection string");
    }

    await mongoose.connect(process.env.LIVE_URL);

    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1); // stop server if DB fails
  }
};

export default connectDB;
