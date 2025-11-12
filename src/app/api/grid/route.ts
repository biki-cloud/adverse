import { getGridCells, getCell, placeAdOnCell, getAd } from '@/server/functions/grid';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

// GET: グリッドセルを取得
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const x = searchParams.get('x');
  const y = searchParams.get('y');
  const minX = searchParams.get('minX');
  const maxX = searchParams.get('maxX');
  const minY = searchParams.get('minY');
  const maxY = searchParams.get('maxY');

  try {
    if (x && y) {
      // 特定のセルを取得
      const cell = await getCell(parseInt(x), parseInt(y));
      if (!cell) {
        return Response.json({ cell: null });
      }

      // 広告情報も取得
      let ad = null;
      if (cell.adId) {
        ad = await getAd(cell.adId);
      }

      return Response.json({ cell, ad });
    } else if (minX && maxX && minY && maxY) {
      // 範囲で取得
      const cells = await getGridCells(
        parseInt(minX),
        parseInt(maxX),
        parseInt(minY),
        parseInt(maxY),
      );

      // 広告情報も一緒に取得
      const cellsWithAds = await Promise.all(
        cells.map(async (cell) => {
          let ad = null;
          if (cell.adId) {
            ad = await getAd(cell.adId);
          }
          return { cell, ad };
        }),
      );

      return Response.json({ cells: cellsWithAds });
    } else {
      // 全て取得（パフォーマンス注意）
      const cells = await getGridCells();
      return Response.json({ cells });
    }
  } catch (error) {
    console.error('Error fetching grid:', error);
    return Response.json({ error: 'Failed to fetch grid' }, { status: 500 });
  }
}

// POST: 広告を配置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (typeof body !== 'object' || body === null) {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const { x, y, userId, adData } = body as {
      x?: number;
      y?: number;
      userId?: string;
      adData?: {
        title: string;
        message?: string;
        imageUrl?: string;
        targetUrl: string;
        color?: string;
      };
    };

    if (!x || !y || !userId || !adData) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await placeAdOnCell(x, y, userId, adData);
    return Response.json({ success: true, ...result });
  } catch (error) {
    console.error('Error placing ad:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to place ad';
    return Response.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}

