import { generateIndividualPdf } from "../services/individual.PDF.report.js";
import { generatePayrollCsv } from "../services/csv.payroll.report.js";
import { generatePayrollExcel } from "../services/excel.payroll.report.js";

// GET /api/reports/individual/pdf - Generate Individual PDF Report
export const individualPdf = async (req, res) => {
  try {
    const report = await generateIndividualPdf(req.user._id); // Generate PDF report for the authenticated user

    // Return report metadata
    return res.json({
      success: true,
      reportId: report._id,
      reportType: report.reportType,
      downloadUrl: `/reports/${report._id}/download`,
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

    // Generate CSV report
    const report = await generatePayrollCsv(
      batchJobId,
      req.user._id,
    );

    return res.json({
      success: true,
      reportId: report._id,
      reportType: report.reportType,
      downloadUrl: `/reports/${report._id}/download`,
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

    // Generate Excel report
    const report = await generatePayrollExcel(
      batchJobId,
      req.user._id,
    );

    return res.json({
      success: true,
      reportId: report._id,
      reportType: report.reportType,
      downloadUrl: `/reports/${report._id}/download`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};