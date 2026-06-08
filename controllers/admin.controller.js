import User from "../models/userModel.js";
import TaxRule from "../models/taxRuleModel.js";

//GET /admin/users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password") // Exclude password field
      .sort({ createdAt: -1 }); // Sort by creation date, newest first

    res.status(200).json({
      success: true,
      count: users.length, // Include count of users in the response
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// PATCH /admin/users/:id/role
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    const allowedRoles = ["user", "admin", "accountant"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      {
        new: true, // Return the updated document
        runValidators: true, // Ensure the new role is validated against the schema
      },
    ).select("-password"); // Exclude password field from the response

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Role updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// POST /admin/tax-rules
export const createTaxRule = async (req, res) => {
  try {
    const taxRule = await TaxRule.create(req.body);

    res.status(201).json({
      success: true,
      message: "Tax rule created successfully",
      taxRule,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// PATCH /admin/tax-rules/:id
export const updateTaxRule = async (req, res) => {
  try {
    const taxRule = await TaxRule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!taxRule) {
      return res.status(404).json({
        success: false,
        message: "Tax rule not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Tax rule updated successfully",
      taxRule,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
