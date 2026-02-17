import dotenv from 'dotenv';
import { processAllUnreadEmails } from '../utils/emailProcessor';

dotenv.config();

class EmailPollingService {
  private pollInterval: number;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor() {
    // Poll interval in milliseconds (default: 10 minutes)
    this.pollInterval = parseInt(process.env.EMAIL_POLL_INTERVAL || '600000', 10);
    
    if (this.pollInterval < 60000) {
      console.warn('[EmailPollingService] Poll interval too short, setting to minimum 1 minute');
      this.pollInterval = 60000;
    }
  }

  /**
   * Start polling for emails
   */
  start(): void {
    if (this.isRunning) {
      console.log('[EmailPollingService] Service is already running');
      return;
    }

    console.log(`[EmailPollingService] Starting email polling service (interval: ${this.pollInterval / 1000}s)`);
    
    this.isRunning = true;
    
    // Process immediately on start
    this.processEmails().catch(err =>
      console.error('[EmailPollingService] Initial poll failed:', err)
    );

    // Then poll at intervals
    this.intervalId = setInterval(() => {
      this.processEmails().catch(err =>
        console.error('[EmailPollingService] Scheduled poll failed:', err)
      );
    }, this.pollInterval);
  }

  /**
   * Stop polling for emails
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('[EmailPollingService] Service is not running');
      return;
    }

    console.log('[EmailPollingService] Stopping email polling service');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isRunning = false;
  }

  /**
   * Process emails (called by polling or manually)
   */
  private async processEmails(): Promise<void> {
    try {
      console.log('[EmailPollingService] Polling for new emails...');
      
      const results = await processAllUnreadEmails();
      
      if (results.length > 0) {
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;
        console.log(`[EmailPollingService] Processed ${results.length} email(s): ${successCount} successful, ${failureCount} failed`);
      }
    } catch (error) {
      console.error('[EmailPollingService] Error during email polling:', error);
      // Don't throw - we want polling to continue even if one cycle fails
    }
  }

  /**
   * Manually trigger email processing (for testing or admin endpoints)
   */
  async processNow(): Promise<void> {
    await this.processEmails();
  }

  /**
   * Check if service is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get current poll interval
   */
  getPollInterval(): number {
    return this.pollInterval;
  }
}

// Create singleton instance
const emailPollingService = new EmailPollingService();

// Start service if running as standalone script
if (require.main === module) {
  console.log('[EmailPollingService] Starting as standalone service...');
  emailPollingService.start();
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('[EmailPollingService] Received SIGINT, shutting down...');
    emailPollingService.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('[EmailPollingService] Received SIGTERM, shutting down...');
    emailPollingService.stop();
    process.exit(0);
  });
}

export default emailPollingService;

