import { calculateTax } from "../services/taxEngine.js";
import TaxRule from "../models/taxRuleModel.js";
import SavedCalculation from "../models/savedCalculationModel.js";

//post / tax/ calculate
export const calculate = async (req, res) => {
  try {
    const {
      grossMonthlyIncome,
      annualRent = 0,
      nhfMonthly = 0,
      nhisMonthly = 0,
      lifeInsuranceMonthly = 0,
      mortgageInterestMonthly = 0,
    } = req.body;
    if (!grossMonthlyIncome) {
      return res
        .status(400)
        .json({ message: "Gross monthly income is required" });
    }
    const result = calculateTax({
      grossMonthlyIncome,
      annualRent,
      nhfMonthly,
      nhisMonthly,
      lifeInsuranceMonthly,
      mortgageInterestMonthly,
    });
    return res
      .status(200)
      .json({ message: "Tax calculated successfully", data: result });
  } catch (error) {
    return res.status(500).json({ message: "Error calculating tax", error: error.message });
  }
};

//get/tax/rules
export const getTaxRules = async (req, res) => {
  try {
    const rules = await TaxRule.findOne();
    return res.status(200).json({ message: "Tax rules fetched", data: rules });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching rules", error: error.message });
  }
};

//post/task/save
export const saveCalculation = async (req, res) => {
  try {
    const {
      grossMonthlyIncome,
      annualRent = 0,
      nhfMonthly = 0,
      nhisMonthly = 0,
      lifeInsuranceMonthly = 0,
      mortgageInterestMonthly = 0,
      title,
    } = req.body;

    if (!grossMonthlyIncome) {
      return res
        .status(400)
        .json({ message: "Gross monthly income is required" });
    }
    const result = calculateTax({
      grossMonthlyIncome,
      annualRent,
      nhfMonthly,
      nhisMonthly,
      lifeInsuranceMonthly,
      mortgageInterestMonthly,
    });

    const saved = await SavedCalculation.create({
      userId: req.user.id,
      title,
      annual: result.annual,
      monthly: result.monthly,
      taxBreakdown: result.taxBreakdown,
    });
    return res
      .status(201)
      .json({ message: "Calculation saved successfully", data: saved });
  } catch (error) {
    res.status(500).json({ message: "Error saving Calculation", error: error.message });
  }
};

//get/tax/history
export const getHistory = async (req, res) => {
  try {
    const history = await SavedCalculation.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    return res
      .status(200)
      .json({ message: "History fetched successfully", data: history });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching history", error });
  }
};

//delete/tax/history/:id
export const deleteHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await SavedCalculation.findOneAndDelete({
      _id: id,
      userId: req.user.id,
    });
    if (!deleted) {
      return res.status(404).json({ message: "Calculation not found" });
    }
    return res
      .status(200)
      .json({ message: "Calculation deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error deleting calculation", error });
  }
};
