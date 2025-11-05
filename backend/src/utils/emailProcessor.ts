import emailService, { EmailMessage, EmailAttachment } from '../services/emailService';
import { processExcelFile } from '../controllers/uploadController';

interface ProcessingResult {
  success: boolean;
  messageId: string;
  fileName?: string;
  recordCount?: number;
  error?: string;
}

/**
 * Process email attachments and upload Excel files
 */
export async function processEmailAttachments(
  email: EmailMessage
): Promise<ProcessingResult[]> {
  const results: ProcessingResult[] = [];

  if (!email.hasAttachments || !email.attachments || email.attachments.length === 0) {
    console.log(`[emailProcessor] Email ${email.id} has no attachments`);
    return results;
  }

  // Filter Excel attachments
  const excelAttachments = email.attachments.filter(att => 
    emailService.isExcelAttachment(att)
  );

  if (excelAttachments.length === 0) {
    console.log(`[emailProcessor] Email ${email.id} has no Excel attachments`);
    return results;
  }

  console.log(`[emailProcessor] Processing ${excelAttachments.length} Excel attachment(s) from email ${email.id}`);

  // Process each Excel attachment
  for (const attachment of excelAttachments) {
    try {
      console.log(`[emailProcessor] Downloading attachment: ${attachment.name} (${attachment.size} bytes)`);
      
      // Download attachment
      const fileBuffer = await emailService.downloadAttachment(email.id, attachment.id);
      
      console.log(`[emailProcessor] Processing Excel file: ${attachment.name}`);
      
      // Process the file
      const result = await processExcelFile(fileBuffer, null, attachment.name);
      
      if (result.success) {
        console.log(`[emailProcessor] Successfully processed ${attachment.name}: ${result.recordCount} records`);
        results.push({
          success: true,
          messageId: email.id,
          fileName: attachment.name,
          recordCount: result.recordCount
        });
      } else {
        console.error(`[emailProcessor] Failed to process ${attachment.name}: ${result.error}`);
        results.push({
          success: false,
          messageId: email.id,
          fileName: attachment.name,
          error: result.error
        });
      }
    } catch (error) {
      console.error(`[emailProcessor] Error processing attachment ${attachment.name}:`, error);
      results.push({
        success: false,
        messageId: email.id,
        fileName: attachment.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
}

/**
 * Process a single email: extract attachments, upload, and archive
 */
export async function processEmail(email: EmailMessage): Promise<ProcessingResult[]> {
  try {
    console.log(`[emailProcessor] Processing email: ${email.subject} (ID: ${email.id})`);
    
    // Process attachments
    const results = await processEmailAttachments(email);
    
    // Check if at least one attachment was processed successfully
    const hasSuccess = results.some(r => r.success);
    
    if (hasSuccess) {
      // Mark as read
      await emailService.markAsRead(email.id);
      
      // Archive email
      await emailService.archiveEmail(email.id);
      
      console.log(`[emailProcessor] Successfully processed and archived email ${email.id}`);
    } else {
      console.warn(`[emailProcessor] No successful processing for email ${email.id}, not archiving`);
    }
    
    return results;
  } catch (error) {
    console.error(`[emailProcessor] Failed to process email ${email.id}:`, error);
    throw error;
  }
}

/**
 * Process all unread emails
 */
export async function processAllUnreadEmails(): Promise<ProcessingResult[]> {
  try {
    console.log('[emailProcessor] Checking for unread emails...');
    
    let emails;
    try {
      emails = await emailService.getUnreadEmails();
    } catch (error: any) {
      // Handle authentication/configuration errors
      if (error.message && error.message.includes('credentials')) {
        console.error('[emailProcessor] Email service not configured properly:', error.message);
        throw new Error('Email service configuration error. Please check Azure app credentials.');
      } else if (error.message && error.message.includes('Rate limit')) {
        console.warn('[emailProcessor] Rate limited. Will retry on next poll cycle.');
        throw error; // Re-throw to be handled by caller
      }
      throw error;
    }
    
    if (emails.length === 0) {
      console.log('[emailProcessor] No unread emails found');
      return [];
    }

    console.log(`[emailProcessor] Found ${emails.length} unread email(s)`);
    
    const allResults: ProcessingResult[] = [];
    
    // Process each email
    for (const email of emails) {
      try {
        const results = await processEmail(email);
        allResults.push(...results);
        
        // Small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error: any) {
        console.error(`[emailProcessor] Failed to process email ${email.id}:`, error);
        allResults.push({
          success: false,
          messageId: email.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        // If rate limited, stop processing remaining emails
        if (error.message && error.message.includes('Rate limit')) {
          console.warn('[emailProcessor] Rate limited. Stopping processing of remaining emails.');
          break;
        }
      }
    }
    
    const successCount = allResults.filter(r => r.success).length;
    const failureCount = allResults.filter(r => !r.success).length;
    
    console.log(`[emailProcessor] Processing complete: ${successCount} successful, ${failureCount} failed`);
    
    return allResults;
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error';
    console.error(`[emailProcessor] Failed to process unread emails:`, errorMessage);
    
    // Don't throw for rate limiting - let it retry on next poll
    if (error.message && error.message.includes('Rate limit')) {
      console.warn('[emailProcessor] Rate limited. Will retry on next poll cycle.');
      return [];
    }
    
    throw error;
  }
}

