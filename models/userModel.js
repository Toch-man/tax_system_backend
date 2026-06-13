import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
      required: true,
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

    refresh_token: {
      type: String,
      default: null,
    },
    reset_token: {
      type: String,
      default: null,
    },
    reset_token_expires: {
      type: Date,
      default: null,
    },

    profileCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
