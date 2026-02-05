import emailService, { EmailMessage } from '../services/emailService';
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
      console.log(`[emailProcessor] Processing Excel file: ${attachment.name} (${attachment.size} bytes)`);

      // Process the file - attachment.content is already a Buffer
      const result = await processExcelFile(attachment.content, null, attachment.name);

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
    console.log(`[emailProcessor] Processing email: ${email.subject} from ${email.from} (UID: ${email.uid})`);

    // Process attachments
    const results = await processEmailAttachments(email);

    // Check if at least one attachment was processed successfully
    const hasSuccess = results.some(r => r.success);

    if (hasSuccess) {
      // Mark as read
      await emailService.markAsRead(email.uid);

      // Archive email
      await emailService.archiveEmail(email.uid);

      console.log(`[emailProcessor] Successfully processed and archived email UID ${email.uid}`);
    } else if (results.length > 0) {
      console.warn(`[emailProcessor] No successful processing for email UID ${email.uid}, not archiving`);
    }

    return results;
  } catch (error) {
    console.error(`[emailProcessor] Failed to process email UID ${email.uid}:`, error);
    throw error;
  }
}

/**
 * Process all unread emails from allowed sender
 */
export async function processAllUnreadEmails(): Promise<ProcessingResult[]> {
  try {
    console.log('[emailProcessor] Checking for unread emails...');

    if (!emailService.isConfigured()) {
      console.warn('[emailProcessor] Email service not configured. Skipping.');
      return [];
    }

    const emails = await emailService.getUnreadEmails();

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

        // Small delay between emails to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`[emailProcessor] Failed to process email UID ${email.uid}:`, error);
        allResults.push({
          success: false,
          messageId: email.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = allResults.filter(r => r.success).length;
    const failureCount = allResults.filter(r => !r.success).length;

    console.log(`[emailProcessor] Processing complete: ${successCount} successful, ${failureCount} failed`);

    return allResults;
  } catch (error) {
    console.error(`[emailProcessor] Failed to process unread emails:`, error);
    throw error;
  }
}
