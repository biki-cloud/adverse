import { db } from '@/server/db';
import { gridCellsTable, advertisementsTable, clicksTable } from '@/server/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// グリッドセルを取得（範囲指定可能）
export async function getGridCells(
  minX?: number,
  maxX?: number,
  minY?: number,
  maxY?: number,
) {
  if (
    minX !== undefined &&
    maxX !== undefined &&
    minY !== undefined &&
    maxY !== undefined
  ) {
    // 範囲クエリ
    return await db
      .select()
      .from(gridCellsTable)
      .where(
        and(
          gte(gridCellsTable.x, minX),
          lte(gridCellsTable.x, maxX),
          gte(gridCellsTable.y, minY),
          lte(gridCellsTable.y, maxY),
        ),
      );
  }

  // 全て取得（パフォーマンス注意）
  return await db.select().from(gridCellsTable);
}

// 特定のセルを取得
export async function getCell(x: number, y: number) {
  const cellId = `${x}_${y}`;
  const result = await db
    .select()
    .from(gridCellsTable)
    .where(eq(gridCellsTable.cellId, cellId))
    .limit(1);

  return result[0] || null;
}

// セルに広告を配置
export async function placeAdOnCell(
  x: number,
  y: number,
  userId: string,
  adData: {
    title: string;
    message?: string;
    imageUrl?: string;
    targetUrl: string;
  },
) {
  const cellId = `${x}_${y}`;

  // 既存のセルをチェック
  const existingCell = await getCell(x, y);
  if (existingCell && existingCell.adId) {
    throw new Error('このマスは既に使用されています');
  }

  // 広告を作成
  const adId = nanoid();
  await db.insert(advertisementsTable).values({
    adId,
    userId,
    title: adData.title,
    message: adData.message || null,
    imageUrl: adData.imageUrl || null,
    targetUrl: adData.targetUrl,
    clickCount: 0,
    viewCount: 0,
  });

  // セルを作成または更新
  if (existingCell) {
    await db
      .update(gridCellsTable)
      .set({
        adId,
        userId,
        updatedAt: new Date(),
      })
      .where(eq(gridCellsTable.cellId, cellId));
  } else {
    await db.insert(gridCellsTable).values({
      cellId,
      x,
      y,
      adId,
      userId,
      isSpecial: x < 10 && y < 10, // 最初の10x10は創世エリア
    });
  }

  return { cellId, adId };
}

// 広告をクリック
export async function clickAd(adId: string, cellId: string, metadata?: {
  userAgent?: string;
  referrer?: string;
}) {
  // クリック数を増やす
  const ad = await db
    .select()
    .from(advertisementsTable)
    .where(eq(advertisementsTable.adId, adId))
    .limit(1);

  if (ad[0]) {
    await db
      .update(advertisementsTable)
      .set({
        clickCount: ad[0].clickCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(advertisementsTable.adId, adId));
  }

  // クリックログを記録
  const clickId = nanoid();
  await db.insert(clicksTable).values({
    clickId,
    adId,
    cellId,
    userAgent: metadata?.userAgent || null,
    referrer: metadata?.referrer || null,
    ipAddress: null, // セキュリティのため、必要に応じて実装
  });

  return clickId;
}

// 広告のビュー数を増やす
export async function incrementAdView(adId: string) {
  const ad = await db
    .select()
    .from(advertisementsTable)
    .where(eq(advertisementsTable.adId, adId))
    .limit(1);

  if (ad[0]) {
    await db
      .update(advertisementsTable)
      .set({
        viewCount: ad[0].viewCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(advertisementsTable.adId, adId));
  }
}

// 広告情報を取得
export async function getAd(adId: string) {
  const result = await db
    .select()
    .from(advertisementsTable)
    .where(eq(advertisementsTable.adId, adId))
    .limit(1);

  return result[0] || null;
}

