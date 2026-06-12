# TaxEase API

A Node.js, Express, and MongoDB backend system for managing tax calculations, payroll processing, and automated report generation (CSV, Excel, PDF).

---

## Features

### Authentication & Authorisation
- User SignUp
- User Login
- User LogOut
- User Forgot Password
- User Reset Password
- JWT Authentication
- Role-Based Access Control (RBAC)

### Tax Management
- PAYE tax calculation
- Tax history tracking
- Save and retrieve calculations

### Payroll Processing
- Batch payroll processing
- Tax computation per employee
- Bulk data handling

### Report Generation
- Individual tax reports (PDF)
- Payroll reports (CSV)
- Payroll reports (Excel)

### File Handling
- File uploads using Multer
- Cloud storage integration with Cloudinary

### Logging
- HTTP request logging using Morgan

---

## Tech Stack

### Backend
- Node.js
- Express.js

### Database
- MongoDB
- Mongoose

### Authentication
- JSON Web Token (JWT)
- bcrypt

### File Upload & Storage
- Multer
- Cloudinary

### Data Processing
- xlsx
- csv-parser

### Report Generation
- PDFKit

### Email & Notifications
- Resend

### Logging
- Morgan

### Utilities
- dotenv
- cors

---

## Project Structure

```text
├── config/
├── controllers/
├── middlewares/
├── models/
├── routes/
├── services/
├── app.js
└── index.js
```

---

## Installation

### Clone Repository
```bash
git clone <repository-url>
cd tax-system-backend
```

### Install Dependencies
```bash
npm install
```

### Environment Variables
Create a `.env` file:

---

## Running the Project

### Production
```bash
npm start
```

---

## API Endpoints

### Authentication

```http
POST /api/auth/sign_up
POST /api/auth/login
GET  /api/auth/refresh_token
POST /api/auth/forgot_password
POST /api/auth/reset_password
POST /api/auth/log_out
GET  /api/auth/get_profile
```

---

### Tax

```http
POST /api/tax/calculate
GET  /api/tax/history
GET  /api/tax/rules
POST /api/tax/save
DELETE /api/tax/history/:id 
```

---

### Payroll

```http
POST /api/payroll/upload
GET /api/payroll/uploads
GET /api/payroll/uploads/:id/results


```

---

### Reports

```http
GET /api/reports/individual/pdf
POST /api/reports/payroll/csv
POST /api/reports/payroll/excel
GET /api/reports/:id/download
GET /api/reports
```

---

### Admin
```http
GET /api/admin/users
PATCH /api/admin/users/:id/role
POST /api/admin/tax-rules
PATCH /api/admin/tax-rules/:id
```

---

## Security Features
- Password hashing with bcrypt
- JWT token authentication
- Protected routes middleware
- Input validation
- Secure file handling

---
## Notes
- Authentication middleware is applied only on protected routes
- Login and registration routes are public
- Reports are generated and stored in `/reports` directory

---

## Author
Backend Team : Capstone 18 TaxEase Project
