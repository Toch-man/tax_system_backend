import { generateIndividualPdf } from "../Services/individual.PDF.report.js";
import { generatePayrollCsv } from "../Services/csv.payroll.report.js";
import { generatePayrollExcel } from "../Services/excel.payroll.report.js";


export const individualPdf = async (req, res) => {
  try {
    // Generate PDF for logged-in user
    const report = await generateIndividualPdf(req.user._id);

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