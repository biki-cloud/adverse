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
    const { adId, userId, adData } = body as {
      adId?: string;
      userId?: string;
      adData?: {
        name?: string;
        title?: string;
        message?: string;
        targetUrl?: string;
        color?: string;
      };
    };

    if (!adId || !userId || !adData) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await updateAd(adId, userId, adData);
    return Response.json({ success: true, ...result });
  } catch (error) {
    console.error('Error updating ad:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update ad';
    // 権限エラーの場合は403を返す
    const status = errorMessage.includes('権限') ? 403 : 500;
    return Response.json({ error: errorMessage }, { status });
  }
}
