import express from "express";
import {
  login,
  sign_up,
  refresh_token,
  forgot_password,
  reset_password,
  log_out,
} from "../controllers/auth_controller.js";

import { saveProfile, getProfile } from "../controllers/profile.controller.js";

import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

router.post("/sign_up", sign_up);
router.post("/login", login);
router.get("/refresh_token", authenticate, refresh_token);
router.post("/forgot_password", forgot_password);
router.post("/reset_password", reset_password);
router.post("/log_out", authenticate, log_out);
router.post("/save_profile", authenticate, saveProfile);
router.get("/profile", authenticate, getProfile);

export default router;
