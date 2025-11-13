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
    targetUrl: '',
    color: '#3b82f6', // デフォルトは青
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAdId, setEditingAdId] = useState<string | null>(null); // 編集中の広告ID

  // 右クリックでフォームを開く
  const handleGridRightClick = (x: number, y: number, ad: {
    adId: string;
    title: string | null;
    message: string | null;
    targetUrl: string | null;
    color: string;
  } | null, userId: string | null) => {
    if (ad) {
      // 既存の広告を編集
      setFormData({
        x: x.toString(),
        y: y.toString(),
        userId: userId ?? '', // 既存の広告のユーザーIDを設定
        title: ad.title ?? '',
        message: ad.message ?? '',
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
              title: formData.title || undefined,
              message: formData.message || undefined,
              targetUrl: formData.targetUrl || undefined,
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
              title: formData.title || undefined,
              message: formData.message || undefined,
              targetUrl: formData.targetUrl || undefined,
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
    <div className="min-h-screen relative overflow-hidden">
      {/* 背景装飾 */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-10 animate-slide-up">
          <div className="inline-block mb-4">
            <h1 className="text-6xl md:text-7xl font-extrabold mb-4 text-gradient">
              🌍 AdVerse
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-gray-800 mb-3 font-medium">
            世界中のユーザーが1マスずつ埋めていく、参加型の広告宇宙
          </p>
          <p className="text-lg text-gray-600 mb-6">
            1000×1000マスの巨大グリッドで、あなたの広告を配置しよう
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full shadow-lg">
            <span className="text-lg">💡</span>
            <p className="text-sm font-medium text-gray-700">
              グリッド上で<strong className="text-indigo-600">右クリック</strong>して広告を配置できます
            </p>
          </div>
        </div>

        {/* 右側にスライドインするフォームパネル */}
        <div
          className={`fixed top-0 right-0 h-full w-full md:w-96 glass shadow-2xl transform transition-all duration-300 ease-in-out z-50 overflow-y-auto ${
            showPlaceForm ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
          }`}
        >
          {showPlaceForm && (
            <div className="p-6 animate-slide-in-right">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingAdId ? '✏️ 広告を編集' : '✨ 広告を配置'}
                </h2>
                <button
                  onClick={() => {
                    setShowPlaceForm(false);
                    setEditingAdId(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-3xl font-light transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                  type="button"
                  aria-label="閉じる"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handlePlaceAd} className="space-y-5">
              <div className="mb-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">📍</span>
                  <p className="text-sm font-semibold text-indigo-900">
                    配置位置: ({formData.x || '?'}, {formData.y || '?'})
                  </p>
                </div>
                <p className="text-xs text-indigo-700 ml-7">
                  {editingAdId
                    ? '編集モード: 位置は変更できません'
                    : 'グリッド上で右クリックした位置に自動設定されます'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${editingAdId ? 'text-gray-400' : 'text-gray-700'}`}>
                    X座標
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={formData.x}
                    onChange={(e) => setFormData({ ...formData, x: e.target.value })}
                    className={`w-full px-4 py-2.5 border-2 rounded-lg transition-all ${
                      editingAdId
                        ? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300'
                    }`}
                    required
                    readOnly={!!editingAdId}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${editingAdId ? 'text-gray-400' : 'text-gray-700'}`}>
                    Y座標
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={formData.y}
                    onChange={(e) => setFormData({ ...formData, y: e.target.value })}
                    className={`w-full px-4 py-2.5 border-2 rounded-lg transition-all ${
                      editingAdId
                        ? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300'
                    }`}
                    required
                    readOnly={!!editingAdId}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${editingAdId ? 'text-gray-400' : 'text-gray-700'}`}>
                  ユーザーID {editingAdId && <span className="text-gray-400 font-normal text-xs">（既存の広告）</span>}
                  {!editingAdId && <span className="text-gray-400 font-normal text-xs">（空欄可、自動生成されます）</span>}
                </label>
                <input
                  type="text"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className={`w-full px-4 py-2.5 border-2 rounded-lg transition-all ${
                    editingAdId
                      ? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300'
                  }`}
                  placeholder="user_123"
                  readOnly={!!editingAdId}
                  disabled={!!editingAdId}
                />
                {editingAdId && formData.userId && (
                  <p className="text-xs text-gray-500 mt-1 ml-1">
                    この広告を配置したユーザーID: <span className="font-mono font-semibold">{formData.userId}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  タイトル
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  メッセージ
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 bg-white transition-all resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  リンク先URL
                </label>
                <input
                  type="url"
                  value={formData.targetUrl}
                  onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 bg-white transition-all"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  広告の色 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-16 h-12 border-2 border-gray-200 rounded-lg cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 bg-white font-mono text-sm transition-all"
                    placeholder="#3b82f6"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 ml-1">
                  グリッド上でこの色で表示されます
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isSubmitting
                  ? editingAdId
                    ? '⏳ 更新中...'
                    : '⏳ 配置中...'
                  : editingAdId
                    ? '✨ 広告を更新'
                    : '🚀 広告を配置'}
              </button>
              </form>
            </div>
          )}
        </div>

        {/* フォームが開いている時のオーバーレイ */}
        {showPlaceForm && (
          <div
            className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-40 transition-opacity animate-fade-in"
            onClick={() => setShowPlaceForm(false)}
          />
        )}

        <div className="glass rounded-2xl shadow-2xl p-6 border border-white/50 animate-slide-up">
          <Grid
            gridSize={1000}
            initialCellSize={20}
            canvasWidth={1000}
            canvasHeight={700}
            onRightClick={handleGridRightClick}
          />
        </div>
      </div>
    </div>
  );
}
