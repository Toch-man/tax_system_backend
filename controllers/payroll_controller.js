import fs from "fs";
import csv from "csv-parser";
import mongoose from "mongoose";
import BatchJob from "../models/batchJobModel.js";
import TaxHistory from "../models/taxHistory.js";
import User from "../models/userModel.js";
import { calculateTax } from "../services/taxEngine.service.js";

// 1. POST /api/payroll/upload — Stream, Calculate, and Bulk Insert Payroll
export const uploadPayroll = async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "Please upload a CSV file." });
  }

  const filePath = req.file.path;
  let currentUpload;
  let streamFailed = false;

  try {
    // B. Pre-fetch users into an in-memory cache map for high-speed lookups
    const databaseUsers = await User.find({}, "email _id");
    const userCacheMap = new Map(
      databaseUsers.map((user) => [
        (user.email || "").toLowerCase().trim(),
        user._id,
      ]),
    );

    // C. Initialize parent batch tracking state using strict schema enums
    currentUpload = await BatchJob.create({
      fileName: req.file.originalname,
      status: "processing",
      uploadedBy: req.user?._id || req.user?.user_id || null,
      resultCount: 0,
    });

    const historyRecordsToInsert = [];

    // D. Create file read stream applying case-insensitive header mapping transformation
    const fileStream = fs.createReadStream(filePath).pipe(
      csv({
        mapHeaders: ({ header }) => (header || "").toLowerCase().trim(),
      }),
    );

    fileStream
      .on("data", (row) => {
        try {
          // Normalize lookup parameters safely
          const rowEmail = (row.email || "").toLowerCase().trim();
          const matchedUserId = userCacheMap.get(rowEmail) || null;

          // Parse inputs defensively; guard against non-numeric values (NaN) or negative numbers
          const rawSalary = parseFloat(row.salary);
          const rawDeductions = parseFloat(row.deductions);
          const rawAnnualRent = parseFloat(row.annualrent) || 0;
          const salaryInput = isNaN(rawSalary) || rawSalary < 0 ? 0 : rawSalary;
          const deductionsInput =
            isNaN(rawDeductions) || rawDeductions < 0 ? 0 : rawDeductions;
          const annualRentInput = isNaN(rawAnnualRent) || rawAnnualRent < 0 ? 0 : rawAnnualRent;

          // Execute team math logic utility function synchronously
          const taxBreakdown = calculateTax({
            grossSalary: salaryInput,
            statutoryDeductions: deductionsInput,
            annualRent: annualRentInput,
          });

          // Construct item body matching the exact structural nesting of historySchema
          historyRecordsToInsert.push({
            batchJobId: currentUpload._id,
            userId: matchedUserId,
            email: rowEmail,
            input: {
              salary: salaryInput,
              deductions: deductionsInput,
            },
            result: {
              grossSalary: taxBreakdown.annual.salary,
              taxableIncome: taxBreakdown.annual.taxableIncome,
              annualTax: taxBreakdown.annual.taxBill,
              monthlyTax: taxBreakdown.monthly.taxBill,
              netSalary: taxBreakdown.annualnetSalary,
            },
          });
        } catch (calcError) {
          fileStream.destroy(calcError);
        }
      })
      .on("error", async (error) => {
        streamFailed = true;

        try {
          if (currentUpload) {
            currentUpload.status = "failed";
            await currentUpload.save();
          }
        } catch (dbSaveError) {
          console.error(
            "Failed to log job failure status:",
            dbSaveError.message,
          );
        }

        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        if (!res.headersSent) {
          return res.status(500).json({
            success: false,
            message: "Error processing batch payroll file rows.",
            error: error.message,
          });
        }
      })
      .on("end", async () => {
        // Prevent executing execution block if error event caught it first
        if (streamFailed) return;

        try {
          // Execute high-performance atomic write operation if array contains records
          if (historyRecordsToInsert.length > 0) {
            await TaxHistory.insertMany(historyRecordsToInsert);
          }

          // Complete parent document update cycle safely
          currentUpload.status = "completed";
          currentUpload.resultCount = historyRecordsToInsert.length;
          await currentUpload.save();

          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

          if (!res.headersSent) {
            return res.status(201).json({
              success: true,
              message: "Batch payroll processed and logged successfully.",
              batchJobId: currentUpload._id,
              totalProcessed: historyRecordsToInsert.length,
            });
          }
        } catch (dbError) {
          try {
            if (currentUpload) {
              currentUpload.status = "failed";
              await currentUpload.save();
            }
          } catch (dbSaveError) {
            console.error(
              "Failed to update job status following write failure:",
              dbSaveError.message,
            );
          }

          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

          if (!res.headersSent) {
            return res.status(500).json({
              success: false,
              message: "Database write insertion failure.",
              error: dbError.message,
            });
          }
        }
      });
  } catch (error) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    if (!res.headersSent) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Server upload initialization failure.",
          error: error.message,
        });
    }
  }
};
// 2. GET /api/payroll/uploads — Fetch Global Batch Upload History Log

export const getPayrollUploads = async (req, res) => {
  try {
    const uploads = await BatchJob.find()
      .populate("uploadedBy", "first_name last_name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Batch jobs historical logs retrieved successfully.",
      count: uploads.length,
      data: uploads,
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Server error retrieving batch history.",
        error: error.message,
      });
  }
};
// 3. GET /api/payroll/uploads/:id/results — Query Batch Content via Window
export const getPayrollResultsByUploadId = async (req, res) => {
  try {
    const { id: batchJobId } = req.params;

    // Pedantic verification: intercept CastErrors gracefully before reaching MongoDB execution layer
    if (!mongoose.Types.ObjectId.isValid(batchJobId)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid batch job ID format supplied.",
        });
    }

    const targetJob = await BatchJob.findById(batchJobId);
    if (!targetJob) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Target batch job execution record not found.",
        });
    }


//
    const results = await TaxHistory.find({batchJobId}).populate("userId", "first_name last_name email").sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      message: "Target payroll calculations breakdown batch slice loaded.",
      count: results.length,
      data: results,
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Server error retrieving batch breakdown details.",
        error: error.message,
      });
  }
};
