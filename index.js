import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import report_routes from './routes/report_routes.js';
import auth_routes from './routes/auth_routes.js';
import payroll_routes from './routes/payroll_routes.js';
import tax_routes from './routes/tax_routes.js'
dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/reports' , report_routes);
app.use('/api/auth' , auth_routes);
app.use('/api/payroll' , payroll_routes);
app.use('/api/tax' , tax_routes);

app.get('/', (req, res) => {
  res.send('Hello World')
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
});