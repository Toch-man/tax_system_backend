import express from "express";
import * as auth_controller from "../controller/auth_controller.js";

const router = express.Router();

router.post("/sign_up", auth_controller.sign_up);
router.post("/login", auth_controller.login);
router.get("/refresh_token", auth_controller.refresh_token);
router.post("/forgot_password", auth_controller.forgot_password);
router.post("/reset_password", auth_controller.reset_password);
router.post("/log_out", auth_controller.log_out);

export default router;
