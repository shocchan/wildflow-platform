import { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { fetchAllPostsAdmin, createPost, updatePost, deletePost } from '../services/posts';
import { fetchProfileSettings, saveProfileSettings, type ProfileSettings } from '../services/settings';
import { useAuth } from '../hooks/useAuth';
import type { Post } from '../types';

type Mode = 'list' | 'create' | 'edit';
type AdminTab = 'posts' | 'profile';
type PreviewTab = 'write' | 'preview';

const emptyForm = (): Omit<Post, 'id' | 'created_at'> => ({
  title: '',
  body: '',
  thumbnail_url: '',
  youtube_url: '',
  external_url: '',
  tags: [],
  status: 'draft',
});

// ── ログイン画面 ──────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (email: string, pw: string) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => { emailRef.current?.focus(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onLogin(email, pw);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
      setPw('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[85vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔐</div>
          <h1 className="text-2xl font-bold text-white">管理者ログイン</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>wildflow 管理画面</p>
        </div>

        <div className="rounded-2xl border p-8" style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}>
          {error && (
            <div className="text-sm px-4 py-3 rounded-xl mb-4 border" style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>
                メールアドレス
              </label>
              <input
                ref={emailRef}
                type="email"
                required
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                className="w-full px-4 py-3 rounded-xl border outline-none text-white transition-colors focus:border-blue-500"
                style={{ backgroundColor: '#0a0f1e', borderColor: error ? 'rgba(239,68,68,0.5)' : '#1e3a5f' }}
                placeholder="admin@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>
                パスワード
              </label>
              <input
                type="password"
                required
                value={pw}
                onChange={e => { setPw(e.target.value); setError(''); }}
                className="w-full px-4 py-3 rounded-xl border outline-none text-white transition-colors focus:border-blue-500"
                style={{ backgroundColor: '#0a0f1e', borderColor: error ? 'rgba(239,68,68,0.5)' : '#1e3a5f' }}
                placeholder="••••••••••"
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email || !pw}
              className="w-full py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 disabled:opacity-40 mt-2"
              style={{ backgroundColor: '#3b82f6' }}
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

// ── フォーム ──────────────────────────────────────────────
function PostForm({
  mode,
  initial,
  onSave,
  onCancel,
}: {
  mode: 'create' | 'edit';
  initial: Omit<Post, 'id' | 'created_at'>;
  onSave: (form: Omit<Post, 'id' | 'created_at'>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [tagInput, setTagInput] = useState(initial.tags?.join(', ') || '');
  const [saving, setSaving] = useState(false);
  const [previewTab, setPreviewTab] = useState<PreviewTab>('write');

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    await onSave({
      ...form,
      tags,
      thumbnail_url: form.thumbnail_url || null,
      youtube_url: form.youtube_url || null,
      external_url: form.external_url || null,
    } as Omit<Post, 'id' | 'created_at'>);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* タイトル */}
      <Field label="タイトル *">
        <input
          required
          value={form.title}
          onChange={e => set('title', e.target.value)}
          className="w-full px-4 py-3 rounded-xl border outline-none focus:border-blue-500 text-white text-base"
          style={{ backgroundColor: '#0a0f1e', borderColor: '#1e3a5f' }}
          placeholder="記事タイトルを入力"
        />
      </Field>

      {/* 本文 + プレビュー */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium" style={{ color: '#94a3b8' }}>本文（Markdown）*</label>
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: '#1e3a5f' }}>
            {(['write', 'preview'] as PreviewTab[]).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setPreviewTab(tab)}
                className="px-4 py-1.5 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: previewTab === tab ? '#3b82f6' : '#0a0f1e',
                  color: previewTab === tab ? '#fff' : '#64748b',
                }}
              >
                {tab === 'write' ? '✏️ 編集' : '👁 プレビュー'}
              </button>
            ))}
          </div>
        </div>

        {previewTab === 'write' ? (
          <textarea
            required
            value={form.body}
            onChange={e => set('body', e.target.value)}
            rows={16}
            className="w-full px-4 py-3 rounded-xl border outline-none focus:border-blue-500 text-white font-mono text-sm resize-y"
            style={{ backgroundColor: '#0a0f1e', borderColor: '#1e3a5f', lineHeight: '1.7' }}
            placeholder={'# 見出し\n\n本文をMarkdownで書いてください。\n\n## サブ見出し\n\n- リスト1\n- リスト2'}
          />
        ) : (
          <div
            className="min-h-64 px-6 py-5 rounded-xl border prose-wild overflow-auto"
            style={{ backgroundColor: '#0a0f1e', borderColor: '#1e3a5f' }}
          >
            {form.body
              ? <ReactMarkdown>{form.body}</ReactMarkdown>
              : <p style={{ color: '#334155' }}>本文を入力するとプレビューが表示されます</p>
            }
          </div>
        )}
      </div>

      {/* メディア系 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="サムネイル画像URL">
          <input
            value={form.thumbnail_url || ''}
            onChange={e => set('thumbnail_url', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border outline-none focus:border-blue-500 text-white text-sm"
            style={{ backgroundColor: '#0a0f1e', borderColor: '#1e3a5f' }}
            placeholder="https://..."
          />
        </Field>
        <Field label="YouTube URL">
          <input
            value={form.youtube_url || ''}
            onChange={e => set('youtube_url', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border outline-none focus:border-blue-500 text-white text-sm"
            style={{ backgroundColor: '#0a0f1e', borderColor: '#1e3a5f' }}
            placeholder="https://youtube.com/watch?v=..."
          />
        </Field>
      </div>

      <Field label="外部リンクURL">
        <input
          value={form.external_url || ''}
          onChange={e => set('external_url', e.target.value)}
          className="w-full px-4 py-3 rounded-xl border outline-none focus:border-blue-500 text-white text-sm"
          style={{ backgroundColor: '#0a0f1e', borderColor: '#1e3a5f' }}
          placeholder="https://..."
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="タグ（カンマ区切り）">
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border outline-none focus:border-blue-500 text-white text-sm"
            style={{ backgroundColor: '#0a0f1e', borderColor: '#1e3a5f' }}
            placeholder="筋トレ, 食事, マインドセット"
          />
        </Field>
        <Field label="公開ステータス">
          <select
            value={form.status}
            onChange={e => set('status', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border outline-none focus:border-blue-500 text-white text-sm"
            style={{ backgroundColor: '#0a0f1e', borderColor: '#1e3a5f' }}
          >
            <option value="draft">📝 下書き</option>
            <option value="published">🌐 公開</option>
          </select>
        </Field>
      </div>

      {/* サムネイルプレビュー */}
      {form.thumbnail_url && (
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#1e3a5f' }}>
          <p className="text-xs px-3 py-2 border-b" style={{ color: '#64748b', borderColor: '#1e3a5f' }}>サムネイルプレビュー</p>
          <img src={form.thumbnail_url} alt="thumbnail" className="w-full max-h-48 object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
        </div>
      )}

      <div className="flex gap-3 pt-2 border-t" style={{ borderColor: '#1e3a5f' }}>
        <button
          type="submit"
          disabled={saving}
          className="px-8 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#3b82f6' }}
        >
          {saving ? '保存中...' : mode === 'edit' ? '✓ 更新する' : '✓ 作成する'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 rounded-xl font-bold border transition-all hover:bg-white/5"
          style={{ borderColor: '#1e3a5f', color: '#94a3b8' }}
        >
          キャンセル
        </button>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-full border"
            style={{
              borderColor: form.status === 'published' ? 'rgba(59,130,246,0.4)' : '#1e3a5f',
              color: form.status === 'published' ? '#3b82f6' : '#64748b',
              backgroundColor: form.status === 'published' ? 'rgba(59,130,246,0.1)' : 'transparent',
            }}
          >
            {form.status === 'published' ? '🌐 公開予定' : '📝 下書き'}
          </span>
        </div>
      </div>
    </form>
  );
}

