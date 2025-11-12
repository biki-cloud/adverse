import { updateAd } from '@/server/functions/grid';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// PUT: 広告を更新
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { adId, adData } = body;

    if (!adId || !adData) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await updateAd(adId, adData);
    return Response.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error updating ad:', error);
    return Response.json(
      { error: error.message || 'Failed to update ad' },
      { status: 500 },
    );
  }
}

