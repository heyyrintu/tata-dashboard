import express from 'express';
import multer from 'multer';
import { uploadExcel } from '../controllers/uploadController';
import { requireCapability } from '../middleware/auth';

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

// ADMIN_TEAM_ID members only - deliberately NOT the same grant as seeing real
// carrier names. This endpoint truncates and repopulates the entire shipments
// table, and until per-user identity existed it was reachable by anything
// holding the shared API key, which every browser holds as VITE_API_KEY.
// The check runs BEFORE multer, so an unauthorised upload is rejected without
// writing the file to disk first.
router.post('/', requireCapability('upload'), upload.single('file'), uploadExcel);

export default router;
