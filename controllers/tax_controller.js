import { calculateTax } from "../services/taxEngine.service.js";
import TaxRule from "../models/taxRuleModel.js";
import SavedCalculation from "../models/savedCalculationModel.js";

//post / tax/ calculate
export const calculate = async (req, res) => {
  try {
    const { grossSalary, statutoryDeductions = 0, annualRent = 0 } = req.body;
    if (!grossSalary) {
      return res.status(400).json({ message: "Gross salary is required" });
    }
    const result = calculateTax({
      grossSalary,
      statutoryDeductions,
      annualRent,
    });
    return res
      .status(200)
      .json({ message: "Tax calculated successfully", data: result });
  } catch (error) {
    return res.status(500).json({ message: "Error calculating tax", error });
  }
};

//get/tax/rules
export const getTaxRules = async (req, res) => {
  try {
    const rules = await TaxRule.findOne();
    return res.status(200).json({ message: "Tax rules fetched", data: rules });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching rules", error });
  }
};

//post/task/save
export const saveCalculation = async (req, res) => {
  try {
    const {
      grossSalary,
      statutoryDeductions = 0,
      annualRent = 0,
      title,
    } = req.body;
    if (!grossSalary) {
      return res.status(400).json({ message: "Gross salary is required" });
    }
    const result = calculateTax({
      grossSalary,
      statutoryDeductions,
      annualRent,
    });
    const saved = await SavedCalculation.create({
      userId: req.user.id,
      title,
      ...result,
    });
    return res.status(201).json({ message: "Calculation saved successfully", data: saved });
  } catch (error) {
    res.status(500).json({ message: "Error saving Calculation", error });
  }
};

//get/tax/history
export const getHistory = async (req, res) => {
  try {
    const history = await SavedCalculation.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json({ message: "History fetched successfully", data: history });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching history", error });
  }
};

//delete/tax/history/:id
export const deleteHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await SavedCalculation.findOneAndDelete({ _id: id, userId: req.user.id });
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
