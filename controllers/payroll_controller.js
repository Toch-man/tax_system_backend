import fs from 'fs';
import csv from 'csv-parser';
import mongoose from 'mongoose';
import BatchJob from '../models/batchJobModel.js';
import TaxHistory from '../models/batchJobModel.js';
import TaxRule from '../models/taxRuleModel.js';
import User from '../models/userModel.js';
import { calculateTax } from '../services/taxEngine.service.js';

// 1. POST /api/payroll/upload — Stream, Calculate, and Bulk Insert Payroll
export const uploadPayroll = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Please upload a CSV file.' });
    }

    const filePath = req.file.path;
    let currentUpload;
    let streamFailed = false;

    try {
        // A. Fetch and validate active tax rules configuration
        const activeTaxRule = await TaxRule.findOne({ active: true });
        if (!activeTaxRule || !Array.isArray(activeTaxRule.bands)) {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return res.status(400).json({ 
                success: false,
                message: 'Processing aborted. Active tax rules configuration is missing or invalid in the database.' 
            });
        }

        // B. Pre-fetch users into an in-memory cache map for high-speed lookups
        const databaseUsers = await User.find({}, 'email _id');
        const userCacheMap = new Map(
            databaseUsers.map(user => [
                (user.email || '').toLowerCase().trim(), 
                user._id
            ])
        );

        // C. Initialize parent batch tracking state using strict schema enums
        currentUpload = await BatchJob.create({
            fileName: req.file.originalname,
            status: 'processing', 
            uploadedBy: req.user?._id || req.user?.user_id || null,
            resultCount: 0
        });

        const historyRecordsToInsert = [];
        
        // D. Create file read stream applying case-insensitive header mapping transformation
        const fileStream = fs.createReadStream(filePath).pipe(
            csv({
                mapHeaders: ({ header }) => (header || '').toLowerCase().trim()
            })
        );

        fileStream
            .on('data', (row) => {
                try {
                    // Normalize lookup parameters safely
                    const rowEmail = (row.email || '').toLowerCase().trim();
                    const matchedUserId = userCacheMap.get(rowEmail) || null;

                    // Parse inputs defensively; guard against non-numeric values (NaN) or negative numbers
                    const rawSalary = parseFloat(row.salary);
                    const rawDeductions = parseFloat(row.deductions);
                    
                    const salaryInput = isNaN(rawSalary) || rawSalary < 0 ? 0 : rawSalary;
                    const deductionsInput = isNaN(rawDeductions) || rawDeductions < 0 ? 0 : rawDeductions;

                    // Execute team math logic utility function synchronously
                    const taxBreakdown = calculateTax({
                        salary: salaryInput,
                        deductions: deductionsInput,
                        rules: activeTaxRule
                    });

                    // Construct item body matching the exact structural nesting of historySchema
                    historyRecordsToInsert.push({
                        userId: matchedUserId,
                        input: {
                            salary: salaryInput,
                            deductions: deductionsInput
                        },
                        result: {
                            grossSalary: taxBreakdown.grossSalary,
                            taxableIncome: taxBreakdown.taxableIncome,
                            annualTax: taxBreakdown.tax,
                            monthlyTax: Number((taxBreakdown.tax / 12).toFixed(2)),
                            netSalary: taxBreakdown.netSalary
                        }
                    });
                } catch (calcError) {
                    fileStream.destroy(calcError);
                }
            })
            .on('error', async (error) => {
                streamFailed = true;
                
                try {
                    if (currentUpload) {
                        currentUpload.status = 'failed';
                        await currentUpload.save();
                    }
                } catch (dbSaveError) {
                    console.error('Failed to log job failure status:', dbSaveError.message);
                }

                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

                if (!res.headersSent) {
                    return res.status(500).json({
                        success: false,
                        message: 'Error processing batch payroll file rows.',
                        error: error.message
                    });
                }
            })
            .on('end', async () => {
                // Prevent executing execution block if error event caught it first
                if (streamFailed) return;

                try {
                    // Execute high-performance atomic write operation if array contains records
                    if (historyRecordsToInsert.length > 0) {
                        await TaxHistory.insertMany(historyRecordsToInsert);
                    }

                    // Complete parent document update cycle safely
                    currentUpload.status = 'completed';
                    currentUpload.resultCount = historyRecordsToInsert.length;
                    await currentUpload.save();

                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

                    if (!res.headersSent) {
                        return res.status(201).json({
                            success: true,
                            message: 'Batch payroll processed and logged successfully.',
                            batchJobId: currentUpload._id,
                            totalProcessed: historyRecordsToInsert.length
                        });
                    }
                } catch (dbError) {
                    try {
                        if (currentUpload) {
                            currentUpload.status = 'failed';
                            await currentUpload.save();
                        }
                    } catch (dbSaveError) {
                        console.error('Failed to update job status following write failure:', dbSaveError.message);
                    }

                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

                    if (!res.headersSent) {
                        return res.status(500).json({ 
                            success: false,
                            message: 'Database write insertion failure.', 
                            error: dbError.message 
                        });
                    }
                }
            });

    } catch (error) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        if (!res.headersSent) {
            return res.status(500).json({ success: false, message: 'Server upload initialization failure.', error: error.message });
        }
    }
};
// 2. GET /api/payroll/uploads — Fetch Global Batch Upload History Log

export const getPayrollUploads = async (req, res) => {
    try {
        const uploads = await BatchJob.find()
            .populate('uploadedBy', 'first_name last_name email')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: 'Batch jobs historical logs retrieved successfully.',
            count: uploads.length,
            data: uploads
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error retrieving batch history.', error: error.message });
    }
};
// 3. GET /api/payroll/uploads/:id/results — Query Batch Content via Window
export const getPayrollResultsByUploadId = async (req, res) => {
    try {
        const batchJobId = req.params.id;

        // Pedantic verification: intercept CastErrors gracefully before reaching MongoDB execution layer
        if (!mongoose.Types.ObjectId.isValid(batchJobId)) {
            return res.status(400).json({ success: false, message: 'Invalid batch job ID format supplied.' });
        }

        const targetJob = await BatchJob.findById(batchJobId);
        if (!targetJob) {
            return res.status(404).json({ success: false, message: 'Target batch job execution record not found.' });
        }

        // Isolate processing window block boundaries mathematically
        const windowStart = new Date(new Date(targetJob.createdAt).getTime() - 2000); 
        const windowEnd = new Date(new Date(targetJob.updatedAt).getTime() + 2000);

        const results = await TaxHistory.find({
            createdAt: { $gte: windowStart, $lte: windowEnd }
        }).populate('userId', 'first_name last_name email');

        return res.status(200).json({
            success: true,
            message: 'Target payroll calculations breakdown batch slice loaded.',
            count: results.length,
            data: results
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error retrieving batch breakdown details.', error: error.message });
    }
};