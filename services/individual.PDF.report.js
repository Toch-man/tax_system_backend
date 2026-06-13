import PDFDocument from "pdfkit";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";

import SavedCalculation from "../models/savedCalculationModel.js";
import User from "../models/userModel.js";
import GeneratedReport from "../models/generatedReportsModel.js";

const REPORT_DIR = path.resolve("reports");

const formatCurrency = (value = 0) =>
  `NGN${Number(value).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const generateIndividualPdf = async (userId) => {
  await fsPromises.mkdir(REPORT_DIR, { recursive: true });

  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  const records = await SavedCalculation.find({
    userId,
  }).sort({
    createdAt: -1,
  });

  if (!records.length) {
    throw new Error("No tax history found");
  }

  const fileName = `individual-${userId}-${Date.now()}.pdf`;
  const filePath = path.join(REPORT_DIR, fileName);

  const doc = new PDFDocument({
    margin: 50,
  });

  const stream = fs.createWriteStream(filePath);

  doc.pipe(stream);

  // =========================
  // HEADER
  // =========================

  doc
    .fontSize(20)
    .text("Nigeria Tax Report", {
      align: "center",
    });

  doc.moveDown();

  doc
    .fontSize(12)
    .text(`Name: ${user.first_name} ${user.last_name}`);

  doc.text(`Email: ${user.email}`);

  doc.text(
    `Generated: ${new Date().toLocaleDateString()}`
  );

  doc.moveDown(2);

  // =========================
  // CALCULATIONS
  // =========================

  records.forEach((record, index) => {
    const annual = record.annual || {};
    const monthly = record.monthly || {};

    doc
      .fontSize(14)
      .text(`Calculation ${index + 1}`, {
        underline: true,
      });

    doc.moveDown(0.5);

    doc.fontSize(11);

    doc.text(`Title: ${record.title}`);

    doc.text(
      `Created: ${new Date(
        record.createdAt
      ).toLocaleString()}`
    );

    doc.moveDown();

    // Annual Summary
    doc.fontSize(12).text("Annual Summary");

    doc.text(
      `Gross Income: ${formatCurrency(
        annual.grossIncome
      )}`
    );

    doc.text(
      `Pension: ${formatCurrency(
        annual.pension
      )}`
    );

    doc.text(
      `NHF: ${formatCurrency(
        annual.nhf
      )}`
    );

    doc.text(
      `NHIS: ${formatCurrency(
        annual.nhis
      )}`
    );

    doc.text(
      `Life Insurance: ${formatCurrency(
        annual.lifeInsurance
      )}`
    );

    doc.text(
      `Mortgage Interest: ${formatCurrency(
        annual.mortgageInterest
      )}`
    );

    doc.text(
      `Rent Relief: ${formatCurrency(
        annual.rentRelief
      )}`
    );

    doc.text(
      `Total Deductions: ${formatCurrency(
        annual.deductions
      )}`
    );

    doc.text(
      `Taxable Income: ${formatCurrency(
        annual.taxableIncome
      )}`
    );

    doc.text(
      `PAYE: ${formatCurrency(
        annual.paye
      )}`
    );

    doc.text(
      `Net Income: ${formatCurrency(
        annual.netIncome
      )}`
    );

    doc.moveDown();

    // Monthly Summary
    doc.fontSize(12).text("Monthly Summary");

    doc.text(
      `Gross Income: ${formatCurrency(
        monthly.grossIncome
      )}`
    );

    doc.text(
      `Pension: ${formatCurrency(
        monthly.pension
      )}`
    );

    doc.text(
      `PAYE: ${formatCurrency(
        monthly.paye
      )}`
    );

    doc.text(
      `Net Income: ${formatCurrency(
        monthly.netIncome
      )}`
    );

    doc.moveDown();

    // Tax Breakdown
    if (record.taxBreakdown?.length) {
      doc.fontSize(12).text("Tax Breakdown");

      record.taxBreakdown.forEach((band) => {
        doc.text(
          `${band.rate} | Taxable: ${formatCurrency(
            band.taxableAmount
          )} | Tax: ${formatCurrency(
            band.taxGenerated
          )}`
        );
      });
    }

    doc.moveDown(2);

    // Prevent overflow
    if (index < records.length - 1) {
      doc.addPage();
    }
  });

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  const stats = await fsPromises.stat(filePath);

  const report = await GeneratedReport.create({
    user: userId,
    reportType: "individual_pdf",
    fileName,
    filePath,
    fileSize: stats.size,
    status: "completed",
  });

  return report;
};