import express from 'express';
import multer from 'multer';
import path from 'path';
import { uploadExcel } from '../controllers/uploadController';
import { authenticate } from '../middleware/auth';
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
  
  // Ensure it has a valid extension
  const ext = path.extname(sanitized).toLowerCase();
  if (!ext || !['.xlsx', '.xls'].includes(ext)) {
    return `${Date.now()}-upload${ext || '.xlsx'}`;
  }
  
  return sanitized;
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
  fileFilter: async (req, file, cb) => {
    try {
      const allowedExtensions = ['.xlsx', '.xls'];
      const ext = path.extname(file.originalname).toLowerCase();
      
      // Check extension first (quick check)
      if (!allowedExtensions.includes(ext)) {
        logger.warn('File upload rejected: Invalid extension', {
          filename: file.originalname,
          extension: ext,
          requestId: req.id
        });
        return cb(new Error('Invalid file type. Only Excel files (.xlsx, .xls) are allowed.'));
      }

      // Note: Actual MIME type validation happens after file is uploaded
      // in the controller using file-type library for better security
      cb(null, true);
    } catch (error) {
      logger.error('File filter error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: req.id
      });
      cb(new Error('Error validating file.'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit (increased from 10MB for large Excel files)
  }
});

// Apply authentication middleware
router.use(authenticate);

// File upload endpoint
router.post('/', upload.single('file'), uploadExcel);

export default router;

