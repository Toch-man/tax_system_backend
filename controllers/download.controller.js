import fs from "fs";
import GeneratedReport from "../models/generatedReportsModel.js";

// GET /api/reports/download/:id
export const downloadReport = async (req, res) => {
  try {
    // Find report by ID
    const report = await GeneratedReport.findById(
      req.params.id
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // Verify report ownership
    if (!report.user || !report.user.equals(req.user._id)) 
      {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check report status
    if (report.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Report is not ready for download",
      });
    }

    // Verify file exists on disk
    if (!fs.existsSync(report.filePath)) {
      return res.status(404).json({
        success: false,
        message: "File no longer exists",
      });
    }
    
    // Send file to client
    return res.download(
      report.filePath,
      report.fileName
    );
  } catch (error) {
    // Handle unexpected errors
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};