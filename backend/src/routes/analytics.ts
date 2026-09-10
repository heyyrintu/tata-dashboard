import express from 'express';
import {
  dashboard,
  filterOptions,
  shipments,
  exportShipments,
} from '../controllers/shipmentAnalyticsController';
import { validate, validateAnalyticsQuery } from '../middleware/validation';

const router = express.Router();
const dateValidation = validate(validateAnalyticsQuery);

// Specific routes first; the catch-all must stay last.
router.get('/filters', filterOptions);
router.get('/shipments', dateValidation, shipments);
router.get('/export', dateValidation, exportShipments);
router.get('/', dateValidation, dashboard);

export default router;
