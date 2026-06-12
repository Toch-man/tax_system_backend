import xlsx from "xlsx";
import path from "path";
import fsPromises from "fs/promises";

import TaxHistory from "../models/taxHistory.js";
import GeneratedReport from "../models/generatedReportsModel.js";

const REPORT_DIR = path.resolve("reports");

export const generatePayrollExcel = async (batchJobId, userId) => {
  // Ensure reports directory exists
  await fsPromises.mkdir(REPORT_DIR, { recursive: true });

  // Fetch payroll data
  const records = await TaxHistory.find({ batchJobId })
    .populate("userId", "first_name last_name email")
    .lean();

  if (!records.length) {
    throw new Error("No records found for this batch job");
  }

  // Transform data
  const data = records
    .filter((r) => r.userId && r.userId.email)
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
  const workbook = xlsx.utils.book_new();

  const worksheet = xlsx.utils.json_to_sheet(data, {
    header: [
      "Name",
      "Email",
      "Salary",
      "Deductions",
      "GrossSalary",
      "TaxableIncome",
      "AnnualTax",
      "MonthlyTax",
      "NetSalary",
    ],
  });

  // Auto column width improvement
  const colWidths = Object.keys(data[0]).map((key) => ({
    wch: Math.max(
      key.length,
      ...data.map((row) => String(row[key] ?? "").length)
    ),
  }));

  worksheet["!cols"] = colWidths; // Set column widths

  xlsx.utils.book_append_sheet(workbook, worksheet, "Payroll Report");

  // File name
  const fileName = `payroll-excel-${batchJobId}-${Date.now()}.xlsx`;
  const filePath = path.join(REPORT_DIR, fileName);

  // Write file
  try {
    xlsx.writeFile(workbook, filePath);
    // Get file stats
    const stats = await fsPromises.stat(filePath);

    // Save DB record
    const report = await GeneratedReport.create({
      user: userId,
      batchJobId,
      reportType: "payroll_excel",
      fileName,
      filePath,
      fileSize: stats.size,
      status: "completed",
    });

    return report;
  } catch (error) {
    if (await fsPromises.access(filePath).then(() => true).catch(() => false)) {
      await fsPromises.unlink(filePath);
    }
    throw error;
  }
};