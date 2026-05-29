import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
    },
    last_name: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin", "accountant"],
      default: "user",
    },

    refreshToken: {
      type: String,
    },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
