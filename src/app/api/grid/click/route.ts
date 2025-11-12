import { clickAd } from '@/server/functions/grid';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// POST: 広告をクリック
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adId, cellId } = body;

    if (!adId || !cellId) {
      return Response.json({ error: 'Missing adId or cellId' }, { status: 400 });
    }

    const userAgent = request.headers.get('user-agent') || undefined;
    const referrer = request.headers.get('referer') || undefined;

    const clickId = await clickAd(adId, cellId, {
      userAgent,
      referrer,
    });

    return Response.json({ success: true, clickId });
  } catch (error: any) {
    console.error('Error clicking ad:', error);
    return Response.json(
      { error: error.message || 'Failed to click ad' },
      { status: 500 },
    );
  }
}

