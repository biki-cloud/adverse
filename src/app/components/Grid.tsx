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
  clickCount: number;
  viewCount: number;
}

interface GridProps {
  gridSize?: number; // グリッドのサイズ（例: 1000）
  cellSize?: number; // 1マスのサイズ（ピクセル）
  viewportSize?: number; // 表示するマスの数（例: 50x50）
}

export default function Grid({
  gridSize = 1000,
  cellSize = 20,
  viewportSize = 50,
}: GridProps) {
  const [cells, setCells] = useState<Map<string, { cell: Cell; ad: Ad | null }>>(new Map());
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ビューポート内のセルを取得
  const fetchCells = useCallback(async () => {
    setIsLoading(true);
    try {
      const minX = viewport.x;
      const maxX = Math.min(viewport.x + viewportSize - 1, gridSize - 1);
      const minY = viewport.y;
      const maxY = Math.min(viewport.y + viewportSize - 1, gridSize - 1);

      // 範囲クエリで取得
      const response = await fetch(
        `/api/grid?minX=${minX}&maxX=${maxX}&minY=${minY}&maxY=${maxY}`,
      );
      const data = await response.json();

      const newCells = new Map<string, { cell: Cell; ad: Ad | null }>();

      // 取得したセルをマップに追加
      if (data.cells && Array.isArray(data.cells)) {
        for (const item of data.cells) {
          // APIから { cell, ad } の形式で返ってくる
          const cell = item.cell || item; // 後方互換性のため
          const ad = item.ad || null;
          newCells.set(cell.cellId, { cell, ad });
        }
      }

      setCells(newCells);
    } catch (error) {
      console.error('Error fetching cells:', error);
    } finally {
      setIsLoading(false);
    }
  }, [viewport, viewportSize, gridSize]);

  useEffect(() => {
    fetchCells();
  }, [fetchCells]);

  // キャンバスに描画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // グリッドを描画
    for (let x = 0; x < viewportSize; x++) {
      for (let y = 0; y < viewportSize; y++) {
        const gridX = viewport.x + x;
        const gridY = viewport.y + y;
        const cellKey = `${gridX}_${gridY}`;
        const cellData = cells.get(cellKey);

        const pixelX = x * cellSize;
        const pixelY = y * cellSize;

        // セルの背景
        if (cellData?.cell.isSpecial) {
          ctx.fillStyle = '#fef3c7'; // 創世エリアは黄色
        } else if (cellData?.cell.adId) {
          ctx.fillStyle = '#dbeafe'; // 広告があるセルは青
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
  }, [cells, viewport, selectedCell, cellSize, viewportSize]);

  // マウスクリック処理
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);

    const gridX = viewport.x + x;
    const gridY = viewport.y + y;

    if (gridX >= 0 && gridX < gridSize && gridY >= 0 && gridY < gridSize) {
      setSelectedCell({ x: gridX, y: gridY });

      // 広告がある場合はクリック処理
      const cellKey = `${gridX}_${gridY}`;
      const cellData = cells.get(cellKey);
      if (cellData?.ad) {
        // 広告をクリック
        fetch('/api/grid/click', {
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

  // スクロール処理（簡易実装）
  const handleScroll = (direction: 'up' | 'down' | 'left' | 'right') => {
    setViewport((prev) => {
      let newX = prev.x;
      let newY = prev.y;

      switch (direction) {
        case 'up':
          newY = Math.max(0, prev.y - 10);
          break;
        case 'down':
          newY = Math.min(gridSize - viewportSize, prev.y + 10);
          break;
        case 'left':
          newX = Math.max(0, prev.x - 10);
          break;
        case 'right':
          newX = Math.min(gridSize - viewportSize, prev.x + 10);
          break;
      }

      return { x: newX, y: newY };
    });
  };

  const selectedCellData = selectedCell
    ? cells.get(`${selectedCell.x}_${selectedCell.y}`)
    : null;

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">AdVerse - 広告宇宙</h2>
        <p className="text-gray-600">
          位置: ({viewport.x}, {viewport.y}) - ({viewport.x + viewportSize},{' '}
          {viewport.y + viewportSize})
        </p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => handleScroll('left')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          ←
        </button>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => handleScroll('up')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            ↑
          </button>
          <canvas
            ref={canvasRef}
            width={viewportSize * cellSize}
            height={viewportSize * cellSize}
            onClick={handleCanvasClick}
            className="border-2 border-gray-300 cursor-pointer"
            style={{ imageRendering: 'pixelated' }}
          />
          <button
            onClick={() => handleScroll('down')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            ↓
          </button>
        </div>
        <button
          onClick={() => handleScroll('right')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          →
        </button>
      </div>

      {isLoading && <p className="text-gray-500">読み込み中...</p>}

      {selectedCell && (
        <div className="mt-4 p-4 bg-white border-2 border-gray-300 rounded-lg max-w-md">
          <h3 className="font-bold text-lg mb-2">
            セル ({selectedCell.x}, {selectedCell.y})
          </h3>
          {selectedCellData?.ad ? (
            <div>
              <p className="font-semibold">{selectedCellData.ad.title}</p>
              {selectedCellData.ad.message && (
                <p className="text-gray-600 mt-1">{selectedCellData.ad.message}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                クリック数: {selectedCellData.ad.clickCount} | 閲覧数:{' '}
                {selectedCellData.ad.viewCount}
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

