import { NextRequest, NextResponse } from 'next/server';
import { sendIncidentReport } from '@/lib/emailReport';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Require CRON_SECRET — prevents unauthorized email spam
  const auth = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await sendIncidentReport(3);
    return NextResponse.json({
      success: true,
      count: result.count,
      message: result.message || `Report complete. Sent ${result.count} leads.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
