import express from "express";
import {
  login,
  sign_up,
  refresh_token,
  forgot_password,
  reset_password,
  log_out,
  get_profile
} from "../controllers/auth_controller.js";

import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

router.post("/sign_up", sign_up);
router.post("/login", login);
router.get("/refresh_token", refresh_token);
router.post("/forgot_password", forgot_password);
router.post("/reset_password", reset_password);
router.post("/log_out", authenticate, log_out);
router.get("/profile", authenticate, get_profile);

export default router;
