import express from 'express';
import { getAnalytics, getRangeWiseAnalytics, getFulfillmentAnalytics, getLoadOverTime, getRevenueAnalytics, getCostAnalytics, getProfitLossAnalytics, getMonthOnMonthAnalytics, exportMissingIndents } from '../controllers/analyticsController';
import { exportAllIndentsToExcel } from '../controllers/exportController';
import { debugCalculations } from '../controllers/debugController';

const router = express.Router();

// IMPORTANT: Register export route FIRST to avoid conflicts
router.get('/export-all', exportAllIndentsToExcel);

router.get('/', getAnalytics);
router.get('/range-wise', getRangeWiseAnalytics);
router.get('/fulfillment', getFulfillmentAnalytics);
router.get('/fulfillment/export-missing', exportMissingIndents);
router.get('/load-over-time', getLoadOverTime);

// Test route to verify export-all is accessible
router.get('/test-export', (req, res) => {
  res.json({ 
    message: 'Export route test', 
    exportFunctionExists: typeof exportAllIndentsToExcel === 'function',
    route: '/api/analytics/export-all',
    status: 'OK'
  });
});

// Debug: Log export route registration
console.log('========================================');
console.log('[ROUTES] Export route registered: /export-all');
console.log('[ROUTES] Full path: /api/analytics/export-all');
console.log('[ROUTES] Function exists:', typeof exportAllIndentsToExcel === 'function' ? 'YES ✓' : 'NO ✗');
console.log('========================================');
router.get('/revenue', getRevenueAnalytics);
router.get('/cost', getCostAnalytics);
router.get('/profit-loss', getProfitLossAnalytics);
router.get('/debug/calculations', debugCalculations);

// Test route first to verify routing works
router.get('/test-month-route', (req, res) => {
  res.json({ message: 'Test route works!', functionExists: typeof getMonthOnMonthAnalytics !== 'undefined' });
});

// Verify the function exists before registering
console.log('Checking getMonthOnMonthAnalytics:', {
  exists: typeof getMonthOnMonthAnalytics !== 'undefined',
  type: typeof getMonthOnMonthAnalytics,
  isFunction: typeof getMonthOnMonthAnalytics === 'function'
});

try {
  if (typeof getMonthOnMonthAnalytics === 'function') {
    router.get('/month-on-month', getMonthOnMonthAnalytics);
    console.log('✓ Month-on-month route registered successfully at /api/analytics/month-on-month');
  } else {
    console.error('✗ ERROR: getMonthOnMonthAnalytics is not a function!', typeof getMonthOnMonthAnalytics);
  }
} catch (error) {
  console.error('✗ ERROR registering month-on-month route:', error);
}

// Debug: Log registered routes
console.log('Analytics routes registered:', {
  '/': 'getAnalytics',
  '/range-wise': 'getRangeWiseAnalytics',
  '/fulfillment': 'getFulfillmentAnalytics',
  '/load-over-time': 'getLoadOverTime',
  '/revenue': 'getRevenueAnalytics',
  '/cost': 'getCostAnalytics',
  '/profit-loss': typeof getProfitLossAnalytics === 'function' ? 'getProfitLossAnalytics ✓' : 'MISSING ✗',
  '/month-on-month': typeof getMonthOnMonthAnalytics === 'function' ? 'getMonthOnMonthAnalytics ✓' : 'MISSING ✗'
});

export default router;

