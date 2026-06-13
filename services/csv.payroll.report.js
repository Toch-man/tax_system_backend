import fsPromises from "fs/promises";
import path from "path";

import TaxHistory from "../models/taxHistory.js";
import BatchJob from "../models/batchJobModel.js";
import GeneratedReport from "../models/generatedReportsModel.js";

const REPORT_DIR = path.resolve("reports");

const escapeCSV = (value) => {
  if (value === null || value === undefined) return "";

  const stringValue = String(value);

  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

export const generatePayrollCsv = async (
  batchJobId,
  userId
) => {
  await fsPromises.mkdir(REPORT_DIR, {
    recursive: true,
  });

  const batch = await BatchJob.findById(
    batchJobId
  );

  if (!batch) {
    throw new Error("Batch job not found");
  }

  const records = await TaxHistory.find({
    batchJobId,
  }).populate(
    "userId",
    "first_name last_name email"
  );

  if (!records.length) {
    throw new Error(
      "No payroll records found for this batch"
    );
  }

  const formatted = records
    .filter((record) => record.userId)
    .map((record) => ({
      name: `${record.userId.first_name} ${record.userId.last_name}`,

      email: record.userId.email,

      annualGrossIncome:
        record.result?.annual?.grossIncome ?? 0,

      annualPension:
        record.result?.annual?.pension ?? 0,

      annualNHF:
        record.result?.annual?.nhf ?? 0,

      annualNHIS:
        record.result?.annual?.nhis ?? 0,

      annualLifeInsurance:
        record.result?.annual?.lifeInsurance ??
        0,

      annualMortgageInterest:
        record.result?.annual
          ?.mortgageInterest ?? 0,

      annualRentRelief:
        record.result?.annual?.rentRelief ?? 0,

      annualDeductions:
        record.result?.annual?.deductions ?? 0,

      annualTaxableIncome:
        record.result?.annual?.taxableIncome ??
        0,

      annualPAYE:
        record.result?.annual?.paye ?? 0,

      annualNetIncome:
        record.result?.annual?.netIncome ?? 0,

      monthlyGrossIncome:
        record.result?.monthly?.grossIncome ??
        0,

      monthlyPension:
        record.result?.monthly?.pension ?? 0,

      monthlyNHF:
        record.result?.monthly?.nhf ?? 0,

      monthlyNHIS:
        record.result?.monthly?.nhis ?? 0,

      monthlyLifeInsurance:
        record.result?.monthly?.lifeInsurance ??
        0,

      monthlyMortgageInterest:
        record.result?.monthly
          ?.mortgageInterest ?? 0,

      monthlyRentRelief:
        record.result?.monthly?.rentRelief ?? 0,

      monthlyDeductions:
        record.result?.monthly?.deductions ?? 0,

      monthlyTaxableIncome:
        record.result?.monthly?.taxableIncome ??
        0,

      monthlyPAYE:
        record.result?.monthly?.paye ?? 0,

      monthlyNetIncome:
        record.result?.monthly?.netIncome ?? 0,
    }));

  if (!formatted.length) {
    throw new Error(
      "No valid employee records found"
    );
  }

  const headers = [
    "Name",
    "Email",

    "AnnualGrossIncome",
    "AnnualPension",
    "AnnualNHF",
    "AnnualNHIS",
    "AnnualLifeInsurance",
    "AnnualMortgageInterest",
    "AnnualRentRelief",
    "AnnualDeductions",
    "AnnualTaxableIncome",
    "AnnualPAYE",
    "AnnualNetIncome",

    "MonthlyGrossIncome",
    "MonthlyPension",
    "MonthlyNHF",
    "MonthlyNHIS",
    "MonthlyLifeInsurance",
    "MonthlyMortgageInterest",
    "MonthlyRentRelief",
    "MonthlyDeductions",
    "MonthlyTaxableIncome",
    "MonthlyPAYE",
    "MonthlyNetIncome",
  ];

  const rows = formatted.map((row) =>
    [
      escapeCSV(row.name),
      escapeCSV(row.email),

      escapeCSV(row.annualGrossIncome),
      escapeCSV(row.annualPension),
      escapeCSV(row.annualNHF),
      escapeCSV(row.annualNHIS),
      escapeCSV(row.annualLifeInsurance),
      escapeCSV(row.annualMortgageInterest),
      escapeCSV(row.annualRentRelief),
      escapeCSV(row.annualDeductions),
      escapeCSV(row.annualTaxableIncome),
      escapeCSV(row.annualPAYE),
      escapeCSV(row.annualNetIncome),

      escapeCSV(row.monthlyGrossIncome),
      escapeCSV(row.monthlyPension),
      escapeCSV(row.monthlyNHF),
      escapeCSV(row.monthlyNHIS),
      escapeCSV(row.monthlyLifeInsurance),
      escapeCSV(row.monthlyMortgageInterest),
      escapeCSV(row.monthlyRentRelief),
      escapeCSV(row.monthlyDeductions),
      escapeCSV(row.monthlyTaxableIncome),
      escapeCSV(row.monthlyPAYE),
      escapeCSV(row.monthlyNetIncome),
    ].join(",")
  );

  const csvContent = [
    headers.join(","),
    ...rows,
  ].join("\n");

  const fileName = `payroll-${batchJobId}-${Date.now()}.csv`;

  const filePath = path.join(
    REPORT_DIR,
    fileName
  );

  try {
    await fsPromises.writeFile(
      filePath,
      csvContent,
      "utf8"
    );

    const stats = await fsPromises.stat(
      filePath
    );

    const report =
      await GeneratedReport.create({
        user: userId,
        batchJobId,
        reportType: "payroll_csv",
        fileName,
        filePath,
        fileSize: stats.size,
        status: "completed",
      });

    return report;
  } catch (error) {
    try {
      await fsPromises.unlink(filePath);
    } catch {}

    throw new Error(
      `Failed to generate payroll CSV report: ${error.message}`
    );
  }
};