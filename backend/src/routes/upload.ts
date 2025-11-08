import express from 'express';
import multer from 'multer';
import path from 'path';
import { uploadExcel } from '../controllers/uploadController';
import { logger } from '../utils/logger';

const router = express.Router();

// Sanitize filename to prevent path traversal attacks
const sanitizeFilename = (filename: string): string => {
  // Remove path separators and dangerous characters
  const sanitized = filename
    .replace(/[\/\\]/g, '') // Remove path separators
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/[<>:"|?*]/g, '') // Remove Windows reserved characters
    .trim();
  
  // Preserve original extension
  return sanitized || `${Date.now()}-upload`;
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const sanitized = sanitizeFilename(file.originalname);
    cb(null, `${Date.now()}-${sanitized}`);
  }
});

const upload = multer({ 
  storage,
  // No fileFilter - accept all file types
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit (increased significantly)
  }
});

// Error handler for multer errors (must be 4-parameter function)
const handleMulterError = (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const requestId = req.id || 'unknown';
  
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      logger.warn('File upload rejected: File too large', { requestId, maxSize: '500MB' });
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 500MB.'
      });
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      logger.warn('File upload rejected: Unexpected file field', { requestId });
      return res.status(400).json({
        success: false,
        error: 'File upload error. Please try again.'
      });
    }
    
    logger.error('Multer error', { requestId, error: err.message || 'Unknown multer error', code: err.code });
    return res.status(400).json({
      success: false,
      error: err.message || 'File upload failed. Please check the file and try again.'
    });
  }
  next();
};

// File upload endpoint with multer error handling
router.post('/', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
}, uploadExcel);

export default router;

