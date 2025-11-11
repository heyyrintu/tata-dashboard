import express from 'express';
import { getAnalytics, getRangeWiseAnalytics, getFulfillmentAnalytics, getLoadOverTime, getRevenueAnalytics, getCostAnalytics, getProfitLossAnalytics, getMonthOnMonthAnalytics, getVehicleCostAnalytics, exportMissingIndents } from '../controllers/analyticsController';
import { exportAllIndentsToExcel } from '../controllers/exportController';
import { debugCalculations } from '../controllers/debugController';

const router = express.Router();

// IMPORTANT: Register export route FIRST to avoid conflicts
router.get('/export-all', exportAllIndentsToExcel);

// Register specific routes BEFORE catch-all '/' route
router.get('/range-wise', getRangeWiseAnalytics);
router.get('/fulfillment', getFulfillmentAnalytics);
router.get('/fulfillment/export-missing', exportMissingIndents);
router.get('/load-over-time', getLoadOverTime);
router.get('/revenue', getRevenueAnalytics);
router.get('/cost', getCostAnalytics);
router.get('/profit-loss', getProfitLossAnalytics);

// Register vehicle-cost route - MUST be before catch-all '/' route
router.get('/vehicle-cost', getVehicleCostAnalytics);
router.get('/month-on-month', getMonthOnMonthAnalytics);
router.get('/debug/calculations', debugCalculations);

// Catch-all route - MUST be LAST (after all specific routes)
router.get('/', getAnalytics);

export default router;

