import { express } from "express";

const app = express();

//mongodb connection




import router from "./routes/report.routes.js";
app.use("/api/reports", router);