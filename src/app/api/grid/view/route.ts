import { incrementAdView } from '@/server/functions/grid';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

// POST: 広告のビュー数を増やす
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (typeof body !== 'object' || body === null) {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const { adId } = body as { adId?: string };

    if (!adId) {
      return Response.json({ error: 'Missing adId' }, { status: 400 });
    }

    await incrementAdView(adId);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error incrementing view:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to increment view';
    return Response.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}

