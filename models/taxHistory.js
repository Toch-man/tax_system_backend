import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
  {
    batchJobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BatchJob",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    input: {
      salary: Number,
      deductions: Number,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    result: {
      grossSalary: Number,
      taxableIncome: Number,
      annualTax: Number,
      monthlyTax: Number,
      netSalary: Number,
    },
  },
  { timestamps: true },
);

export default mongoose.model("TaxHistory", historySchema);
