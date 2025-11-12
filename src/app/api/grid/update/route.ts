import { updateAd } from '@/server/functions/grid';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

// PUT: 広告を更新
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (typeof body !== 'object' || body === null) {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const { adId, adData } = body as {
      adId?: string;
      adData?: {
        title: string;
        message?: string;
        imageUrl?: string;
        targetUrl: string;
        color?: string;
      };
    };

    if (!adId || !adData) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await updateAd(adId, adData);
    return Response.json({ success: true, ...result });
  } catch (error) {
    console.error('Error updating ad:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update ad';
    return Response.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}

