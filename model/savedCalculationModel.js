import mongoose from "mongoose";

const savedCalculationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    salary: {
      type: Number,
      required: true,
    },

    deductions: {
      type: Number,
      default: 0,
    },

    cra: {
      type: Number,
      required: true,
    },

    taxableIncome: {
      type: Number,
      required: true,
    },

    annualTax: {
      type: Number,
      required: true,
    },

    monthlyTax: {
      type: Number,
      required: true,
    },

    netSalary: {
      type: Number,
      required: true,
    },

    title: {
      type: String,
      default: "Untitled Calculation",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("SavedCalculation", savedCalculationSchema);
