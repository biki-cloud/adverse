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
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePlaceAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
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
          },
        }),
      });

      const result = await response.json();

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
        });
        // ページをリロードしてグリッドを更新
        window.location.reload();
      }
    } catch (error) {
      console.error('Error placing ad:', error);
      alert('広告の配置に失敗しました');
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
          <button
            onClick={() => setShowPlaceForm(!showPlaceForm)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold shadow-lg"
          >
            {showPlaceForm ? 'フォームを閉じる' : '広告を配置する'}
          </button>
        </div>

        {showPlaceForm && (
          <div className="max-w-2xl mx-auto mb-8 bg-white p-6 rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold mb-4">広告を配置</h2>
            <form onSubmit={handlePlaceAd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    X座標 (0-999)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={formData.x}
                    onChange={(e) => setFormData({ ...formData, x: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Y座標 (0-999)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={formData.y}
                    onChange={(e) => setFormData({ ...formData, y: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '配置中...' : '広告を配置'}
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-xl p-4">
          <Grid gridSize={1000} cellSize={15} viewportSize={40} />
        </div>

        <div className="mt-8 text-center text-gray-600">
          <p className="mb-2">
            💡 <strong>使い方:</strong> グリッドをクリックして広告を選択、矢印ボタンで移動
          </p>
          <p>
            🎯 最初の10×10マスは「創世エリア」として特別表示されます
          </p>
        </div>
      </div>
    </div>
  );
}
