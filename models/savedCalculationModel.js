import mongoose from "mongoose";

const breakdownSchema = new mongoose.Schema(
  {
    rate: String,
    taxableAmount: Number,
    taxGenerated: Number,
  },
  { _id: false }
);

const summarySchema = new mongoose.Schema(
  {
    grossIncome: {
      type: Number,
      default: 0,
    },

    pension: {
      type: Number,
      default: 0,
    },

    nhf: {
      type: Number,
      default: 0,
    },

    nhis: {
      type: Number,
      default: 0,
    },

    lifeInsurance: {
      type: Number,
      default: 0,
    },

    mortgageInterest: {
      type: Number,
      default: 0,
    },

    rentRelief: {
      type: Number,
      default: 0,
    },

    deductions: {
      type: Number,
      default: 0,
    },

    taxableIncome: {
      type: Number,
      default: 0,
    },

    paye: {
      type: Number,
      default: 0,
    },

    netIncome: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const savedCalculationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      default: "Untitled Calculation",
      trim: true,
    },

    annual: {
      type: summarySchema,
      required: true,
    },

    monthly: {
      type: summarySchema,
      required: true,
    },

    taxBreakdown: {
      type: [breakdownSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "SavedCalculation",
  savedCalculationSchema
);