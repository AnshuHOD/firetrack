import nodemailer from 'nodemailer';
import { supabase } from './db';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.REPORT_EMAIL_FROM,
    pass: process.env.REPORT_EMAIL_PASSWORD,
  },
});

export async function sendIncidentReport(periodHours: number = 3) {
  // Query businesses that haven't been emailed yet, joined with their disaster
  const { data: newLeads, error } = await supabase
    .from('businesses')
    .select('*, disasters(*)')
    .eq('emailed_in_report', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch unreported businesses:', error);
    return { success: false, error };
  }

  if (!newLeads || newLeads.length === 0) {
    console.log('No new leads to report.');
    return { success: true, count: 0, message: 'No new leads found in this cycle.' };
  }

  const severityColor = (s: string) => {
    if (s === 'Critical' || s === 'High') return '#ef4444';
    if (s === 'Medium') return '#f97316';
    return '#22c55e';
  };

  const tableRows = newLeads.map((lead: any) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 8px; font-size:13px;">
        ${lead.disasters?.published_at
          ? new Date(lead.disasters.published_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
          : '—'}
      </td>
      <td style="padding: 8px; font-size:13px;">
        ${[lead.disasters?.city, lead.disasters?.state].filter(Boolean).join(', ') || '—'}
      </td>
      <td style="padding: 8px; font-size:13px;">
        <strong>${lead.business_name || '—'}</strong><br/>
        <span style="color:#888;">${lead.category || ''}</span>
      </td>
      <td style="padding: 8px; font-size:13px; color:${severityColor(lead.disasters?.severity || '')}; font-weight:bold;">
        ${lead.disasters?.severity || '—'}
      </td>
      <td style="padding: 8px; font-size:13px;">
        ${lead.phone || '—'}<br/>
        <span style="color:#666;">${lead.email || ''}</span>
      </td>
      <td style="padding: 8px; font-size:13px;">
        ${lead.disasters?.source_url
          ? `<a href="${lead.disasters.source_url}" style="color:#3b82f6;">Source</a>`
          : '—'}
      </td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 860px; margin: 0 auto; color: #111;">
      <h2 style="color:#d32f2f; border-bottom: 2px solid #d32f2f; padding-bottom: 8px;">
        🚨 DisasterLeadTracker — ${periodHours}-Hour Report
      </h2>
      <p style="color:#666; font-size:13px;">
        Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
      </p>
      <div style="background:#fff3e0; padding:14px; border-radius:8px; margin:16px 0; border-left:4px solid #f97316;">
        <strong>Summary:</strong> ${newLeads.length} new business leads detected near disaster zones in the last ${periodHours} hour(s).
      </div>
      <h3 style="margin-top:24px;">📋 Business Leads</h3>
      <table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px;">
        <thead style="background:#f5f5f5;">
          <tr>
            <th style="padding:10px 8px;">Time</th>
            <th style="padding:10px 8px;">Location</th>
            <th style="padding:10px 8px;">Business</th>
            <th style="padding:10px 8px;">Severity</th>
            <th style="padding:10px 8px;">Contact</th>
            <th style="padding:10px 8px;">Source</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div style="margin-top:30px; font-size:11px; color:#999; border-top:1px solid #eee; padding-top:10px;">
        Automated report from DisasterLeadTracker India.
      </div>
    </div>
  `;

  try {
    if (process.env.REPORT_EMAIL_FROM && process.env.REPORT_EMAIL_PASSWORD && process.env.AUTHORITY_EMAIL) {
      await transporter.sendMail({
        from: `"DisasterLeadTracker" <${process.env.REPORT_EMAIL_FROM}>`,
        to: process.env.AUTHORITY_EMAIL,
        subject: `🚨 [ALERT] ${newLeads.length} New Business Leads — ${new Date().toLocaleDateString('en-IN')}`,
        html,
      });
    }

    // Mark all as emailed
    const leadIds = newLeads.map((l: any) => l.id);
    await supabase.from('businesses').update({ emailed_in_report: true }).in('id', leadIds);

    // Log the report
    await supabase.from('email_reports').insert([{
      recipient_email: process.env.AUTHORITY_EMAIL || 'test@local',
      disasters_count: new Set(newLeads.map((l: any) => l.disaster_id)).size,
      leads_count: newLeads.length,
      status: 'sent',
    }]);

    return { success: true, count: newLeads.length };
  } catch (err: any) {
    console.error('Error sending email report:', err);

    await supabase.from('email_reports').insert([{
      recipient_email: process.env.AUTHORITY_EMAIL || 'test@local',
      disasters_count: 0,
      leads_count: newLeads.length,
      status: 'failed',
      error_message: err.message,
    }]);

    return { success: false, error: err };
  }
}
