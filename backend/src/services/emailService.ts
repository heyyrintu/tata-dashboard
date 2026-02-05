import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

interface EmailMessage {
  id: string;
  uid: number;
  subject: string;
  from: string;
  receivedDateTime: Date;
  hasAttachments: boolean;
  attachments: EmailAttachment[];
}

interface EmailAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  content: Buffer;
}

class EmailService {
  private host: string;
  private port: number;
  private user: string;
  private password: string;
  private allowedSenders: string[];
  private archiveFolder: string;

  constructor() {
    this.host = process.env.IMAP_HOST || 'imap.hostinger.com';
    this.port = parseInt(process.env.IMAP_PORT || '993', 10);
    this.user = process.env.IMAP_USER || '';
    this.password = process.env.IMAP_PASSWORD || '';
    // Support comma-separated list of allowed senders
    const senderEnv = process.env.IMAP_ALLOWED_SENDER || '';
    this.allowedSenders = senderEnv
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(s => s.length > 0);
    this.archiveFolder = process.env.IMAP_ARCHIVE_FOLDER || 'Processed';

    if (!this.user || !this.password) {
      console.warn('[EmailService] Missing IMAP credentials. Email service will not be available.');
    }
  }

  /**
   * Create IMAP client connection
   */
  private createClient(): ImapFlow {
    return new ImapFlow({
      host: this.host,
      port: this.port,
      secure: true,
      auth: {
        user: this.user,
        pass: this.password
      },
      logger: false
    });
  }

  /**
   * Get all unread emails from allowed sender
   */
  async getUnreadEmails(): Promise<EmailMessage[]> {
    const client = this.createClient();
    const messages: EmailMessage[] = [];

    try {
      await client.connect();
      console.log('[EmailService] Connected to IMAP server');

      // Select INBOX
      const lock = await client.getMailboxLock('INBOX');

      try {
        // Search for unread emails (filter by sender in code to support multiple senders)
        const searchCriteria: any = { seen: false };

        if (this.allowedSenders.length > 0) {
          console.log(`[EmailService] Filtering emails from: ${this.allowedSenders.join(', ')}`);
        }

        const uids = await client.search(searchCriteria);
        console.log(`[EmailService] Found ${uids.length} unread email(s)`);

        if (uids.length === 0) {
          return messages;
        }

        // Fetch each email
        for (const uid of uids) {
          try {
            const message = await client.fetchOne(uid, { source: true });

            if (message && message.source) {
              const parsed = await simpleParser(message.source);

              // Extract sender email
              const fromAddress = parsed.from?.value?.[0]?.address || '';

              // Check if sender is in allowed list
              if (this.allowedSenders.length > 0) {
                const senderLower = fromAddress.toLowerCase();
                const isAllowed = this.allowedSenders.some(allowed => senderLower.includes(allowed));
                if (!isAllowed) {
                  console.log(`[EmailService] Skipping email from ${fromAddress} (not in allowed senders)`);
                  continue;
                }
              }

              // Extract attachments
              const attachments: EmailAttachment[] = [];
              if (parsed.attachments && parsed.attachments.length > 0) {
                for (let i = 0; i < parsed.attachments.length; i++) {
                  const att = parsed.attachments[i];
                  attachments.push({
                    id: `${uid}-${i}`,
                    name: att.filename || `attachment-${i}`,
                    contentType: att.contentType || 'application/octet-stream',
                    size: att.size || 0,
                    content: att.content
                  });
                }
              }

              messages.push({
                id: String(uid),
                uid: uid,
                subject: parsed.subject || '(no subject)',
                from: fromAddress,
                receivedDateTime: parsed.date || new Date(),
                hasAttachments: attachments.length > 0,
                attachments
              });

              console.log(`[EmailService] Fetched email: "${parsed.subject}" from ${fromAddress} (${attachments.length} attachments)`);
            }
          } catch (fetchError) {
            console.error(`[EmailService] Failed to fetch email UID ${uid}:`, fetchError);
          }
        }
      } finally {
        lock.release();
      }

      return messages;
    } catch (error) {
      console.error('[EmailService] Failed to get unread emails:', error);
      throw error;
    } finally {
      await client.logout();
    }
  }

  /**
   * Mark email as read
   */
  async markAsRead(uid: number): Promise<void> {
    const client = this.createClient();

    try {
      await client.connect();
      const lock = await client.getMailboxLock('INBOX');

      try {
        await client.messageFlagsAdd(uid, ['\\Seen']);
        console.log(`[EmailService] Marked email UID ${uid} as read`);
      } finally {
        lock.release();
      }
    } catch (error) {
      console.error(`[EmailService] Failed to mark email as read:`, error);
      throw error;
    } finally {
      await client.logout();
    }
  }

  /**
   * Archive email by moving to archive folder
   */
  async archiveEmail(uid: number): Promise<void> {
    const client = this.createClient();

    try {
      await client.connect();

      // Check if archive folder exists, create if not
      const mailboxes = await client.list();
      const archiveExists = mailboxes.some(
        (mb: any) => mb.path === this.archiveFolder || mb.name === this.archiveFolder
      );

      if (!archiveExists) {
        console.log(`[EmailService] Creating archive folder: ${this.archiveFolder}`);
        await client.mailboxCreate(this.archiveFolder);
      }

      const lock = await client.getMailboxLock('INBOX');

      try {
        await client.messageMove(uid, this.archiveFolder);
        console.log(`[EmailService] Moved email UID ${uid} to ${this.archiveFolder}`);
      } finally {
        lock.release();
      }
    } catch (error) {
      console.error(`[EmailService] Failed to archive email:`, error);
      // Don't throw - archiving failure shouldn't block the main process
    } finally {
      await client.logout();
    }
  }

  /**
   * Check if attachment is an Excel file
   */
  isExcelAttachment(attachment: EmailAttachment): boolean {
    const excelTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/vnd.ms-excel.sheet.macroenabled.12' // .xlsm
    ];

    const excelExtensions = ['.xlsx', '.xls', '.xlsm'];
    const fileName = attachment.name.toLowerCase();

    return excelTypes.includes(attachment.contentType.toLowerCase()) ||
           excelExtensions.some(ext => fileName.endsWith(ext));
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return !!(this.user && this.password);
  }
}

export default new EmailService();
export { EmailMessage, EmailAttachment };
