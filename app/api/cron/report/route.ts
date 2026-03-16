import { NextResponse } from 'next/server';
import { sendIncidentReport } from '@/lib/emailReport';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Optional: Add a simple secret check for security
  // const authHeader = request.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response('Unauthorized', { status: 401 });
  // }

  try {
    console.log(`[Cron Report] Starting report job...`);
    const result = await sendIncidentReport(3);
    
    return NextResponse.json({ 
      success: true, 
      count: result.count,
      message: result.message || `Report job complete. Sent ${result.count} leads.`
    });
  } catch (error: any) {
    console.error(`[Cron Report Error]:`, error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
