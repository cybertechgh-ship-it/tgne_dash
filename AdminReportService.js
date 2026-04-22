import { getDatabase, ref, query, orderByChild, startAt, endAt, get } from '@firebase/database';
import { subDays, subWeeks, subMonths, addDays, addWeeks, addMonths } from 'date-fns';
import { Resend } from 'resend';

// Note: Using API keys on the frontend is insecure as they are bundled into the source code.
// For production, it is highly recommended to trigger this via a backend or Cloud Function.
const resend = new Resend(process.env.REACT_APP_RESEND_API_KEY);

/**
 * Service to handle manual generation of project digests.
 */
export const AdminReportService = {
  /**
   * Fetches data for the selected duration and triggers an email report.
   * @param {string} durationType - 'days' | 'weeks' | 'months'
   * @param {number} unit - The number of days/weeks/months (e.g., 1 day, 2 weeks)
   */
  async sendManualDigest(durationType, unit = 1) {
    const adminEmailsStr = process.env.REACT_APP_ADMIN_EMAILS || '';
    const adminEmails = adminEmailsStr.split(',').map(email => email.trim()).filter(Boolean);

    const db = getDatabase();
    const now = new Date();
    let startTime;
    let expiryThreshold;

    // Calculate start time based on duration
    switch (durationType) {
      case 'days':
        startTime = subDays(now, unit).getTime();
        break;
      case 'weeks':
        startTime = subWeeks(now, unit).getTime();
        break;
      case 'months':
        startTime = subMonths(now, unit).getTime();
        break;
      default:
        throw new Error("Invalid duration type. Use 'days', 'weeks', or 'months'.");
    }

    // Calculate look-ahead threshold for expiring domains
    switch (durationType) {
      case 'days': expiryThreshold = addDays(now, unit).getTime(); break;
      case 'weeks': expiryThreshold = addWeeks(now, unit).getTime(); break;
      case 'months': expiryThreshold = addMonths(now, unit).getTime(); break;
    }

    try {
      // Fetch Import Logs
      const importLogsRef = ref(db, 'project/logs/imports');
      const importQuery = query(importLogsRef, orderByChild('timestamp'), startAt(startTime));
      const importSnap = await get(importQuery);

      // Fetch Export Logs
      const exportLogsRef = ref(db, 'project/logs/exports');
      const exportQuery = query(exportLogsRef, orderByChild('timestamp'), startAt(startTime));
      const exportSnap = await get(exportQuery);

      // Fetch Expiring Domains (GHS)
      const domainsRef = ref(db, 'project/domains');
      const domainQuery = query(domainsRef, orderByChild('expiryDate'), startAt(now.getTime()), endAt(expiryThreshold));
      const domainSnap = await get(domainQuery);

      const digestData = {
        period: `${unit} ${durationType}`,
        generatedAt: now.getTime(),
        imports: importSnap.val() || {},
        exports: exportSnap.val() || {},
        expiringDomains: domainSnap.val() || {},
        summary: {
          totalImports: importSnap.exists() ? Object.keys(importSnap.val()).length : 0,
          totalExports: exportSnap.exists() ? Object.keys(exportSnap.val()).length : 0,
          totalExpiring: domainSnap.exists() ? Object.keys(domainSnap.val()).length : 0
        }
      };

      return await this._triggerEmailFunction(adminEmails, digestData);
    } catch (error) {
      console.error("Failed to generate manual report:", error);
      throw error;
    }
  },

  /**
   * Internal method to call your email backend/cloud function.
   */
  async _triggerEmailFunction(emails, data) {
    if (!emails || emails.length === 0) {
      throw new Error("No admin emails found in environment variables.");
    }

    console.log(`Triggering individual emails via Resend to: ${emails.join(', ')}`);

    try {
      // Map each email to a separate send promise to ensure 3 distinct fires
      const emailPromises = emails.map(email => 
        resend.emails.send({
          from: 'Reminder for expiring Domains <onboarding@resend.dev>', 
          to: email,
          subject: `Urgent: Expiring Domains & GHS Report - ${data.period}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
              <h1 style="color: #d32f2f;">Domain Expiry Reminder</h1>
              <p>This report highlights domains and GHS services expiring in the next <strong>${data.period}</strong>.</p>
              <p><strong>Generated At:</strong> ${new Date(data.generatedAt).toLocaleString()}</p>
              
              <div style="background: #fff3e0; padding: 15px; border-left: 5px solid #ff9800; margin: 20px 0;">
                <h3 style="margin-top: 0;">⚠️ Expiring Domains (GHS)</h3>
                ${data.summary.totalExpiring > 0 ? `
                  <ul>
                    ${Object.values(data.expiringDomains).map(d => `
                      <li><strong>${d.domainName}</strong> - Expires: ${new Date(d.expiryDate).toLocaleDateString()} (${d.ghsStatus || 'GHS Active'})</li>
                    `).join('')}
                  </ul>
                ` : '<p>No domains expiring in this period.</p>'}
              </div>

              <hr style="border: 0; border-top: 1px solid #eee;" />
              <h3>Activity Summary</h3>
              <ul style="list-style: none; padding: 0;">
                <li style="padding: 8px 0; border-bottom: 1px solid #f9f9f9;">✅ <strong>Total Imports:</strong> ${data.summary.totalImports}</li>
                <li style="padding: 8px 0; border-bottom: 1px solid #f9f9f9;">📤 <strong>Total Exports:</strong> ${data.summary.totalExports}</li>
              </ul>

              <p style="font-size: 12px; color: #999; margin-top: 20px;">
                Sent to: ${email}
              </p>
            </div>
          `
        })
      );

      await Promise.all(emailPromises);

      return { success: true, message: "Report sent to admins via Resend." };
    } catch (error) {
      console.error("Resend API error:", error);
      throw new Error("Failed to send email via Resend.");
    }
  }
};