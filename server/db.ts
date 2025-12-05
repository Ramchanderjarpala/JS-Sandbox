import mongoose from "mongoose";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Please provide your MongoDB connection string.",
  );
}

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL as string);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

