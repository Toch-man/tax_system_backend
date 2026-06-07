import express from "express";

import {
  individualPdf,
  payrollCsv,
  payrollExcel,
} from "../controller/report.controller.js";

import { downloadReport } from "../controller/download.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.get("/individual/pdf", authenticate, individualPdf);
router.post("/payroll/csv", authenticate, payrollCsv);
router.post("/payroll/excel", authenticate, payrollExcel);
router.get("/:id/download", authenticate, downloadReport);

export default router;

