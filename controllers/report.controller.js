import { generateIndividualPdf } from "../services/individual.PDF.report.js";
import { generatePayrollCsv } from "../services/csv.payroll.report.js";
import { generatePayrollExcel } from "../services/excel.payroll.report.js";
import mongoose from "mongoose";

// GET /api/reports/individual/pdf - Generate Individual PDF Report
export const individualPdf = async (req, res) => {
  try {
    const report = await generateIndividualPdf(
  req.user._id || req.user.id || req.user.user_id
);// Generate PDF report for the authenticated user

    // Return report metadata
    return res.json({
      success: true,
      message: "Report generated successfully",
      reportId: report._id,
      reportType: report.reportType,
      downloadUrl: `/api/reports/${report._id}/download`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// POST /api/reports/payroll/csv - Generate Payroll CSV Report
export const payrollCsv = async (req, res) => {
  try {
    const { batchJobId } = req.body;

    // Validate input
    if (!batchJobId) {
      return res.status(400).json({
        success: false,
        message: "batchJobId is required",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(batchJobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid batchJobId format",
      });
    }

    // Generate CSV report
    const report = await generatePayrollCsv(
      batchJobId,
      req.user._id,
    );

    return res.json({
      success: true,
      message: "CSV report generated successfully",
      reportId: report._id,
      reportType: report.reportType,
      downloadUrl: `/api/reports/${report._id}/download`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// POST /api/reports/payroll/excel - Generate Payroll Excel Report
export const payrollExcel = async (req, res) => {
  try {
    const { batchJobId } = req.body;

    // Validate input
    if (!batchJobId) {
      return res.status(400).json({
        success: false,
        message: "batchJobId is required",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(batchJobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid batchJobId format",
      });
    }

    // Generate Excel report
    const report = await generatePayrollExcel(
      batchJobId,
      req.user._id,
    );

    return res.json({
      success: true,
      message: "Excel report generated successfully",
      reportId: report._id,
      reportType: report.reportType,
      downloadUrl: `/api/reports/${report._id}/download`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//Get User Reports

export const getUserReports = async (req, res) => {
  try {
    const reports = await GeneratedReport.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      message: "User reports retrieved successfully",
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving user reports",
      error: error.message,
    });
  }
};
