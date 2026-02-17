import express from 'express';
import multer from 'multer';
import { uploadExcel } from '../controllers/uploadController';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (_req, file, cb) => {
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${sanitized}`);
  }
});

const allowedMimeTypes = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
];

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = ['.xlsx', '.xls'];
    const ext = file.originalname.substring(file.originalname.lastIndexOf('.'));

    if (!allowedExtensions.includes(ext.toLowerCase())) {
      return cb(new Error('Invalid file type. Only Excel files (.xlsx, .xls) are allowed.'));
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid MIME type. Only Excel files are allowed.'));
    }

    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

router.post('/', upload.single('file'), uploadExcel);

export default router;
