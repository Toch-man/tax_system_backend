import PDFDocument from "pdfkit";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";

import SavedCalculation from "../models/savedCalculationModel.js";
import User from "../models/userModel.js";
import GeneratedReport from "../models/generatedReportsModel.js";

const REPORT_DIR = path.resolve("reports");

export const generateIndividualPdf = async (userId) => {
  await fsPromises.mkdir(REPORT_DIR, { recursive: true });

  const user = await User.findById(userId);

  if (!user) throw new Error("User not found");

  const records = await SavedCalculation.find({ userId }).sort({
    createdAt: -1,
  });

  if (!records.length) {
    throw new Error("No tax history found");
  }

  const fileName = `individual-${userId}-${Date.now()}.pdf`;
  const filePath = path.join(REPORT_DIR, fileName);

  const doc = new PDFDocument();
  const stream = fs.createWriteStream(filePath);

  doc.pipe(stream);

  // Header
  doc.fontSize(18).text("Tax Report", { align: "center" });
  doc.moveDown();

  // User info
  doc.fontSize(12).text(`Name: ${user.first_name} ${user.last_name}`);
  doc.text(`Email: ${user.email}`);
  doc.moveDown();

  // Records
  records.forEach((r, i) => {
    doc.fontSize(12).text(`Record ${i + 1}`);
    doc.text(`Gross Salary: ₦${r.annual?.salary ?? 0}`);
    doc.text(`Taxable Income: ₦${r.annual?.taxableIncome ?? 0}`);
    doc.text(`Annual Tax: ₦${r.annual?.taxBill ?? 0}`);
    doc.text(`Monthly Tax: ₦${r.monthly?.taxBill ?? 0}`);
    doc.text(`Net Salary: ₦${r.annual?.netSalary ?? 0}`);
    doc.moveDown();
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