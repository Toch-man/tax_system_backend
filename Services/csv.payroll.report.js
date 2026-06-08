import xlsx from "xlsx";
import fsPromises from "fs/promises";
import path from "path";

import TaxHistory from "../model/taxHistory.js";
import BatchJob from "../model/batchJobModel.js";
import GeneratedReport from "../model/generated.reports.model.js";

const REPORT_DIR = path.resolve("reports");

export const generatePayrollCsv = async (
  batchJobId,
  userId,
) => {
  // Ensure reports directory exists
  await fsPromises.mkdir(REPORT_DIR, {
    recursive: true,
  });

  // Validate batch
  const batch = await BatchJob.findById(batchJobId);

  if (!batch) {
    throw new Error("Batch job not found");
  }

  // Fetch payroll records
  const records = await TaxHistory.find({
    batchJobId,
  }).populate(
    "userId",
    "first_name last_name email",
  );

  if (!records.length) {
    throw new Error(
      "No payroll records found for this batch",
    );
  }

  // Prepare CSV rows
  const formatted = records
    .filter((record) => record.userId)
    .map((record) => ({
      Name: `${record.userId.first_name} ${record.userId.last_name}`,
      Email: record.userId.email,
      Salary: record.input?.salary ?? 0,
      Deductions: record.input?.deductions ?? 0,
      GrossSalary: record.result?.grossSalary ?? 0,
      TaxableIncome: record.result?.taxableIncome ?? 0,
      AnnualTax: record.result?.annualTax ?? 0,
      MonthlyTax: record.result?.monthlyTax ?? 0,
      NetSalary: record.result?.netSalary ?? 0,
    }));

  if (!formatted.length) {
    throw new Error(
      "No valid employee records found"
    );
  }

  // Convert to worksheet
  const worksheet =
    xlsx.utils.json_to_sheet(formatted);

  const csvData =
    xlsx.utils.sheet_to_csv(worksheet);

  // Create filename
  const fileName = `payroll-${batchJobId}-${Date.now()}.csv`;

  const filePath = path.join(
    REPORT_DIR,
    fileName,
  );

  // Save file
  await fsPromises.writeFile(
    filePath,
    csvData,
    "utf8",
  );

  // Get file size
  const stats = await fsPromises.stat(
    filePath,
  );

  // Create DB record
  const report =
    await GeneratedReport.create({
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