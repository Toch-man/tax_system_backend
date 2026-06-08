import mongoose from "mongoose";

const batchJobSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resultCount: {
      type: Number,
    },
  },
  { timestamps: true },
);

export default mongoose.model("BatchJob", batchJobSchema);
