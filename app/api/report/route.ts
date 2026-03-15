import { NextResponse } from 'next/server';
import { sendIncidentReport } from '@/lib/emailReport';

export async function POST() {
  try {
    console.log('[Manual Report] Triggering email report generation...');
    const result = await sendIncidentReport(3);

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: `Report processed. ${result.count} new leads were included.` 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: "Failed to generate or send report",
        details: result.error
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[Manual Report Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
