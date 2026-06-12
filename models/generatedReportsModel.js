import mongoose from "mongoose";

const generatedReportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },


    batchJobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BatchJob",
      default: null,
    },

    reportType: {
      type: String,
      enum: ["individual_pdf", "payroll_csv", "payroll_excel"],
      required: true,
    },

    fileName: {
      type: String,
      required: true,
    },

    filePath: {
      type: String,
      required: true,
    },

    fileSize: {
      type: Number,
    },

    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "completed",
    },

    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("GeneratedReport", generatedReportSchema);
