import { express } from "express";
import cors from 'cors';
import taxRoutes from "./routes/tax_routes.js";

const app = express();




import router from "./routes/report.routes.js";
app.use("/api/reports", router);
