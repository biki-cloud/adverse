import { clickAd } from '@/server/functions/grid';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

// POST: 広告をクリック
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (typeof body !== 'object' || body === null) {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const { adId, cellId } = body as { adId?: string; cellId?: string };

    if (!adId || !cellId) {
      return Response.json({ error: 'Missing adId or cellId' }, { status: 400 });
    }

    const userAgent = request.headers.get('user-agent') ?? undefined;
    const referrer = request.headers.get('referer') ?? undefined;

    const clickId = await clickAd(adId, cellId, {
      userAgent,
      referrer,
    });

    return Response.json({ success: true, clickId });
  } catch (error) {
    console.error('Error clicking ad:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to click ad';
    return Response.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}

