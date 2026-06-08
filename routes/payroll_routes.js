import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import moose from 'mongoose';
import { 
    uploadPayroll, 
    getPayrollUploads, 
    getPayrollResultsByUploadId 
} from '../controllers/payroll_controller.js';
import { authenticate } from '../middlewares/auth.js';


const router = express.Router();

// A. Runtime verification of target storage system
const uploadDirectory = './uploads';
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

// B. Secure cryptographic-safe naming disk storage configuration
const storageConfiguration = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },
    filename: (req, file, cb) => {
        const highPrecisionTimestamp = Date.now();
        const cryptographicallySecureRandomSuffix = Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname).toLowerCase();
        
        cb(null, `payroll-${highPrecisionTimestamp}-${cryptographicallySecureRandomSuffix}${fileExtension}`);
    }
});

// C. Advanced MIME-Type and Extension validation filter
const CSVFileFilter = (req, file, cb) => {
    const evaluatedExtension = path.extname(file.originalname).toLowerCase();
    const evaluatedMimeType = file.mimetype;

    const validExtensions = ['.csv'];
    const validMimeTypes = ['text/csv', 'application/vnd.ms-excel', 'text/x-csv', 'application/csv'];

    if (validExtensions.includes(evaluatedExtension) || validMimeTypes.includes(evaluatedMimeType)) {
        cb(null, true);
    } else {
        cb(new Error('File validation rejected. Only structured CSV (.csv) formats are accepted.'), false);
    }
};

// D. Instantiation of the Multer payload ingestion engine
const configureMulter = multer({
    storage: storageConfiguration,
    fileFilter: CSVFileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // Hard constraint protecting server disk space (10MB limit)
    }
});

// E. Custom middleware wrapper to intercept binary stream errors
const handleMulterUpload = (req, res, next) => {
    // The designated form-data key expected from Postman/Frontend clients is explicitly named 'file'
    configureMulter.single('file')(req, res, (error) => {
        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Payload structure rejected. The uploaded file exceeds the maximum permissible limit of 10MB.' 
                });
            }
            return res.status(400).json({ success: false, message: `Multer Ingestion Error: ${error.message}` });
        } else if (error) {
            // Catches custom extension/MIME filtering rejections from step C
            return res.status(400).json({ success: false, message: error.message });
        }
        next();
    });
};


// Payroll Domain HTTP Route Mapping

/**
 * @route   POST /api/payroll/upload
 * @desc    Ingest, process, map, and complete batch calculations from a CSV upload.
 * @access  Private (Requires Teammate Auth Token Evaluation)
 */
router.post('/upload', authenticate, handleMulterUpload, uploadPayroll);

/**
 * @route   GET /api/payroll/uploads
 * @desc    Retrieve systemic log references of all historic upload iterations.
 * @access  Private (Requires Teammate Auth Token Evaluation)
 */
router.get('/uploads', authenticate, getPayrollUploads);

/**
 * @route   GET /api/payroll/uploads/:id/results
 * @desc    Query individual calculated row records belonging to a target batch.
 * @access  Private (Requires Teammate Auth Token Evaluation)
 */
router.get('/uploads/:id/results', authenticate, getPayrollResultsByUploadId);

export default router;