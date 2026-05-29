import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    input: {
      salary: Number,
      deductions: Number,
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
