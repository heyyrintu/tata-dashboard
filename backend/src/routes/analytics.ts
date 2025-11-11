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
console.log('[ROUTES] ========================================');
console.log('[ROUTES] Registering vehicle-cost route...');
console.log('[ROUTES] getVehicleCostAnalytics type:', typeof getVehicleCostAnalytics);
console.log('[ROUTES] getVehicleCostAnalytics exists:', typeof getVehicleCostAnalytics !== 'undefined');
console.log('[ROUTES] getVehicleCostAnalytics is function:', typeof getVehicleCostAnalytics === 'function');

// Always register the route, even if function check fails (for debugging)
router.get('/vehicle-cost', async (req, res) => {
  console.log('[ROUTES] Vehicle-cost route handler called');
  console.log('[ROUTES] getVehicleCostAnalytics type in handler:', typeof getVehicleCostAnalytics);
  
  if (typeof getVehicleCostAnalytics === 'function') {
    try {
      await getVehicleCostAnalytics(req, res);
    } catch (error) {
      console.error('[ROUTES] Error in getVehicleCostAnalytics:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    console.error('[ROUTES] ✗ CRITICAL: getVehicleCostAnalytics is not a function in handler!');
    res.status(500).json({
      success: false,
      error: 'getVehicleCostAnalytics function not found',
      debug: {
        type: typeof getVehicleCostAnalytics,
        exists: typeof getVehicleCostAnalytics !== 'undefined',
        importCheck: 'Check backend console for import errors',
        timestamp: new Date().toISOString()
      }
    });
  }
});

console.log('[ROUTES] ✓ Vehicle-cost route registered at /api/analytics/vehicle-cost');
console.log('[ROUTES] ========================================');

router.get('/debug/calculations', debugCalculations);

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

// Debug: Verify vehicle-cost route
console.log('Checking getVehicleCostAnalytics:', {
  exists: typeof getVehicleCostAnalytics !== 'undefined',
  type: typeof getVehicleCostAnalytics,
  isFunction: typeof getVehicleCostAnalytics === 'function'
});
if (typeof getVehicleCostAnalytics === 'function') {
  console.log('✓ Vehicle-cost route registered successfully at /api/analytics/vehicle-cost');
} else {
  console.error('✗ ERROR: getVehicleCostAnalytics is not a function!', typeof getVehicleCostAnalytics);
}

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

// Catch-all route - MUST be LAST (after all specific routes)
router.get('/', getAnalytics);

// Debug: Log registered routes
console.log('Analytics routes registered:', {
  '/': 'getAnalytics',
  '/range-wise': 'getRangeWiseAnalytics',
  '/fulfillment': 'getFulfillmentAnalytics',
  '/load-over-time': 'getLoadOverTime',
  '/revenue': 'getRevenueAnalytics',
  '/cost': 'getCostAnalytics',
  '/profit-loss': typeof getProfitLossAnalytics === 'function' ? 'getProfitLossAnalytics ✓' : 'MISSING ✗',
  '/vehicle-cost': typeof getVehicleCostAnalytics === 'function' ? 'getVehicleCostAnalytics ✓' : 'MISSING ✗',
  '/month-on-month': typeof getMonthOnMonthAnalytics === 'function' ? 'getMonthOnMonthAnalytics ✓' : 'MISSING ✗'
});

export default router;

