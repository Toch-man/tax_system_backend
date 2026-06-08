import PDFDocument from "pdfkit";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";

import TaxHistory from "../models/taxHistory.js";
import User from "../models/userModel.js";
import GeneratedReport from "../models/generatedReportsModel.js";

const REPORT_DIR = path.resolve("reports");

export const generateIndividualPdf = async (userId) => {
  // Ensure reports folder exists
  await fsPromises.mkdir(REPORT_DIR, { recursive: true });

  // Get user details
  const user = await User.findById(userId);

  // Get tax history (latest first)
  const records = await TaxHistory.find({ userId }).sort({
    createdAt: -1,
  });

  // Validate user
  if (!user) throw new Error("User not found");

  // Validate records
  if (!records.length) {
    throw new Error("No tax history found");
  }

  // Generate unique file name
  const fileName = `individual-${userId}-${Date.now()}.pdf`;

  const filePath = path.join(REPORT_DIR, fileName);

  // Create PDF document
  const doc = new PDFDocument();

  // Create write stream
  const stream = fs.createWriteStream(filePath);

  doc.pipe(stream);

  // Header
  doc.fontSize(18).text("Tax Report", { align: "center" });
  doc.moveDown();

  // User info
  doc.fontSize(12).text(`Name: ${user.first_name} ${user.last_name}`);
  doc.text(`Email: ${user.email}`);
  doc.moveDown();

  // Tax records
  records.forEach((r, i) => {
    doc.fontSize(12).text(`Record ${i + 1}`);
    doc.text(`Gross Salary: ₦${r.result?.grossSalary ?? 0}`);
    doc.text(`Taxable Income: ₦${r.result?.taxableIncome ?? 0}`);
    doc.text(`Annual Tax: ₦${r.result?.annualTax ?? 0}`);
    doc.text(`Monthly Tax: ₦${r.result?.monthlyTax ?? 0}`);
    doc.text(`Net Salary: ₦${r.result?.netSalary ?? 0}`);
    doc.moveDown();
  });

  doc.end();

  // Wait for file to finish writing
  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  // Save report metadata
  const report = await GeneratedReport.create({
    user: userId,
    reportType: "individual_pdf",
    fileName,
    filePath,
    downloadPath: `/reports/${fileName}`,
    status: "completed",
  });

  return report;
};