import mongoose from "mongoose";

const taxRuleSchema = new mongoose.Schema(
  {
    cra: Number,
    bands: [
      {
        limit: Number,
        rate: Number,
      },
    ],
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("TaxRule", taxRuleSchema);
