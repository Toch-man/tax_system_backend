import { express } from "express";
import cors from 'cors';
import taxRoutes from "./routes/tax_routes.js";

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// mongodb connection

// routes
app.use("/tax", taxRoutes);

export default app;
