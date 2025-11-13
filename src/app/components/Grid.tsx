'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Cell {
  cellId: string;
  x: number;
  y: number;
  adId: string | null;
  userId: string | null;
  isSpecial: boolean;
}

interface Ad {
  adId: string;
  title: string | null;
  message: string | null;
  targetUrl: string | null;
  color: string;
  clickCount: number;
  viewCount: number;
}

interface GridProps {
  gridSize?: number; // グリッドのサイズ（例: 1000）
  initialCellSize?: number; // 1マスの初期サイズ（ピクセル）
  canvasWidth?: number; // キャンバスの幅（ピクセル）
  canvasHeight?: number; // キャンバスの高さ（ピクセル）
  onRightClick?: (x: number, y: number, ad: Ad | null, userId: string | null) => void; // 右クリック時のコールバック（広告情報とユーザIDも含む）
}

export default function Grid({
  gridSize = 1000,
  initialCellSize = 20,
  canvasWidth = 800,
  canvasHeight = 600,
  onRightClick,
}: GridProps) {
  const [cells, setCells] = useState<Map<string, { cell: Cell; ad: Ad | null }>>(new Map());
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number; ad: Ad | null } | null>(
    null
  );
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  // ピクセル単位のビューポート位置（スムーズな移動のため）
  const [viewportPixel, setViewportPixel] = useState({ x: 0, y: 0 });
  const [cellSize, setCellSize] = useState(initialCellSize);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastViewportPixel, setLastViewportPixel] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ピクセル座標をグリッド座標に変換
  const pixelToGrid = useCallback(
    (pixelX: number, pixelY: number) => {
      const gridX = Math.floor((pixelX - viewportPixel.x) / cellSize);
      const gridY = Math.floor((pixelY - viewportPixel.y) / cellSize);
      return { gridX, gridY };
    },
    [viewportPixel, cellSize]
  );

  // ビューポート内のグリッド範囲を計算
  const getViewportGridBounds = useCallback(() => {
    const minX = Math.max(0, Math.floor(-viewportPixel.x / cellSize));
    const maxX = Math.min(gridSize - 1, Math.ceil((canvasWidth - viewportPixel.x) / cellSize));
    const minY = Math.max(0, Math.floor(-viewportPixel.y / cellSize));
    const maxY = Math.min(gridSize - 1, Math.ceil((canvasHeight - viewportPixel.y) / cellSize));
    return { minX, maxX, minY, maxY };
  }, [viewportPixel, cellSize, canvasWidth, canvasHeight, gridSize]);

  // ビューポート内のセルを取得
  const fetchCells = useCallback(async () => {
    setIsLoading(true);
    try {
      const bounds = getViewportGridBounds();
      const { minX, maxX, minY, maxY } = bounds;

      // バッファを追加してスムーズなスクロールを実現
      const buffer = 5;
      const fetchMinX = Math.max(0, minX - buffer);
      const fetchMaxX = Math.min(gridSize - 1, maxX + buffer);
      const fetchMinY = Math.max(0, minY - buffer);
      const fetchMaxY = Math.min(gridSize - 1, maxY + buffer);

      // 範囲クエリで取得
      const response = await fetch(
        `/api/grid?minX=${fetchMinX}&maxX=${fetchMaxX}&minY=${fetchMinY}&maxY=${fetchMaxY}`
      );
      const rawData = await response.json();
      if (typeof rawData !== 'object' || rawData === null) {
        throw new Error('Invalid response data');
      }
      const data = rawData as {
        cells?: Array<{ cell: Cell; ad: Ad | null } | Cell>;
      };

      const newCells = new Map<string, { cell: Cell; ad: Ad | null }>();

      // 取得したセルをマップに追加
      if (data.cells && Array.isArray(data.cells)) {
        for (const item of data.cells) {
          // APIから { cell, ad } の形式で返ってくる
          const cell = (item as { cell?: Cell; ad?: Ad | null }).cell ?? (item as Cell);
          const ad = (item as { cell?: Cell; ad?: Ad | null }).ad ?? null;
          newCells.set(cell.cellId, { cell, ad });
        }
      }

      setCells(newCells);
    } catch (error) {
      console.error('Error fetching cells:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getViewportGridBounds, gridSize]);

  useEffect(() => {
    void fetchCells();
  }, [fetchCells]);

  // キャンバスに描画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const bounds = getViewportGridBounds();
    const { minX, maxX, minY, maxY } = bounds;

    // ビューポート内のセルを描画
    for (let gridX = minX; gridX <= maxX; gridX++) {
      for (let gridY = minY; gridY <= maxY; gridY++) {
        const cellKey = `${gridX}_${gridY}`;
        const cellData = cells.get(cellKey);

        // ピクセル座標を計算
        const pixelX = gridX * cellSize + viewportPixel.x;
        const pixelY = gridY * cellSize + viewportPixel.y;

        // 画面外のセルはスキップ
        if (
          pixelX + cellSize < 0 ||
          pixelX > canvasWidth ||
          pixelY + cellSize < 0 ||
          pixelY > canvasHeight
        ) {
          continue;
        }

        // セルの背景
        if (cellData?.cell.adId && cellData?.ad) {
          // 広告があるセルは広告の色を使用
          ctx.fillStyle = cellData.ad.color || '#dbeafe';
        } else {
          ctx.fillStyle = '#f3f4f6'; // 空きセルはグレー
        }

        ctx.fillRect(pixelX, pixelY, cellSize - 1, cellSize - 1);

        // 選択中のセルをハイライト
        if (selectedCell && selectedCell.x === gridX && selectedCell.y === gridY) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.strokeRect(pixelX, pixelY, cellSize - 1, cellSize - 1);
        }

        // グリッド線
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.strokeRect(pixelX, pixelY, cellSize - 1, cellSize - 1);
      }
    }
  }, [
    cells,
    viewportPixel,
    selectedCell,
    cellSize,
    canvasWidth,
    canvasHeight,
    getViewportGridBounds,
  ]);

  // ドラッグ開始
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return; // 左クリックのみ
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setLastViewportPixel({ ...viewportPixel });
    e.preventDefault();
  };

  // ドラッグ中
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      setViewportPixel({
        x: lastViewportPixel.x + deltaX,
        y: lastViewportPixel.y + deltaY,
      });
      return;
    }

    // ホバー処理
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const { gridX, gridY } = pixelToGrid(mouseX, mouseY);

    if (gridX >= 0 && gridX < gridSize && gridY >= 0 && gridY < gridSize) {
      const cellKey = `${gridX}_${gridY}`;
      const cellData = cells.get(cellKey);

      if (cellData?.ad) {
        setHoveredCell({ x: gridX, y: gridY, ad: cellData.ad });
        setHoverPosition({ x: e.clientX, y: e.clientY });

        // ツールチップの位置を計算（マウスカーソルのすぐ近くに表示）
        const tooltipWidth = 250;
        const tooltipHeight = 150;
        // マウスカーソルからの距離（この値を変更すると位置が変わります）
        const offsetX = 8;
        const offsetY = 8;

        // マウスの位置からオフセット分だけ右下に表示
        let left = e.clientX + offsetX;
        let top = e.clientY + offsetY;

        // 画面右端に近い場合は左側に表示
        if (left + tooltipWidth > window.innerWidth) {
          left = e.clientX - tooltipWidth - offsetX;
        }

        // 画面下端に近い場合は上側に表示
        if (top + tooltipHeight > window.innerHeight) {
          top = e.clientY - tooltipHeight - offsetY;
        }

        // 最小マージンを確保（画面外に出ないように）
        left = Math.max(5, Math.min(left, window.innerWidth - tooltipWidth - 5));
        top = Math.max(5, Math.min(top, window.innerHeight - tooltipHeight - 5));

        setTooltipStyle({
          left: `${left}px`,
          top: `${top}px`,
          position: 'fixed' as const,
        });
      } else {
        setHoveredCell(null);
        setHoverPosition(null);
      }
    } else {
      setHoveredCell(null);
      setHoverPosition(null);
    }
  };

  // マウスがキャンバスから離れた時
  const handleMouseLeave = () => {
    setHoveredCell(null);
    setHoverPosition(null);
  };

  // ドラッグ終了
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // グローバルマウス移動とリリースを監視
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      setViewportPixel({
        x: lastViewportPixel.x + deltaX,
        y: lastViewportPixel.y + deltaY,
      });
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStart.x, dragStart.y, lastViewportPixel.x, lastViewportPixel.y]);

  // マウスホイールでズーム
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // マウス位置のグリッド座標を計算（ズーム前）
    const gridX = (mouseX - viewportPixel.x) / cellSize;
    const gridY = (mouseY - viewportPixel.y) / cellSize;

    // ズーム量を計算
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newCellSize = Math.max(5, Math.min(100, cellSize * zoomFactor));

    // マウス位置を中心にズーム
    const newViewportPixelX = mouseX - gridX * newCellSize;
    const newViewportPixelY = mouseY - gridY * newCellSize;

    setCellSize(newCellSize);
    setViewportPixel({
      x: newViewportPixelX,
      y: newViewportPixelY,
    });
  };

  // 右クリック処理
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const { gridX, gridY } = pixelToGrid(mouseX, mouseY);

    if (gridX >= 0 && gridX < gridSize && gridY >= 0 && gridY < gridSize) {
      // セルの広告情報とユーザIDを取得
      const cellKey = `${gridX}_${gridY}`;
      const cellData = cells.get(cellKey);
      const ad = cellData?.ad ?? null;
      const userId = cellData?.cell.userId ?? null;

      // 右クリックコールバックを呼び出す（広告情報とユーザIDも含む）
      if (onRightClick) {
        onRightClick(gridX, gridY, ad, userId);
      }
    }
  };

  // マウスクリック処理（ドラッグでない場合のみ）
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // ドラッグ中はクリックとして扱わない
    if (isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const { gridX, gridY } = pixelToGrid(mouseX, mouseY);

    if (gridX >= 0 && gridX < gridSize && gridY >= 0 && gridY < gridSize) {
      setSelectedCell({ x: gridX, y: gridY });

      // 広告がある場合はクリック処理
      const cellKey = `${gridX}_${gridY}`;
      const cellData = cells.get(cellKey);
      if (cellData?.ad) {
        // 広告をクリック
        void fetch('/api/grid/click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adId: cellData.ad.adId,
            cellId: cellData.cell.cellId,
          }),
        });

        // 広告のURLを開く（URLがある場合のみ）
        if (cellData.ad.targetUrl) {
          window.open(cellData.ad.targetUrl, '_blank');
        }
      }
    }
  };

  // ビューポートの境界を制限
  useEffect(() => {
    const maxX = (gridSize - 1) * cellSize;
    const maxY = (gridSize - 1) * cellSize;

    setViewportPixel((prev) => ({
      x: Math.max(-maxX, Math.min(0, prev.x)),
      y: Math.max(-maxY, Math.min(0, prev.y)),
    }));
  }, [cellSize, gridSize]);

  const selectedCellData = selectedCell ? cells.get(`${selectedCell.x}_${selectedCell.y}`) : null;

  const bounds = getViewportGridBounds();
  const centerGridX = Math.floor((bounds.minX + bounds.maxX) / 2);
  const centerGridY = Math.floor((bounds.minY + bounds.maxY) / 2);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full text-center">
        <div className="glass mb-3 inline-flex items-center gap-3 rounded-full px-4 py-2 shadow-md">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-indigo-600">📍</span>
            <span className="font-medium text-gray-700">
              中心位置:{' '}
              <span className="font-mono text-indigo-600">
                ({centerGridX}, {centerGridY})
              </span>
            </span>
          </div>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-purple-600">🔍</span>
            <span className="font-medium text-gray-700">
              ズーム:{' '}
              <span className="font-mono text-purple-600">{cellSize.toFixed(1)}px/マス</span>
            </span>
          </div>
          {isDragging && (
            <>
              <span className="text-gray-300">|</span>
              <span className="animate-pulse font-semibold text-pink-600">ドラッグ中...</span>
            </>
          )}
        </div>
      </div>

      <div ref={containerRef} className="relative">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
          onClick={handleCanvasClick}
          onContextMenu={handleContextMenu}
          className="rounded-xl border-2 border-gray-200 bg-white shadow-2xl"
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
            imageRendering: 'pixelated',
            touchAction: 'none',
          }}
        />
        {/* ホバーツールチップ */}
        {hoveredCell?.ad && hoverPosition && (
          <div
            className="glass animate-fade-in pointer-events-none fixed z-50 max-w-xs rounded-xl border border-white/50 p-4 shadow-2xl"
            style={tooltipStyle}
          >
            <div className="mb-3 flex items-center gap-3">
              <div
                className="h-5 w-5 flex-shrink-0 rounded-lg border-2 border-white shadow-md"
                style={{ backgroundColor: hoveredCell.ad.color }}
              />
              {hoveredCell.ad.title && (
                <h4 className="truncate text-sm font-bold text-gray-800">{hoveredCell.ad.title}</h4>
              )}
            </div>
            {hoveredCell.ad.message && (
              <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-gray-600">
                {hoveredCell.ad.message}
              </p>
            )}
            <div className="mb-2 flex gap-4 text-xs">
              <div className="flex items-center gap-1 font-semibold text-indigo-600">
                <span>👆</span>
                <span>{hoveredCell.ad.clickCount}</span>
              </div>
              <div className="flex items-center gap-1 font-semibold text-purple-600">
                <span>👁</span>
                <span>{hoveredCell.ad.viewCount}</span>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <p className="font-mono text-xs text-gray-500">
                ({hoveredCell.x}, {hoveredCell.y})
              </p>
            </div>
          </div>
        )}
        {isLoading && (
          <div className="glass absolute right-3 top-3 animate-pulse rounded-lg border border-white/50 px-4 py-2 text-sm font-medium shadow-lg">
            <span className="font-semibold text-gray-700">⏳ 読み込み中...</span>
          </div>
        )}
      </div>

      {selectedCell && (
        <div className="glass animate-slide-up mt-6 max-w-md rounded-xl border border-white/50 p-5 shadow-xl">
          <div className="mb-4 flex items-center gap-2 border-b border-gray-200 pb-3">
            <span className="text-xl">📍</span>
            <h3 className="text-lg font-bold text-gray-800">
              セル{' '}
              <span className="font-mono text-indigo-600">
                ({selectedCell.x}, {selectedCell.y})
              </span>
            </h3>
          </div>
          {selectedCellData?.ad ? (
            <div className="space-y-3">
              <div className="mb-3 flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-lg border-2 border-white shadow-md"
                  style={{ backgroundColor: selectedCellData.ad.color }}
                />
                {selectedCellData.ad.title && (
                  <p className="text-lg font-bold text-gray-800">{selectedCellData.ad.title}</p>
                )}
              </div>
              {selectedCellData.ad.message && (
                <p className="rounded-lg bg-gray-50 p-3 text-sm leading-relaxed text-gray-600">
                  {selectedCellData.ad.message}
                </p>
              )}
              <div className="flex gap-4 pt-2 text-sm">
                <div className="flex items-center gap-2 font-semibold text-indigo-600">
                  <span>👆</span>
                  <span>{selectedCellData.ad.clickCount}</span>
                </div>
                <div className="flex items-center gap-2 font-semibold text-purple-600">
                  <span>👁</span>
                  <span>{selectedCellData.ad.viewCount}</span>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <p className="mb-3 font-mono text-xs text-gray-500">
                  色: {selectedCellData.ad.color}
                </p>
                {selectedCellData.ad.targetUrl && (
                  <a
                    href={selectedCellData.ad.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex transform items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:scale-105 hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg"
                  >
                    <span>🚀</span>
                    <span>広告を見る</span>
                    <span>→</span>
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="mb-2 text-lg text-gray-500">このマスは空いています</p>
              <p className="text-sm text-gray-400">右クリックで広告を配置できます</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
