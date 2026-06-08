import express from "express";
import cors from "cors";
import morgan from "morgan"; 

import auth_routes from "./routes/auth_routes.js";
import tax_routes from "./routes/tax_routes.js";
import payroll_routes from "./routes/payroll_routes.js";
import report_routes from "./routes/report_routes.js";
import admin_routes from "./routes/admin_routes.js";


const app = express();

app.use(cors());

app.use(express.json());

app.use(morgan("dev")); // For logging HTTP requests

app.use("/api/auth", auth_routes);
app.use("/api/tax", tax_routes);
app.use("/api/payroll", payroll_routes);
app.use("/api/reports", report_routes);
app.use("/api/admin", admin_routes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Tax API Running"
  });
});

export default app;