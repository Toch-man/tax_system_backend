import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    profileType: {
      type: String,
      enum: ["employee", "freelancer", "business"],
      required: true,
    },
    full_name: {
      type: String,
    },
    email: {
      type: String,
    },

    //EMPLOYEE

    employerName: String,

    monthlySalary: Number,

    // FREELANCER

    freelancerType: String,

    averageMonthlyIncome: Number,

    // BUSINESS OWNER

    businessName: String,

    businessType: String,

    industry: String,

    cacNumber: String,

    businessAddress: String,

    monthlyRevenue: Number,

    annualRevenue: Number,

    employeeCount: Number,

    bankName: String,

    accountNumber: Number,

    // TAX INFORMATION
    annualRent: Number,

    nhf: Number,

    nhis: Number,

    lifeInsurance: Number,

    mortgageInterest: Number,

    profileCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Profile", profileSchema);
