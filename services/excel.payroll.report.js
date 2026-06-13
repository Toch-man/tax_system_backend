import xlsx from "xlsx";
import path from "path";
import fsPromises from "fs/promises";

import TaxHistory from "../models/taxHistoryModel.js";
import GeneratedReport from "../models/generatedReportsModel.js";

const REPORT_DIR = path.resolve("reports");

export const generatePayrollExcel = async (
  batchJobId,
  userId
) => {
  await fsPromises.mkdir(REPORT_DIR, {
    recursive: true,
  });

  const records = await TaxHistory.find({
    batchJobId,
  })
    .populate(
      "userId",
      "first_name last_name email"
    )
    .lean();

  if (!records.length) {
    throw new Error(
      "No records found for this batch job"
    );
  }

  const data = records
    .filter((record) => record.userId)
    .map((record) => ({
      Name: `${record.userId.first_name} ${record.userId.last_name}`,

      Email: record.userId.email,

      AnnualGrossIncome:
        record.result?.annual?.grossIncome ?? 0,

      AnnualPension:
        record.result?.annual?.pension ?? 0,

      AnnualNHF:
        record.result?.annual?.nhf ?? 0,

      AnnualNHIS:
        record.result?.annual?.nhis ?? 0,

      AnnualLifeInsurance:
        record.result?.annual?.lifeInsurance ?? 0,

      AnnualMortgageInterest:
        record.result?.annual?.mortgageInterest ?? 0,

      AnnualRentRelief:
        record.result?.annual?.rentRelief ?? 0,

      AnnualDeductions:
        record.result?.annual?.deductions ?? 0,

      AnnualTaxableIncome:
        record.result?.annual?.taxableIncome ?? 0,

      AnnualPAYE:
        record.result?.annual?.paye ?? 0,

      AnnualNetIncome:
        record.result?.annual?.netIncome ?? 0,

      MonthlyGrossIncome:
        record.result?.monthly?.grossIncome ?? 0,

      MonthlyPension:
        record.result?.monthly?.pension ?? 0,

      MonthlyNHF:
        record.result?.monthly?.nhf ?? 0,

      MonthlyNHIS:
        record.result?.monthly?.nhis ?? 0,

      MonthlyLifeInsurance:
        record.result?.monthly?.lifeInsurance ?? 0,

      MonthlyMortgageInterest:
        record.result?.monthly?.mortgageInterest ?? 0,

      MonthlyRentRelief:
        record.result?.monthly?.rentRelief ?? 0,

      MonthlyDeductions:
        record.result?.monthly?.deductions ?? 0,

      MonthlyTaxableIncome:
        record.result?.monthly?.taxableIncome ?? 0,

      MonthlyPAYE:
        record.result?.monthly?.paye ?? 0,

      MonthlyNetIncome:
        record.result?.monthly?.netIncome ?? 0,
    }));

  if (!data.length) {
    throw new Error(
      "No valid payroll data found"
    );
  }

  const workbook = xlsx.utils.book_new();

  const worksheet =
    xlsx.utils.json_to_sheet(data, {
      header: [
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
      ],
    });

  const colWidths = Object.keys(data[0]).map(
    (key) => ({
      wch: Math.max(
        key.length,
        ...data.map((row) =>
          String(row[key] ?? "").length
        )
      ),
    })
  );

  worksheet["!cols"] = colWidths;

  xlsx.utils.book_append_sheet(
    workbook,
    worksheet,
    "Payroll Report"
  );

  const fileName = `payroll-batch-${batchJobId}-${Date.now()}.xlsx`;

  const filePath = path.join(
    REPORT_DIR,
    fileName
  );

  try {
    xlsx.writeFile(workbook, filePath);

    const stats = await fsPromises.stat(
      filePath
    );

    const report =
      await GeneratedReport.create({
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
    const fileExists = await fsPromises
      .access(filePath)
      .then(() => true)
      .catch(() => false);

    if (fileExists) {
      await fsPromises.unlink(filePath);
    }

    throw error;
  }
};