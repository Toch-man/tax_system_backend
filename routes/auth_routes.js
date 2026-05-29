import express from "express";
import { register, login } from "../controller/auth_controller.js";

const router = express.Router();

router.post("/", register);
router.post("/", login);

export default router;
