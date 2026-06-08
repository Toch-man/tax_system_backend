import xlsx from "xlsx";
import path from "path";
import fsPromises from "fs/promises";

import TaxHistory from "../models/taxHistory.js";
import GeneratedReport from "../models/generatedReportsModel.js";

const REPORT_DIR = path.resolve("reports");

export const generatePayrollExcel = async (
  batchJobId,
  userId,
) => {
  // Ensure reports directory exists
  await fsPromises.mkdir(REPORT_DIR, {
    recursive: true,
  });

  // Fetch payroll data
  const records = await TaxHistory.find({
    batchJobId,
  })
    .populate(
      "userId",
      "first_name last_name email",
    )
    .lean();

  if (!records.length) {
    throw new Error(
      "No records found for this batch job",
    );
  }

  // Format Excel data
  const data = records
    .filter((r) => r.userId)
    .map((r) => ({
      Name: `${r.userId.first_name} ${r.userId.last_name}`,
      Email: r.userId.email,
      Salary: r.input?.salary ?? 0,
      Deductions: r.input?.deductions ?? 0,
      GrossSalary: r.result?.grossSalary ?? 0,
      TaxableIncome: r.result?.taxableIncome ?? 0,
      AnnualTax: r.result?.annualTax ?? 0,
      MonthlyTax: r.result?.monthlyTax ?? 0,
      NetSalary: r.result?.netSalary ?? 0,
    }));

  if (!data.length) {
    throw new Error("No valid payroll data found");
  }

  // Create workbook
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(data);

  xlsx.utils.book_append_sheet(
    wb,
    ws,
    "Payroll Report",
  );

  // Generate file name
  const fileName = `payroll-excel-${batchJobId}-${Date.now()}.xlsx`;

  const filePath = path.join(REPORT_DIR, fileName);

  // Write file
  xlsx.writeFile(wb, filePath);

  // Create DB record
  const report = await GeneratedReport.create({
    user: userId,
    batchJob: batchJobId,
    reportType: "payroll_excel",
    fileName,
    filePath,
    downloadPath: `/reports/${fileName}`,
    status: "completed",
  });

  return report;
};