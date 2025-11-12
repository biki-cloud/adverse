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
  title: string;
  message: string | null;
  imageUrl: string | null;
  targetUrl: string;
  color: string;
  clickCount: number;
  viewCount: number;
}

interface GridProps {
  gridSize?: number; // グリッドのサイズ（例: 1000）
  initialCellSize?: number; // 1マスの初期サイズ（ピクセル）
  canvasWidth?: number; // キャンバスの幅（ピクセル）
  canvasHeight?: number; // キャンバスの高さ（ピクセル）
  onRightClick?: (x: number, y: number, ad: Ad | null) => void; // 右クリック時のコールバック（広告情報も含む）
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
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number; ad: Ad | null } | null>(null);
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
    [viewportPixel, cellSize],
  );


  // ビューポート内のグリッド範囲を計算
  const getViewportGridBounds = useCallback(() => {
    const minX = Math.max(0, Math.floor(-viewportPixel.x / cellSize));
    const maxX = Math.min(
      gridSize - 1,
      Math.ceil((canvasWidth - viewportPixel.x) / cellSize),
    );
    const minY = Math.max(0, Math.floor(-viewportPixel.y / cellSize));
    const maxY = Math.min(
      gridSize - 1,
      Math.ceil((canvasHeight - viewportPixel.y) / cellSize),
    );
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
        `/api/grid?minX=${fetchMinX}&maxX=${fetchMaxX}&minY=${fetchMinY}&maxY=${fetchMaxY}`,
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
  }, [cells, viewportPixel, selectedCell, cellSize, canvasWidth, canvasHeight, getViewportGridBounds]);

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
        
        // ツールチップの位置を計算（画面外に出ないように）
        const tooltipWidth = 250;
        const tooltipHeight = 150;
        const left = e.clientX + 15;
        const top = e.clientY + 15;
        
        setTooltipStyle({
          left: `${Math.min(left, window.innerWidth - tooltipWidth)}px`,
          top: `${Math.min(top, window.innerHeight - tooltipHeight)}px`,
          transform: left + tooltipWidth > window.innerWidth ? 'translateX(-100%)' : 'translateX(0)',
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
      // セルの広告情報を取得
      const cellKey = `${gridX}_${gridY}`;
      const cellData = cells.get(cellKey);
      const ad = cellData?.ad ?? null;

      // 右クリックコールバックを呼び出す（広告情報も含む）
      if (onRightClick) {
        onRightClick(gridX, gridY, ad);
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

        // 広告のURLを開く
        window.open(cellData.ad.targetUrl, '_blank');
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

  const selectedCellData = selectedCell
    ? cells.get(`${selectedCell.x}_${selectedCell.y}`)
    : null;

  const bounds = getViewportGridBounds();
  const centerGridX = Math.floor((bounds.minX + bounds.maxX) / 2);
  const centerGridY = Math.floor((bounds.minY + bounds.maxY) / 2);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">AdVerse - 広告宇宙</h2>
        <p className="text-gray-600 text-sm">
          中心位置: ({centerGridX}, {centerGridY}) | ズーム: {cellSize.toFixed(1)}px/マス |{' '}
          {isDragging ? 'ドラッグ中...' : 'ドラッグで移動、ホイールでズーム'}
        </p>
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
          className="border-2 border-gray-300 rounded-lg shadow-lg"
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
            imageRendering: 'pixelated',
            touchAction: 'none',
          }}
        />
        {/* ホバーツールチップ */}
        {hoveredCell?.ad && hoverPosition && (
          <div
            className="fixed z-50 bg-white border-2 border-gray-300 rounded-lg shadow-xl p-3 pointer-events-none max-w-xs"
            style={tooltipStyle}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-4 h-4 rounded border border-gray-300 flex-shrink-0"
                style={{ backgroundColor: hoveredCell.ad.color }}
              />
              <h4 className="font-bold text-sm truncate">{hoveredCell.ad.title}</h4>
            </div>
            {hoveredCell.ad.message && (
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                {hoveredCell.ad.message}
              </p>
            )}
            <div className="flex gap-3 text-xs text-gray-500">
              <span>👆 {hoveredCell.ad.clickCount}</span>
              <span>👁 {hoveredCell.ad.viewCount}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1 font-mono">
              ({hoveredCell.x}, {hoveredCell.y})
            </p>
          </div>
        )}
        {isLoading && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
            読み込み中...
          </div>
        )}
      </div>

      {selectedCell && (
        <div className="mt-4 p-4 bg-white border-2 border-gray-300 rounded-lg max-w-md">
          <h3 className="font-bold text-lg mb-2">
            セル ({selectedCell.x}, {selectedCell.y})
          </h3>
          {selectedCellData?.ad ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-6 h-6 rounded border border-gray-300"
                  style={{ backgroundColor: selectedCellData.ad.color }}
                />
                <p className="font-semibold">{selectedCellData.ad.title}</p>
              </div>
              {selectedCellData.ad.message && (
                <p className="text-gray-600 mt-1">{selectedCellData.ad.message}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                クリック数: {selectedCellData.ad.clickCount} | 閲覧数:{' '}
                {selectedCellData.ad.viewCount}
              </p>
              <p className="text-xs text-gray-400 mt-1 font-mono">
                色: {selectedCellData.ad.color}
              </p>
              <a
                href={selectedCellData.ad.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline mt-2 inline-block"
              >
                広告を見る →
              </a>
            </div>
          ) : (
            <p className="text-gray-500">このマスは空いています</p>
          )}
        </div>
      )}
    </div>
  );
}