// ── プロフィール編集フォーム ───────────────────────────────
function ProfileForm({ onToast }: { onToast: (msg: string) => void }) {
  const [form, setForm] = useState<ProfileSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfileSettings().then(setForm);
  }, []);

  if (!form) return <p className="text-slate-400 text-sm">読み込み中...</p>;

  const set = (k: keyof ProfileSettings, v: string) => setForm(f => f ? { ...f, [k]: v } : f);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `profile.${ext}`;
      const { error } = await (await import('../services/supabaseClient')).supabase
        .storage.from('avatars').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = (await import('../services/supabaseClient')).supabase
        .storage.from('avatars').getPublicUrl(path);
      set('photo_url', data.publicUrl);
      onToast('✅ 画像をアップロードしました');
    } catch {
      onToast('❌ アップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await saveProfileSettings(form);
      onToast('✅ プロフィールを更新しました');
    } catch {
      onToast('❌ 保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="表示名">
          <input value={form.name} onChange={e => set('name', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border outline-none focus:border-blue-500 text-white text-sm"
            style={{ backgroundColor: '#0a0f1e', borderColor: '#1e3a5f' }} />
        </Field>
        <Field label="肩書き">
          <input value={form.tagline} onChange={e => set('tagline', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border outline-none focus:border-blue-500 text-white text-sm"
            style={{ backgroundColor: '#0a0f1e', borderColor: '#1e3a5f' }} />
        </Field>
      </div>

      <Field label="プロフィール画像">
        <div className="flex items-center gap-4">
          {/* 画像プレビュー */}
          <div className="flex-shrink-0">
            {form.photo_url ? (
              <img src={form.photo_url} alt="preview"
                className="w-20 h-20 rounded-full object-cover border-2"
                style={{ borderColor: '#3b82f6' }}
                onError={e => (e.currentTarget.style.display = 'none')} />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl border-2"
                style={{ backgroundColor: '#1a3a5c', borderColor: '#1e3a5f' }}>
                🌊
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            {/* アップロードボタン */}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={handleImageUpload} />
            <button type="button" disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-2.5 rounded-xl border font-bold text-sm transition-all hover:border-blue-500 hover:text-blue-400 disabled:opacity-50"
              style={{ borderColor: '#1e3a5f', color: '#94a3b8', backgroundColor: '#0a0f1e' }}>
              {uploading ? '⏳ アップロード中...' : '📁 画像ファイルを選択'}
            </button>
            {/* URLで直接入力もできる */}
            <input value={form.photo_url} onChange={e => set('photo_url', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border outline-none focus:border-blue-500 text-white text-xs"
              style={{ backgroundColor: '#0a0f1e', borderColor: '#1e3a5f', color: '#64748b' }}
              placeholder="またはURLを直接入力（https://...）" />
          </div>
        </div>
      </Field>

      <Field label="ミッション">
        <textarea value={form.mission} onChange={e => set('mission', e.target.value)} rows={4}
          className="w-full px-4 py-3 rounded-xl border outline-none focus:border-blue-500 text-white text-sm resize-y font-mono"
          style={{ backgroundColor: '#0a0f1e', borderColor: '#1e3a5f', lineHeight: '1.7' }} />
      </Field>

      <Field label="ストーリー">
        <textarea value={form.story} onChange={e => set('story', e.target.value)} rows={5}
          className="w-full px-4 py-3 rounded-xl border outline-none focus:border-blue-500 text-white text-sm resize-y font-mono"
          style={{ backgroundColor: '#0a0f1e', borderColor: '#1e3a5f', lineHeight: '1.7' }} />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Twitter / X URL">
          <input value={form.twitter_url} onChange={e => set('twitter_url', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border outline-none focus:border-blue-500 text-white text-sm"
            style={{ backgroundColor: '#0a0f1e', borderColor: '#1e3a5f' }}
            placeholder="https://twitter.com/..." />
        </Field>
        <Field label="小紅書（XHS）URL">
          <input value={form.xhs_url} onChange={e => set('xhs_url', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border outline-none focus:border-blue-500 text-white text-sm"
            style={{ backgroundColor: '#0a0f1e', borderColor: '#1e3a5f' }}
            placeholder="https://xhslink.com/..." />
        </Field>
        <Field label="lemon8 URL">
          <input value={form.lemon8_url} onChange={e => set('lemon8_url', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border outline-none focus:border-blue-500 text-white text-sm"
            style={{ backgroundColor: '#0a0f1e', borderColor: '#1e3a5f' }}
            placeholder="https://s.lemon8-app.com/..." />
        </Field>
      </div>

      <div className="pt-2 border-t" style={{ borderColor: '#1e3a5f' }}>
        <button type="submit" disabled={saving}
          className="px-8 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#3b82f6' }}>
          {saving ? '保存中...' : '✓ 保存する'}
        </button>
      </div>
    </form>
  );
}

// ── メインコンポーネント ───────────────────────────────────
export function AdminPage() {
  const { isAuthenticated, loading: authLoading, login, logout } = useAuth();
  const [mode, setMode] = useState<Mode>('list');
  const [activeTab, setActiveTab] = useState<AdminTab>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = () => {
    setLoading(true);
    fetchAllPostsAdmin().then(setPosts).finally(() => setLoading(false));
  };

  useEffect(() => { if (isAuthenticated) load(); }, [isAuthenticated]);

  if (authLoading) return null;

  if (!isAuthenticated) return <LoginScreen onLogin={login} />;

  // フィルタ
  const filtered = posts.filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.tags?.some(t => t.includes(search))
  );

  const published = posts.filter(p => p.status === 'published').length;
  const draft = posts.filter(p => p.status === 'draft').length;

  // ── 記事フォーム画面 ──
  if (mode === 'create' || mode === 'edit') {
    const initial = editingPost
      ? {
          title: editingPost.title,
          body: editingPost.body,
          thumbnail_url: editingPost.thumbnail_url || '',
          youtube_url: editingPost.youtube_url || '',
          external_url: editingPost.external_url || '',
          tags: editingPost.tags || [],
          status: editingPost.status,
        }
      : emptyForm();

    const handleSave = async (form: Omit<Post, 'id' | 'created_at'>) => {
      try {
        if (mode === 'edit' && editingPost) {
          await updatePost(editingPost.id, form);
          showToast('✅ 記事を更新しました');
        } else {
          await createPost(form);
          showToast('✅ 記事を作成しました');
        }
        load();
        setMode('list');
      } catch {
        showToast('❌ 保存に失敗しました');
      }
    };

    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        {toast && <Toast msg={toast} />}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => setMode('list')}
            className="flex items-center gap-1 text-sm transition-colors hover:text-blue-300"
            style={{ color: '#3b82f6' }}
          >
            ← 一覧に戻る
          </button>
          <span style={{ color: '#1e3a5f' }}>/</span>
          <h1 className="text-xl font-bold text-white">
            {mode === 'edit' ? '記事を編集' : '新規記事作成'}
          </h1>
        </div>
        <div className="rounded-2xl border p-6 md:p-8" style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}>
          <PostForm
            mode={mode}
            initial={initial}
            onSave={handleSave}
            onCancel={() => setMode('list')}
          />
        </div>
      </main>
    );
  }

  // ── 一覧画面 ──
  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      {toast && <Toast msg={toast} />}

      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white">🛠 管理画面</h1>
        <button
          onClick={logout}
          className="px-4 py-2.5 rounded-xl text-sm border transition-colors hover:border-red-500 hover:text-red-400"
          style={{ borderColor: '#1e3a5f', color: '#64748b' }}
        >
          ログアウト
        </button>
      </div>

      {/* タブ */}
      <div className="flex gap-1 mb-8 p-1 rounded-xl" style={{ backgroundColor: '#111827' }}>
        {([['posts', '📝 記事管理'], ['profile', '👤 プロフィール']] as [AdminTab, string][]).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all"
            style={{
              backgroundColor: activeTab === tab ? '#3b82f6' : 'transparent',
              color: activeTab === tab ? '#fff' : '#64748b',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* プロフィールタブ */}
      {activeTab === 'profile' && (
        <div className="rounded-2xl border p-6 md:p-8" style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}>
          <ProfileForm onToast={showToast} />
        </div>
      )}

      {/* 記事タブ */}
      {activeTab === 'posts' && (<>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm" style={{ color: '#475569' }}>
          全 {posts.length} 件（公開 {published} · 下書き {draft}）
        </p>
        <button
          onClick={() => { setEditingPost(null); setMode('create'); }}
          className="px-5 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 flex items-center gap-1"
          style={{ backgroundColor: '#3b82f6' }}
        >
          + 新規作成
        </button>
      </div>

      {/* 検索 */}
      <div className="mb-6">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full md:w-72 px-4 py-2.5 rounded-xl border outline-none focus:border-blue-500 text-white text-sm"
          style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}
          placeholder="🔍 タイトル・タグで検索"
        />
      </div>

      {/* 記事一覧 */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 rounded-2xl border" style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}>
          <p className="text-5xl mb-4">📝</p>
          <p className="font-bold text-white mb-1">{search ? '検索結果がありません' : 'まだ記事がありません'}</p>
          {!search && (
            <button
              onClick={() => { setEditingPost(null); setMode('create'); }}
              className="mt-4 text-sm underline"
              style={{ color: '#3b82f6' }}
            >
              最初の記事を作成する
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(post => (
            <PostRow
              key={post.id}
              post={post}
              onEdit={() => { setEditingPost(post); setMode('edit'); }}
              onDelete={async () => {
                if (!confirm(`「${post.title}」を削除しますか？`)) return;
                try {
                  await deletePost(post.id);
                  showToast('🗑 削除しました');
                  load();
                } catch {
                  showToast('❌ 削除に失敗しました');
                }
              }}
            />
          ))}
        </div>
      )}
      </>)}
    </main>
  );
}

// ── サブコンポーネント ─────────────────────────────────────
function PostRow({ post, onEdit, onDelete }: { post: Post; onEdit: () => void; onDelete: () => void }) {
  const date = new Date(post.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
  return (
    <div
      className="flex items-center gap-4 p-4 rounded-xl border transition-colors hover:border-blue-900"
      style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}
    >
      {post.thumbnail_url ? (
        <img src={post.thumbnail_url} alt="" className="w-16 h-12 object-cover rounded-lg flex-shrink-0" />
      ) : (
        <div className="w-16 h-12 rounded-lg flex-shrink-0 flex items-center justify-center text-2xl" style={{ backgroundColor: '#1a3a5c' }}>🌊</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white text-sm truncate leading-snug">{post.title}</p>
        <div className="flex items-center flex-wrap gap-2 mt-1.5">
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: post.status === 'published' ? 'rgba(59,130,246,0.15)' : 'rgba(100,116,139,0.15)',
              color: post.status === 'published' ? '#3b82f6' : '#64748b',
            }}
          >
            {post.status === 'published' ? '🌐 公開' : '📝 下書き'}
          </span>
          {post.tags?.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1e3a5f', color: '#7dd3fc' }}>
              #{tag}
            </span>
          ))}
          <span className="text-xs" style={{ color: '#334155' }}>{date}</span>
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={onEdit}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:border-blue-500 hover:text-blue-400"
          style={{ borderColor: '#1e3a5f', color: '#94a3b8' }}
        >
          編集
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:border-red-500 hover:text-red-400"
          style={{ borderColor: '#1e3a5f', color: '#94a3b8' }}
        >
          削除
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>{label}</label>
      {children}
    </div>
  );
}

function Toast({ msg }: { msg: string }) {
  return (
    <div
      className="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-medium text-white shadow-lg"
      style={{ backgroundColor: '#1a3a5c', border: '1px solid #1e3a5f' }}
    >
      {msg}
    </div>
  );
}
