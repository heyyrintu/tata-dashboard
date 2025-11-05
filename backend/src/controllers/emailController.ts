import { Request, Response } from 'express';
import emailPollingService from '../services/emailPollingService';
import { processAllUnreadEmails } from '../utils/emailProcessor';

/**
 * Manually trigger email processing
 */
export const processEmails = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('[emailController] Manual email processing triggered');
    
    const results = await processAllUnreadEmails();
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    res.json({
      success: true,
      message: `Processed ${results.length} email(s): ${successCount} successful, ${failureCount} failed`,
      results: results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      }
    });
  } catch (error) {
    console.error('[emailController] Error processing emails:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process emails'
    });
  }
};

/**
 * Get email service status
 */
export const getEmailStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const isRunning = emailPollingService.isActive();
    const pollInterval = emailPollingService.getPollInterval();
    
    res.json({
      success: true,
      status: {
        isRunning,
        pollInterval: pollInterval / 1000, // Convert to seconds
        pollIntervalFormatted: `${Math.round(pollInterval / 60000)} minutes`,
        configured: !!(
          process.env.OUTLOOK_CLIENT_ID &&
          process.env.OUTLOOK_CLIENT_SECRET &&
          process.env.OUTLOOK_TENANT_ID &&
          process.env.OUTLOOK_UPLOAD_EMAIL
        )
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get email status'
    });
  }
};

/**
 * Start email polling service
 */
export const startEmailService = async (req: Request, res: Response): Promise<void> => {
  try {
    if (emailPollingService.isActive()) {
      res.json({
        success: true,
        message: 'Email service is already running'
      });
      return;
    }
    
    emailPollingService.start();
    
    res.json({
      success: true,
      message: 'Email polling service started'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start email service'
    });
  }
};

/**
 * Stop email polling service
 */
export const stopEmailService = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!emailPollingService.isActive()) {
      res.json({
        success: true,
        message: 'Email service is not running'
      });
      return;
    }
    
    emailPollingService.stop();
    
    res.json({
      success: true,
      message: 'Email polling service stopped'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to stop email service'
    });
  }
};

