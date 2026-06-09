import fsPromises from "fs/promises";
import path from "path";

import TaxHistory from "../models/taxHistory.js";
import BatchJob from "../models/batchJobModel.js";
import GeneratedReport from "../models/generatedReportsModel.js";

const REPORT_DIR = path.resolve("reports");

// Escape CSV values safely
const escapeCSV = (value) => {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);

  // If value contains comma, quote, or newline, wrap in quotes
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

export const generatePayrollCsv = async (batchJobId, userId) => {
  // Ensure reports directory exists
  await fsPromises.mkdir(REPORT_DIR, { recursive: true });

  // Validate batch job
  const batch = await BatchJob.findById(batchJobId);
  if (!batch) {
    throw new Error("Batch job not found");
  }

  // Fetch payroll records
  const records = await TaxHistory.find({ batchJobId }).populate(
    "userId",
    "first_name last_name email"
  );

  if (!records.length) {
    throw new Error("No payroll records found for this batch");
  }

  // Filter valid records
  const formatted = records
    .filter((record) => record.userId)
    .map((record) => ({
      name: `${record.userId.first_name} ${record.userId.last_name}`,
      email: record.userId.email,
      salary: record.input?.salary ?? 0,
      deductions: record.input?.deductions ?? 0,
      grossSalary: record.result?.grossSalary ?? 0,
      taxableIncome: record.result?.taxableIncome ?? 0,
      annualTax: record.result?.annualTax ?? 0,
      monthlyTax: record.result?.monthlyTax ?? 0,
      netSalary: record.result?.netSalary ?? 0,
    }));

  if (!formatted.length) {
    throw new Error("No valid employee records found");
  }

  // CSV Header
  const headers = [
    "Name",
    "Email",
    "Salary",
    "Deductions",
    "GrossSalary",
    "TaxableIncome",
    "AnnualTax",
    "MonthlyTax",
    "NetSalary",
  ];

  // Build CSV rows
  const rows = formatted.map((row) =>
    [
      escapeCSV(row.name),
      escapeCSV(row.email),
      escapeCSV(row.salary),
      escapeCSV(row.deductions),
      escapeCSV(row.grossSalary),
      escapeCSV(row.taxableIncome),
      escapeCSV(row.annualTax),
      escapeCSV(row.monthlyTax),
      escapeCSV(row.netSalary),
    ].join(",")
  );

  // Combine full CSV content
  const csvContent = [headers.join(","), ...rows].join("\n");

  // Create filename
  const fileName = `payroll-${batchJobId}-${Date.now()}.csv`;
  const filePath = path.join(REPORT_DIR, fileName);

  // Save file
  await fsPromises.writeFile(filePath, csvContent, "utf8");

  // Get file size
  const stats = await fsPromises.stat(filePath);

  // Save report record
  const report = await GeneratedReport.create({
    user: userId,
    batchJob: batchJobId,
    reportType: "payroll_csv",
    fileName,
    filePath,
    downloadPath: `/reports/${fileName}`,
    fileSize: stats.size,
    status: "completed",
  });

  return report;
};