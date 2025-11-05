import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';

interface EmailMessage {
  id: string;
  subject: string;
  from: {
    emailAddress: {
      address: string;
      name: string;
    };
  };
  receivedDateTime: string;
  hasAttachments: boolean;
  attachments?: EmailAttachment[];
}

interface EmailAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  contentBytes?: string;
}

class EmailService {
  private clientId: string;
  private clientSecret: string;
  private tenantId: string;
  private uploadEmail: string;
  private archiveFolder: string;
  private graphClient: Client | null = null;

  constructor() {
    this.clientId = process.env.OUTLOOK_CLIENT_ID || '';
    this.clientSecret = process.env.OUTLOOK_CLIENT_SECRET || '';
    this.tenantId = process.env.OUTLOOK_TENANT_ID || '';
    this.uploadEmail = process.env.OUTLOOK_UPLOAD_EMAIL || '';
    this.archiveFolder = process.env.OUTLOOK_ARCHIVE_FOLDER || 'Processed';

    if (!this.clientId || !this.clientSecret || !this.tenantId) {
      console.warn('[EmailService] Missing Outlook credentials. Email service will not be available.');
    }
  }

  /**
   * Initialize Microsoft Graph API client
   */
  private async initializeClient(): Promise<Client> {
    if (this.graphClient) {
      return this.graphClient;
    }

    if (!this.clientId || !this.clientSecret || !this.tenantId) {
      throw new Error('Outlook credentials not configured. Please set OUTLOOK_CLIENT_ID, OUTLOOK_CLIENT_SECRET, and OUTLOOK_TENANT_ID.');
    }

    try {
      // Use Client Secret Credential for app-only authentication
      const credential = new ClientSecretCredential(
        this.tenantId,
        this.clientId,
        this.clientSecret
      );

      // Create authentication provider
      const authProvider = new TokenCredentialAuthenticationProvider(credential, {
        scopes: ['https://graph.microsoft.com/.default']
      });

      // Initialize Graph client
      this.graphClient = Client.initWithMiddleware({
        authProvider: authProvider
      });

      console.log('[EmailService] Microsoft Graph API client initialized successfully');
      return this.graphClient;
    } catch (error) {
      console.error('[EmailService] Failed to initialize Graph client:', error);
      throw error;
    }
  }

