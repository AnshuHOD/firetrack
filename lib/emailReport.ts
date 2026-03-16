import nodemailer from 'nodemailer';
import { supabase } from './db';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.REPORT_EMAIL_FROM,
    pass: process.env.REPORT_EMAIL_PASSWORD, // Use Gmail App Password
  },
});

export async function sendIncidentReport(periodHours: number = 1) {
  const { data: newLeads, error } = await supabase
    .from('leads')
    .select(`*, incidents (*)`)
    .eq('emailed_in_report', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Failed to fetch unreported leads:", error);
    return { success: false, error };
  }

  if (!newLeads || newLeads.length === 0) {
    console.log("No new leads to report.");
    return { success: true, count: 0, message: "No new leads found to report in this cycle." };
  }

  const tableRows = newLeads.map((lead: any) => `
    <tr style="border-bottom: 1px solid #ddd;">
      <td style="padding: 8px;">${new Date(lead.incidents?.published_at).toLocaleString('en-IN')}</td>
      <td style="padding: 8px;">${lead.incidents?.city || 'N/A'}, ${lead.incidents?.state || 'N/A'}</td>
      <td style="padding: 8px;"><strong>${lead.business_name || 'Unknown'}</strong><br/>${lead.business_type || ''}</td>
      <td style="padding: 8px; color:${lead.incidents?.impact_level === 'High' ? '#ef4444' : lead.incidents?.impact_level === 'Medium' ? '#f97316' : '#22c55e'}; font-weight:bold;">
        ${lead.incidents?.impact_level || 'Unknown'}
      </td>
      <td style="padding: 8px;">${lead.contact_phone || 'N/A'}<br/>${lead.contact_email || ''}</td>
      <td style="padding: 8px;"><a href="${lead.incidents?.source_url}" style="color: #3b82f6;">Source</a></td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #333;">
      <h2 style="color: #d32f2f; border-bottom: 2px solid #d32f2f; padding-bottom: 8px;">📍 Incident Tracker — ${periodHours}-Hour Report</h2>
      <p style="color: #666; font-size: 14px;">Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>

      <div style="background: #fff3e0; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #f97316;">
        <strong>Summary:</strong> ${newLeads.length} new incident leads (Fires, Floods, Developments) detected in the last ${periodHours} hour(s).
      </div>

      <h3 style="margin-top: 24px;">📋 Detailed Leads</h3>
      <table style="width:100%; border-collapse: collapse; text-align: left;">
        <thead style="background: #f5f5f5;">
          <tr>
            <th style="padding:10px 8px">Time</th>
            <th style="padding:10px 8px">Location</th>
            <th style="padding:10px 8px">Entity</th>
            <th style="padding:10px 8px">Impact</th>
            <th style="padding:10px 8px">Contact</th>
            <th style="padding:10px 8px">Link</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      <div style="margin-top: 30px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 10px;">
        This is an automated 24/7 report from the Incident Tracker System.
      </div>
    </div>
  `;

  try {
    if (process.env.REPORT_EMAIL_FROM && process.env.REPORT_EMAIL_PASSWORD && process.env.AUTHORITY_EMAIL) {
      await transporter.sendMail({
        from: `"Incident Tracker" <${process.env.REPORT_EMAIL_FROM}>`,
        to: process.env.AUTHORITY_EMAIL,
        subject: `🚨 [ALERT] ${newLeads.length} New Leads Found — ${new Date().toLocaleDateString('en-IN')}`,
        html,
      });
    }

    const leadIds = newLeads.map((l: any) => l.id);
    await supabase.from('leads').update({ emailed_in_report: true }).in('id', leadIds);

    await supabase.from('email_reports').insert([{
      recipient_email: process.env.AUTHORITY_EMAIL || 'test@local',
      incidents_count: newLeads.length,
      leads_count: newLeads.length,
      status: 'sent',
    }]);

    return { success: true, count: newLeads.length };
  } catch(err: any) {
    console.error("Error sending email:", err);
    return { success: false, error: err };
  }
}
