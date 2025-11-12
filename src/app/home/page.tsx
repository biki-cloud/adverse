'use client';

import { useState } from 'react';
import Grid from '@/app/components/Grid';

export default function Home() {
  const [showPlaceForm, setShowPlaceForm] = useState(false);
  const [formData, setFormData] = useState({
    x: '',
    y: '',
    userId: '',
    title: '',
    message: '',
    imageUrl: '',
    targetUrl: '',
    color: '#3b82f6', // デフォルトは青
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAdId, setEditingAdId] = useState<string | null>(null); // 編集中の広告ID

  // 右クリックでフォームを開く
  const handleGridRightClick = (x: number, y: number, ad: {
    adId: string;
    title: string;
    message: string | null;
    imageUrl: string | null;
    targetUrl: string;
    color: string;
  } | null) => {
    if (ad) {
      // 既存の広告を編集
      setFormData({
        x: x.toString(),
        y: y.toString(),
        userId: '', // 編集時はユーザーIDは変更しない
        title: ad.title ?? '',
        message: ad.message ?? '',
        imageUrl: ad.imageUrl ?? '',
        targetUrl: ad.targetUrl ?? '',
        color: ad.color ?? '#3b82f6',
      });
      setEditingAdId(ad.adId);
    } else {
      // 新規作成
      setFormData({
        x: x.toString(),
        y: y.toString(),
        userId: '',
        title: '',
        message: '',
        imageUrl: '',
        targetUrl: '',
        color: '#3b82f6',
      });
      setEditingAdId(null);
    }
    setShowPlaceForm(true);
  };

  const handlePlaceAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingAdId) {
        // 既存の広告を更新
        const response = await fetch('/api/grid/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adId: editingAdId,
            adData: {
              title: formData.title,
              message: formData.message || undefined,
              imageUrl: formData.imageUrl || undefined,
              targetUrl: formData.targetUrl,
              color: formData.color,
            },
          }),
        });

        const rawResult = await response.json();
        if (typeof rawResult !== 'object' || rawResult === null) {
          alert('エラー: 無効なレスポンス');
          return;
        }
        const result = rawResult as { error?: string };

        if (result.error) {
          alert(`エラー: ${result.error}`);
        } else {
          alert('広告を更新しました！');
          setShowPlaceForm(false);
          setEditingAdId(null);
          setFormData({
            x: '',
            y: '',
            userId: '',
            title: '',
            message: '',
            imageUrl: '',
            targetUrl: '',
            color: '#3b82f6',
          });
          // ページをリロードしてグリッドを更新
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
      } else {
        // 新規作成
        const response = await fetch('/api/grid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            x: parseInt(formData.x),
            y: parseInt(formData.y),
            userId: formData.userId || `user_${Date.now()}`,
            adData: {
              title: formData.title,
              message: formData.message || undefined,
              imageUrl: formData.imageUrl || undefined,
              targetUrl: formData.targetUrl,
              color: formData.color,
            },
          }),
        });

        const rawResult = await response.json();
        if (typeof rawResult !== 'object' || rawResult === null) {
          alert('エラー: 無効なレスポンス');
          return;
        }
        const result = rawResult as { error?: string };

        if (result.error) {
          alert(`エラー: ${result.error}`);
        } else {
          alert('広告を配置しました！');
          setShowPlaceForm(false);
          setFormData({
            x: '',
            y: '',
            userId: '',
            title: '',
            message: '',
            imageUrl: '',
            targetUrl: '',
            color: '#3b82f6',
          });
          // ページをリロードしてグリッドを更新
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
      }
    } catch (error) {
      console.error('Error placing/updating ad:', error);
      alert(editingAdId ? '広告の更新に失敗しました' : '広告の配置に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🌍 AdVerse
          </h1>
          <p className="text-xl text-gray-700 mb-2">
            世界中のユーザーが1マスずつ埋めていく、参加型の広告宇宙
          </p>
          <p className="text-gray-600">
            1000×1000マスの巨大グリッドで、あなたの広告を配置しよう
          </p>
        </div>

        <div className="flex justify-center mb-6">
          <p className="text-gray-600">
            💡 グリッド上で<strong>右クリック</strong>して広告を配置できます
          </p>
        </div>

        {/* 右側にスライドインするフォームパネル */}
        <div
          className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto ${
            showPlaceForm ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {showPlaceForm && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">
                  {editingAdId ? '広告を編集' : '広告を配置'}
                </h2>
                <button
                  onClick={() => {
                    setShowPlaceForm(false);
                    setEditingAdId(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                  type="button"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handlePlaceAd} className="space-y-4">
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  📍 配置位置: ({formData.x || '?'}, {formData.y || '?'})
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {editingAdId
                    ? '編集モード: 位置は変更できません'
                    : 'グリッド上で右クリックした位置に自動設定されます'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    X座標
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={formData.x}
                    onChange={(e) => setFormData({ ...formData, x: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                    required
                    readOnly={!!editingAdId}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Y座標
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={formData.y}
                    onChange={(e) => setFormData({ ...formData, y: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                    required
                    readOnly={!!editingAdId}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ユーザーID（空欄可、自動生成されます）
                </label>
                <input
                  type="text"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="user_123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  タイトル *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メッセージ
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  画像URL
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://example.com/image.png"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  リンク先URL *
                </label>
                <input
                  type="url"
                  value={formData.targetUrl}
                  onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  広告の色 *
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                    placeholder="#3b82f6"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  グリッド上でこの色で表示されます
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? editingAdId
                    ? '更新中...'
                    : '配置中...'
                  : editingAdId
                    ? '広告を更新'
                    : '広告を配置'}
              </button>
              </form>
            </div>
          )}
        </div>

        {/* フォームが開いている時のオーバーレイ */}
        {showPlaceForm && (
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={() => setShowPlaceForm(false)}
          />
        )}

        <div className="bg-white rounded-lg shadow-xl p-4">
          <Grid
            gridSize={1000}
            initialCellSize={20}
            canvasWidth={1000}
            canvasHeight={700}
            onRightClick={handleGridRightClick}
          />
        </div>

        <div className="mt-8 text-center text-gray-600">
          <p className="mb-2">
            💡 <strong>使い方:</strong> マウスでドラッグして移動、ホイールでズーム、左クリックで広告を選択、<strong>右クリックで広告を配置</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
