import mongoose from "mongoose";

const breakdownSchema = new mongoose.Schema(
  {
    rate: String,
    taxableAmount: Number,
    taxGenerated: Number,
  },
  { _id: false },
);

const savedCalculationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    annual: {
      salary: Number,
      deduction: Number,
      rentRelief: Number,
      taxableIncome: Number,
      taxBill: Number,
      netSalary: Number,
    },

    monthly: {
      salary: Number,
      deduction: Number,
      rentRelief: Number,
      taxableIncome: Number,
      taxBill: Number,
      netSalary: Number,
    },

    taxBreakdown: [breakdownSchema],

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
