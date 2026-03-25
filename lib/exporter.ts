import * as XLSX from 'xlsx';

export interface ExportRow {
  'Business Name': string;
  'Category': string;
  'Address': string;
  'Phone': string;
  'Email': string;
  'Website': string;
  'Distance (km)': number | string;
  'Lead Score': number | string;
  'Lead Status': string;
  'Disaster Title': string;
  'Disaster Type': string;
  'Severity': string;
  'City': string;
  'State': string;
  'Notes': string;
  'Created At': string;
}

export function toExportRows(businesses: any[]): ExportRow[] {
  return businesses.map(b => ({
    'Business Name':  b.business_name  || '',
    'Category':       b.category       || '',
    'Address':        b.address        || '',
    'Phone':          b.phone          || '',
    'Email':          b.email          || '',
    'Website':        b.website        || '',
    'Distance (km)':  b.distance_km    ?? '',
    'Lead Score':     b.lead_score     ?? '',
    'Lead Status':    b.lead_status    || '',
    'Disaster Title': b.disasters?.title         || '',
    'Disaster Type':  b.disasters?.disaster_type || '',
    'Severity':       b.disasters?.severity      || '',
    'City':           b.disasters?.city          || '',
    'State':          b.disasters?.state         || '',
    'Notes':          b.notes || '',
    'Created At':     b.created_at ? new Date(b.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '',
  }));
}

export function exportToCSV(businesses: any[]): string {
  const rows = toExportRows(businesses);
  if (rows.length === 0) return '';

  const headers = Object.keys(rows[0]) as (keyof ExportRow)[];
  const escape = (v: unknown) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const lines = [
    headers.join(','),
    ...rows.map(row => headers.map(h => escape(row[h])).join(',')),
  ];
  return lines.join('\r\n');
}

export function exportToExcel(businesses: any[]): Buffer {
  const rows = toExportRows(businesses);
  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto-width columns
  const colWidths = Object.keys(rows[0] || {}).map(key => ({
    wch: Math.max(key.length, ...rows.map(r => String((r as any)[key] ?? '').length)) + 2,
  }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Leads');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

export function exportToJSON(businesses: any[]): string {
  return JSON.stringify(businesses, null, 2);
}
