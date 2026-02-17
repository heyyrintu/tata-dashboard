import express from 'express';
import {
  getAnalytics,
  getRangeWiseAnalytics,
  getFulfillmentAnalytics,
  getLoadOverTime,
  getRevenueAnalytics,
  getCostAnalytics,
  getProfitLossAnalytics,
  getMonthOnMonthAnalytics,
  getVehicleCostAnalytics,
  getMonthlyVehicleCostAnalytics,
  getMonthlyMarketVehicleRevenue,
  exportMissingIndents,
  getLatestIndentDate
} from '../controllers/analyticsController';
import { exportAllIndentsToExcel } from '../controllers/exportController';
import { debugCalculations } from '../controllers/debugController';
import { validate, validateAnalyticsQuery } from '../middleware/validation';

const router = express.Router();

// Apply date validation to all analytics routes
const analyticsValidation = validate(validateAnalyticsQuery);

// Export routes (registered first to avoid conflicts with catch-all)
router.get('/export-all', analyticsValidation, exportAllIndentsToExcel);
router.get('/fulfillment/export-missing', analyticsValidation, exportMissingIndents);

// Analytics routes
router.get('/range-wise', analyticsValidation, getRangeWiseAnalytics);
router.get('/fulfillment', analyticsValidation, getFulfillmentAnalytics);
router.get('/load-over-time', analyticsValidation, getLoadOverTime);
router.get('/revenue', analyticsValidation, getRevenueAnalytics);
router.get('/cost', analyticsValidation, getCostAnalytics);
router.get('/profit-loss', analyticsValidation, getProfitLossAnalytics);
router.get('/vehicle-cost', getVehicleCostAnalytics);
router.get('/vehicle-cost/monthly', analyticsValidation, getMonthlyVehicleCostAnalytics);
router.get('/market-vehicle/revenue/monthly', analyticsValidation, getMonthlyMarketVehicleRevenue);
router.get('/month-on-month', analyticsValidation, getMonthOnMonthAnalytics);
router.get('/latest-indent-date', getLatestIndentDate);

// Debug route (development only — full table scan)
if (process.env.NODE_ENV !== 'production') {
  router.get('/debug/calculations', debugCalculations);
}

// Catch-all route - MUST be LAST
router.get('/', analyticsValidation, getAnalytics);

export default router;
