import express from "express";

import {
  getUsers,
  updateUserRole,
  createTaxRule,
  updateTaxRule,
} from "../controllers/admin.controller.js";

import { authenticate } from "../middlewares/auth.js";
import { authorise } from "../middlewares/role_guard.js";
const router = express.Router();

router.use(authenticate); // All routes in this router require authentication
router.use(authorise("admin")); // Only users with the "admin" role can access these routes

router.get("/users", getUsers); // GET /admin/users - Retrieve a list of all users with their roles
router.patch("/users/:id/role", updateUserRole); // PATCH /admin/users/:id/role - Update a user's role (e.g., user, admin, accountant)
router.post("/tax-rules", createTaxRule); // POST /admin/tax-rules - Create a new tax rule
router.patch("/tax-rules/:id", updateTaxRule); // PATCH /admin/tax-rules/:id - Update an existing tax rule

export default router;
