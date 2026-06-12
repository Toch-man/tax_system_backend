import express from "express";

import {
  individualPdf,
  payrollCsv,
  payrollExcel,
  getUserReports,
} from "../controllers/report.controller.js";

import { downloadReport } from "../controllers/download.controller.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();
router.use(authenticate); // All routes require authentication

router.get("/individual/pdf", individualPdf);
router.post("/payroll/csv", payrollCsv);
router.post("/payroll/excel", payrollExcel);
router.get("/:id/download", downloadReport);
router.get("/", getUserReports);

export default router;