  /**
   * Get all unread emails from the upload email address
   */
  async getUnreadEmails(): Promise<EmailMessage[]> {
    try {
      if (!this.uploadEmail) {
        throw new Error('OUTLOOK_UPLOAD_EMAIL is not configured');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.uploadEmail)) {
        throw new Error(`Invalid email format: ${this.uploadEmail}`);
      }

      const client = await this.initializeClient();
      
      // Note: We skip user validation as it requires User.Read permission
      // Mail permissions are sufficient for reading messages
      
      // Get unread messages
      const response = await client
        .api(`/users/${this.uploadEmail}/messages`)
        .filter("isRead eq false")
        .select('id,subject,from,receivedDateTime,hasAttachments')
        .top(50)
        .get();

      const messages: EmailMessage[] = response.value || [];
      
      console.log(`[EmailService] Found ${messages.length} unread emails`);
      
      // Get attachments for each message
      for (const message of messages) {
        if (message.hasAttachments) {
          try {
            const attachmentsResponse = await client
              .api(`/users/${this.uploadEmail}/messages/${message.id}/attachments`)
              .get();
            
            message.attachments = attachmentsResponse.value || [];
          } catch (error: any) {
            // Handle rate limiting (429) - log but don't fail completely
            if (error.statusCode === 429) {
              console.warn(`[EmailService] Rate limited while getting attachments for message ${message.id}. Retrying later...`);
              message.attachments = [];
            } else {
              console.error(`[EmailService] Failed to get attachments for message ${message.id}:`, error);
              message.attachments = [];
            }
          }
        }
      }

      return messages;
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      const statusCode = error.statusCode || 'N/A';
      console.error(`[EmailService] Failed to get unread emails (Status: ${statusCode}):`, errorMessage);
      
      // Provide helpful error messages
      if (error.statusCode === 401 || error.statusCode === 403) {
        throw new Error('Authentication failed. Please check your Azure app credentials and permissions.');
      } else if (error.statusCode === 429) {
        throw new Error('Rate limit exceeded. Please wait before trying again.');
      } else if (error.statusCode === 500 || error.statusCode === 503) {
        throw new Error('Microsoft Graph API is temporarily unavailable. Please try again later.');
      }
      
      throw error;
    }
  }

  /**
   * Download attachment content
   */
  async downloadAttachment(messageId: string, attachmentId: string): Promise<Buffer> {
    try {
      if (!messageId || !attachmentId) {
        throw new Error('Message ID and Attachment ID are required');
      }

      const client = await this.initializeClient();
      
      const attachment = await client
        .api(`/users/${this.uploadEmail}/messages/${messageId}/attachments/${attachmentId}`)
        .get();

      if (!attachment.contentBytes) {
        throw new Error(`Attachment content not available for attachment ${attachmentId}`);
      }

      // Validate attachment size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      const attachmentSize = attachment.size || 0;
      if (attachmentSize > maxSize) {
        throw new Error(`Attachment size (${Math.round(attachmentSize / 1024 / 1024)}MB) exceeds maximum allowed size (50MB)`);
      }

      // Decode base64 content
      try {
        const buffer = Buffer.from(attachment.contentBytes, 'base64');
        if (buffer.length === 0) {
          throw new Error('Decoded attachment buffer is empty');
        }
        return buffer;
      } catch (decodeError) {
        throw new Error(`Failed to decode attachment content: ${decodeError instanceof Error ? decodeError.message : 'Unknown error'}`);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      const statusCode = error.statusCode || 'N/A';
      console.error(`[EmailService] Failed to download attachment ${attachmentId} (Status: ${statusCode}):`, errorMessage);
      
      if (error.statusCode === 404) {
        throw new Error(`Attachment ${attachmentId} not found`);
      } else if (error.statusCode === 429) {
        throw new Error('Rate limit exceeded while downloading attachment. Please try again later.');
      }
      
      throw error;
    }
  }

  /**
   * Mark email as read
   */
  async markAsRead(messageId: string): Promise<void> {
    try {
      const client = await this.initializeClient();
      
      await client
        .api(`/users/${this.uploadEmail}/messages/${messageId}`)
        .patch({
          isRead: true
        });
      
      console.log(`[EmailService] Marked email ${messageId} as read`);
    } catch (error) {
      console.error(`[EmailService] Failed to mark email as read:`, error);
      throw error;
    }
  }

  /**
   * Archive email by moving to archive folder
   */
  async archiveEmail(messageId: string): Promise<void> {
    try {
      if (!messageId) {
        throw new Error('Message ID is required');
      }

      const client = await this.initializeClient();
      
      // Check if archive folder exists, create if not
      let archiveFolderId: string;
      try {
        const folders = await client
          .api(`/users/${this.uploadEmail}/mailFolders`)
          .filter(`displayName eq '${this.archiveFolder}'`)
          .get();
        
        if (folders.value && folders.value.length > 0) {
          archiveFolderId = folders.value[0].id;
          console.log(`[EmailService] Using existing archive folder: ${this.archiveFolder}`);
        } else {
          // Create archive folder
          console.log(`[EmailService] Creating archive folder: ${this.archiveFolder}`);
          const newFolder = await client
            .api(`/users/${this.uploadEmail}/mailFolders`)
            .post({
              displayName: this.archiveFolder,
              isHidden: false
            });
          archiveFolderId = newFolder.id;
          console.log(`[EmailService] Created archive folder with ID: ${archiveFolderId}`);
        }
      } catch (error: any) {
        const errorMessage = error.message || 'Unknown error';
        console.error(`[EmailService] Failed to get/create archive folder:`, errorMessage);
        if (error.statusCode === 403) {
          throw new Error('Permission denied: Cannot create or access archive folder. Please check API permissions.');
        }
        throw error;
      }

      // Move message to archive folder
      try {
        await client
          .api(`/users/${this.uploadEmail}/messages/${messageId}/move`)
          .post({
            destinationId: archiveFolderId
          });
        
        console.log(`[EmailService] Successfully archived email ${messageId} to folder ${this.archiveFolder}`);
      } catch (error: any) {
        // If message is already moved or doesn't exist, log warning but don't fail
        if (error.statusCode === 404) {
          console.warn(`[EmailService] Email ${messageId} not found (may have been already archived)`);
          return;
        }
        throw error;
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      const statusCode = error.statusCode || 'N/A';
      console.error(`[EmailService] Failed to archive email ${messageId} (Status: ${statusCode}):`, errorMessage);
      
      // Don't throw - archiving failure shouldn't block the main process
      // But log it for monitoring
      if (error.statusCode === 429) {
        console.warn('[EmailService] Rate limited while archiving. Email will be archived on next poll.');
      } else {
        console.warn(`[EmailService] Email ${messageId} could not be archived. It will remain in inbox.`);
      }
    }
  }

  /**
   * Check if attachment is an Excel file
   */
  isExcelAttachment(attachment: EmailAttachment): boolean {
    const excelTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/vnd.ms-excel.sheet.macroEnabled.12' // .xlsm
    ];
    
    const excelExtensions = ['.xlsx', '.xls', '.xlsm'];
    const fileName = attachment.name.toLowerCase();
    
    return excelTypes.includes(attachment.contentType.toLowerCase()) ||
           excelExtensions.some(ext => fileName.endsWith(ext));
  }
}

export default new EmailService();
export { EmailMessage, EmailAttachment };

