import express from 'express';
import {
    calculate,
  getTaxRules,
  saveCalculation,
  getHistory,
  deleteHistory
} from "../controller/tax_controller.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.router();

router.post("/calculate", calculate);
router.get("/rules", getTaxRules);
router.post("/save", authMiddleware, saveCalculation);
router.get("/history", authMiddleware, getHistory);
router.delete("/history/:id", authMiddleware, deleteHistory);

export default router;


