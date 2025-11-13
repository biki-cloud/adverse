'use client';

import { useState, useEffect, Suspense } from 'react';
import Grid from '@/app/components/Grid';

// ローカルストレージからuserIdを取得、なければ生成して保存
function getOrCreateUserId(): string {
  if (typeof window === 'undefined') {
    // SSR時は一時的なIDを返す（実際には使われない）
    return `user_temp_${Date.now()}`;
  }

  const storageKey = 'adverse_user_id';
  let userId = localStorage.getItem(storageKey);

  if (!userId) {
    // 一意のIDを生成（ランダム文字列 + タイムスタンプ）
    userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem(storageKey, userId);
  }

  return userId;
}

// ローカルストレージからnameを取得
function getUserName(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return localStorage.getItem('adverse_user_name') ?? '';
}

// ローカルストレージにnameを保存
function saveUserName(name: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  if (name.trim()) {
    localStorage.setItem('adverse_user_name', name.trim());
  } else {
    localStorage.removeItem('adverse_user_name');
  }
}

export default function Home() {
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [showPlaceForm, setShowPlaceForm] = useState(false);
  const [formData, setFormData] = useState({
    x: '',
    y: '',
    name: '',
    title: '',
    message: '',
    targetUrl: '',
    color: '#3b82f6', // デフォルトは青
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAdId, setEditingAdId] = useState<string | null>(null); // 編集中の広告ID
  const [isOtherUserAd, setIsOtherUserAd] = useState(false); // 他人の広告かどうか

  // コンポーネントマウント時にuserIdとnameを取得
  useEffect(() => {
    setUserId(getOrCreateUserId());
    setUserName(getUserName());
    // フォームのnameフィールドにも初期値を設定
    setFormData((prev) => ({ ...prev, name: getUserName() }));
  }, []);

  // 右クリックでフォームを開く
  const handleGridRightClick = (
    x: number,
    y: number,
    ad: {
      adId: string;
      name: string | null;
      title: string | null;
      message: string | null;
      targetUrl: string | null;
      color: string;
    } | null,
    adUserId: string | null
  ) => {
    if (ad) {
      // 既存の広告の場合、自分の広告かどうかをチェック
      const isOtherUser = Boolean(adUserId && userId && adUserId !== userId);
      setIsOtherUserAd(isOtherUser);

      setFormData({
        x: x.toString(),
        y: y.toString(),
        name: ad.name ?? userName, // 既存の広告のname、なければ現在のuserName
        title: ad.title ?? '',
        message: ad.message ?? '',
        targetUrl: ad.targetUrl ?? '',
        color: ad.color ?? '#3b82f6',
      });
      setEditingAdId(ad.adId);
    } else {
      // 新規作成
      setIsOtherUserAd(false);
      setFormData({
        x: x.toString(),
        y: y.toString(),
        name: userName, // 保存されているnameを使用
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

    // 他人の広告の場合は送信しない
    if (isOtherUserAd) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (!userId) {
        alert('エラー: ユーザーIDが取得できませんでした');
        setIsSubmitting(false);
        return;
      }

      // nameをローカルストレージに保存
      saveUserName(formData.name);

      if (editingAdId) {
        // 既存の広告を更新
        const response = await fetch('/api/grid/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adId: editingAdId,
            userId: userId,
            adData: {
              name: formData.name || undefined,
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
            name: userName,
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
            userId: userId,
            adData: {
              name: formData.name || undefined,
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
            name: userName,
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
    <div className="relative min-h-screen overflow-hidden">
      {/* 背景装飾 */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"></div>
        <div className="animate-blob absolute left-1/4 top-0 h-96 w-96 rounded-full bg-purple-300 opacity-20 mix-blend-multiply blur-3xl filter"></div>
        <div className="animate-blob animation-delay-2000 absolute right-1/4 top-0 h-96 w-96 rounded-full bg-yellow-300 opacity-20 mix-blend-multiply blur-3xl filter"></div>
        <div className="animate-blob animation-delay-4000 absolute -bottom-8 left-1/3 h-96 w-96 rounded-full bg-pink-300 opacity-20 mix-blend-multiply blur-3xl filter"></div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="animate-slide-up mb-10 text-center">
          <div className="mb-4 inline-block">
            <h1 className="text-gradient mb-4 text-6xl font-extrabold md:text-7xl">🌍 AdVerse</h1>
          </div>
          <p className="mb-3 text-xl font-medium text-gray-800 md:text-2xl">
            世界中のユーザーが1マスずつ埋めていく、参加型の広告宇宙
          </p>
          <p className="mb-6 text-lg text-gray-600">
            1000×1000マスの巨大グリッドで、あなたの広告を配置しよう
          </p>
          <div className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 shadow-lg">
            <span className="text-lg">💡</span>
            <p className="text-sm font-medium text-gray-700">
              グリッド上で<strong className="text-indigo-600">右クリック</strong>
              して広告を配置できます
            </p>
          </div>
        </div>

        {/* 右側にスライドインするフォームパネル */}
        <div
          className={`glass fixed right-0 top-0 z-50 h-full w-full transform overflow-y-auto shadow-2xl transition-all duration-300 ease-in-out md:w-96 ${
            showPlaceForm ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
          }`}
        >
          {showPlaceForm && (
            <div className="animate-slide-in-right p-6">
              <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {editingAdId ? '✏️ 広告を編集' : '✨ 広告を配置'}
                  </h2>
                  {isOtherUserAd && (
                    <p className="mt-1 text-sm text-gray-500">
                      この広告は他のユーザーが作成したものです。閲覧のみ可能です。
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowPlaceForm(false);
                    setEditingAdId(null);
                    setIsOtherUserAd(false);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-3xl font-light text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  type="button"
                  aria-label="閉じる"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handlePlaceAd} className="space-y-5">
                <div className="mb-4 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 shadow-sm">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xl">📍</span>
                    <p className="text-sm font-semibold text-indigo-900">
                      配置位置: ({formData.x || '?'}, {formData.y || '?'})
                    </p>
                  </div>
                  <p className="ml-7 text-xs text-indigo-700">
                    {editingAdId
                      ? '編集モード: 位置は変更できません'
                      : 'グリッド上で右クリックした位置に自動設定されます'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className={`mb-2 block text-sm font-semibold ${editingAdId ? 'text-gray-400' : 'text-gray-700'}`}
                    >
                      X座標
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="999"
                      value={formData.x}
                      onChange={(e) => setFormData({ ...formData, x: e.target.value })}
                      className={`w-full rounded-lg border-2 px-4 py-2.5 transition-all ${
                        editingAdId
                          ? 'cursor-not-allowed border-gray-300 bg-gray-100 text-gray-500'
                          : 'border-gray-200 bg-white focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                      }`}
                      required
                      readOnly={!!editingAdId}
                    />
                  </div>
                  <div>
                    <label
                      className={`mb-2 block text-sm font-semibold ${editingAdId ? 'text-gray-400' : 'text-gray-700'}`}
                    >
                      Y座標
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="999"
                      value={formData.y}
                      onChange={(e) => setFormData({ ...formData, y: e.target.value })}
                      className={`w-full rounded-lg border-2 px-4 py-2.5 transition-all ${
                        editingAdId
                          ? 'cursor-not-allowed border-gray-300 bg-gray-100 text-gray-500'
                          : 'border-gray-200 bg-white focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                      }`}
                      required
                      readOnly={!!editingAdId}
                    />
                  </div>
                </div>

                <div>
                  <label
                    className={`mb-2 block text-sm font-semibold ${isOtherUserAd ? 'text-gray-400' : 'text-gray-700'}`}
                  >
                    作成者名 <span className="text-xs font-normal text-gray-400">（空欄可）</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full rounded-lg border-2 px-4 py-2.5 transition-all ${
                      isOtherUserAd
                        ? 'cursor-not-allowed border-gray-300 bg-gray-100 text-gray-500'
                        : 'border-gray-200 bg-white focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                    }`}
                    placeholder="あなたの名前（任意）"
                    readOnly={isOtherUserAd}
                    disabled={isOtherUserAd}
                  />
                  {!isOtherUserAd && (
                    <p className="ml-1 mt-1 text-xs text-gray-500">
                      広告に表示される作成者名です。入力した内容は次回以降も保存されます。
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className={`mb-2 block text-sm font-semibold ${isOtherUserAd ? 'text-gray-400' : 'text-gray-700'}`}
                  >
                    タイトル
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={`w-full rounded-lg border-2 px-4 py-2.5 transition-all ${
                      isOtherUserAd
                        ? 'cursor-not-allowed border-gray-300 bg-gray-100 text-gray-500'
                        : 'border-gray-200 bg-white focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                    }`}
                    readOnly={isOtherUserAd}
                    disabled={isOtherUserAd}
                  />
                </div>

                <div>
                  <label
                    className={`mb-2 block text-sm font-semibold ${isOtherUserAd ? 'text-gray-400' : 'text-gray-700'}`}
                  >
                    メッセージ
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className={`w-full resize-none rounded-lg border-2 px-4 py-2.5 transition-all ${
                      isOtherUserAd
                        ? 'cursor-not-allowed border-gray-300 bg-gray-100 text-gray-500'
                        : 'border-gray-200 bg-white focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                    }`}
                    rows={3}
                    readOnly={isOtherUserAd}
                    disabled={isOtherUserAd}
                  />
                </div>

                <div>
                  <label
                    className={`mb-2 block text-sm font-semibold ${isOtherUserAd ? 'text-gray-400' : 'text-gray-700'}`}
                  >
                    リンク先URL
                  </label>
                  <input
                    type="url"
                    value={formData.targetUrl}
                    onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                    className={`w-full rounded-lg border-2 px-4 py-2.5 transition-all ${
                      isOtherUserAd
                        ? 'cursor-not-allowed border-gray-300 bg-gray-100 text-gray-500'
                        : 'border-gray-200 bg-white focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                    }`}
                    placeholder="https://example.com"
                    readOnly={isOtherUserAd}
                    disabled={isOtherUserAd}
                  />
                </div>

                <div>
                  <label
                    className={`mb-2 block text-sm font-semibold ${isOtherUserAd ? 'text-gray-400' : 'text-gray-700'}`}
                  >
                    広告の色 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className={`h-12 w-16 rounded-lg border-2 border-gray-200 shadow-sm transition-shadow ${
                        isOtherUserAd
                          ? 'cursor-not-allowed bg-gray-100 opacity-50'
                          : 'cursor-pointer hover:shadow-md'
                      }`}
                      disabled={isOtherUserAd}
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className={`flex-1 rounded-lg border-2 px-4 py-2.5 font-mono text-sm transition-all ${
                        isOtherUserAd
                          ? 'cursor-not-allowed border-gray-300 bg-gray-100 text-gray-500'
                          : 'border-gray-200 bg-white focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                      }`}
                      placeholder="#3b82f6"
                      pattern="^#[0-9A-Fa-f]{6}$"
                      required={!isOtherUserAd}
                      readOnly={isOtherUserAd}
                      disabled={isOtherUserAd}
                    />
                  </div>
                  {!isOtherUserAd && (
                    <p className="ml-1 mt-2 text-xs text-gray-500">
                      グリッド上でこの色で表示されます
                    </p>
                  )}
                </div>

                {isOtherUserAd ? (
                  <div className="rounded-lg border-2 border-gray-300 bg-gray-100 px-6 py-3.5 text-center">
                    <p className="text-sm font-medium text-gray-600">この広告は編集できません</p>
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full transform rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3.5 font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting
                      ? editingAdId
                        ? '⏳ 更新中...'
                        : '⏳ 配置中...'
                      : editingAdId
                        ? '✨ 広告を更新'
                        : '🚀 広告を配置'}
                  </button>
                )}
              </form>
            </div>
          )}
        </div>

        {/* フォームが開いている時のオーバーレイ */}
        {showPlaceForm && (
          <div
            className="animate-fade-in fixed inset-0 z-40 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowPlaceForm(false)}
          />
        )}

        <div className="glass animate-slide-up rounded-2xl border border-white/50 p-6 shadow-2xl">
          <Suspense
            fallback={
              <div className="flex h-[700px] items-center justify-center text-gray-600">
                読み込み中...
              </div>
            }
          >
            <Grid
              gridSize={1000}
              initialCellSize={20}
              canvasWidth={1000}
              canvasHeight={700}
              currentUserId={userId}
              onRightClick={handleGridRightClick}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
