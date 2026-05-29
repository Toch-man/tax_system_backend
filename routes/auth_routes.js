import express from "express";
import {
  login,
  sign_up,
  refresh_token,
} from "../controller/auth_controller.js";

const router = express.Router();

router.post("/sign_up", sign_up);
router.post("/login", login);
router.get("/refresh_token", refresh_token);

export default router;
