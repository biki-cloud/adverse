import { incrementAdView } from '@/server/functions/grid';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// POST: 広告のビュー数を増やす
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adId } = body;

    if (!adId) {
      return Response.json({ error: 'Missing adId' }, { status: 400 });
    }

    await incrementAdView(adId);
    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Error incrementing view:', error);
    return Response.json(
      { error: error.message || 'Failed to increment view' },
      { status: 500 },
    );
  }
}

