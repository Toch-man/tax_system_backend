import express from 'express';
import {
    calculate,
  getTaxRules,
  saveCalculation,
  getHistory,
  deleteHistory
} from "../controller/tax_controller.js";
import { authenticate } from "../middleware/auth.js";

const router = express.router();

router.post("/calculate", calculate);
router.get("/rules", getTaxRules);
router.post("/save", authenticate, saveCalculation);
router.get("/history", authenticate, getHistory);
router.delete("/history/:id", authenticate, deleteHistory);

export default router;

