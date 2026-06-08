import { calculateTax } from "../Services/taxEngine.service.js";
import TaxRule from "../model/taxRuleModel.js";
import SavedCalculation from "../model/savedCalculationModel.js";   

//post / tax/ calculate
export const calculate = async (req, res) => {
    try{
        const { salary, deductions } = req.body;
        const rules = await TaxRule.findOne();
        const result = calculateTax({ salary, deductions, rules });
        return res.status(200).json({ message: "Tax calculated", data: result});
    }catch (error) {
        return res.status(500).json({ message: "Error calculating tax", error });
    };
};

//get/tax/rules
export const getTaxRules = async (req, res) => {
    try{
        const rules = await TaxRule.findOne();
        return res.status(200).json({ message: "Tax rules fetched", data: rules });
    }catch(error) {
        return res.status().jsn({ message: "Error fetching rules", error })
    };
};

//post/task/save 
export const saveCalculation = async (req, res) => {
    try{
        const { salary, deductions } = req.body;
        const rules = await TaxRule.findOne();
        const result = calculateTax({ salary, deductions, rules });
        const saved = await SavedCalculation.create({ userId: req.user.id, ...result});
        return res.status(201).json({ message: "Calculation saved", data: saved });
    }catch (error) {
        res.status(500).json({ message: "Error saving Calculation", error});
    };
}

//get/tax/history
export const getHistory = async (req, res) => {
    try{
        const history = await SavedCalculation.find({ userId: req.user.id });
        return res.status(200).json({ message: "History fetched", data: history });
    }catch(error) {
        return res.status(500).json({ message: "Error fetching history", error});
    };
};

export const deleteHistory = async (req, res) => {
    try{
        const { id } = req.params;
        await SavedCalculation.findOneAndDelete({ id: id, userId: req.user.id });
        return res.status(200).json({ message: "Calculation deleted successfully"});
    }catch(error) {
        return res.status(500).json({ message: "Error deleting calculation", error})
    };
};



