import { useEffect, useState } from 'react';
import { fetchAllPostsAdmin, createPost, updatePost, deletePost } from '../services/posts';
import type { Post } from '../types';

const PASSWORD = 'Hiranosy0709';

type Mode = 'list' | 'create' | 'edit';

const emptyForm = (): Omit<Post, 'id' | 'created_at'> => ({
  title: '',
  body: '',
  thumbnail_url: '',
  youtube_url: '',
  external_url: '',
  tags: [],
  status: 'draft',
});

export function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [pwError, setPwError] = useState(false);

  const [mode, setMode] = useState<Mode>('list');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [tagInput, setTagInput] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => {
    setLoading(true);
    fetchAllPostsAdmin().then(setPosts).finally(() => setLoading(false));
  };

  useEffect(() => { if (authed) load(); }, [authed]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === PASSWORD) { setAuthed(true); setPwError(false); }
    else setPwError(true);
  };

  const startCreate = () => {
    setForm(emptyForm());
    setTagInput('');
    setEditingId(null);
    setMode('create');
  };

  const startEdit = (post: Post) => {
    setForm({
      title: post.title,
      body: post.body,
      thumbnail_url: post.thumbnail_url || '',
      youtube_url: post.youtube_url || '',
      external_url: post.external_url || '',
      tags: post.tags || [],
      status: post.status,
    });
    setTagInput((post.tags || []).join(', '));
    setEditingId(post.id);
    setMode('edit');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    const data = {
      ...form,
      tags,
      thumbnail_url: form.thumbnail_url || null,
      youtube_url: form.youtube_url || null,
      external_url: form.external_url || null,
    };
    try {
      if (mode === 'edit' && editingId) {
        await updatePost(editingId, data);
        setMsg('✅ 更新しました');
      } else {
        await createPost(data);
        setMsg('✅ 作成しました');
      }
      load();
      setMode('list');
    } catch (err) {
      setMsg('❌ 保存に失敗しました');
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`「${title}」を削除しますか？`)) return;
    try {
      await deletePost(id);
      setMsg('🗑 削除しました');
      load();
    } catch {
      setMsg('❌ 削除に失敗しました');
    } finally {
      setTimeout(() => setMsg(''), 3000);
    }
  };

  /* ── Login screen ── */
  if (!authed) return (
    <main className="flex items-center justify-center min-h-[80vh] px-4">
      <form onSubmit={handleLogin} className="w-full max-w-sm p-8 rounded-2xl border" style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}>
        <h1 className="text-2xl font-black text-white mb-6 text-center">🔐 管理画面</h1>
        <label className="block text-sm mb-2" style={{ color: '#94a3b8' }}>パスワード</label>
        <input
          type="password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border outline-none focus:border-blue-500 text-white mb-4"
          style={{ backgroundColor: '#0a0f1e', borderColor: '#1e3a5f' }}
          placeholder="パスワードを入力"
        />
        {pwError && <p className="text-red-400 text-sm mb-3">パスワードが違います</p>}
        <button
          type="submit"
          className="w-full py-3 rounded-xl font-bold text-white transition-all hover:opacity-80"
          style={{ backgroundColor: '#3b82f6' }}
        >
          ログイン
        </button>
      </form>
    </main>
  );

  /* ── Form ── */
  if (mode === 'create' || mode === 'edit') return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setMode('list')} className="text-sm" style={{ color: '#3b82f6' }}>← 一覧に戻る</button>
        <h1 className="text-2xl font-black text-white">{mode === 'edit' ? '記事を編集' : '新規記事作成'}</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <Field label="タイトル *">
          <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border outline-none focus:border-blue-500 text-white"
            style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}
            placeholder="記事タイトル"
          />
        </Field>

        <Field label="本文（Markdown）*">
          <textarea required value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            rows={14}
            className="w-full px-4 py-3 rounded-xl border outline-none focus:border-blue-500 text-white font-mono text-sm resize-y"
            style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}
            placeholder="# 見出し&#10;&#10;本文をMarkdownで書いてください..."
          />
        </Field>

        <Field label="サムネイル画像URL">
          <input value={form.thumbnail_url || ''} onChange={e => setForm(f => ({ ...f, thumbnail_url: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border outline-none focus:border-blue-500 text-white"
            style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}
            placeholder="https://..."
          />
        </Field>

        <Field label="YouTube URL">
          <input value={form.youtube_url || ''} onChange={e => setForm(f => ({ ...f, youtube_url: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border outline-none focus:border-blue-500 text-white"
            style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}
            placeholder="https://youtube.com/watch?v=..."
          />
        </Field>

        <Field label="外部リンクURL">
          <input value={form.external_url || ''} onChange={e => setForm(f => ({ ...f, external_url: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border outline-none focus:border-blue-500 text-white"
            style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}
            placeholder="https://..."
          />
        </Field>

        <Field label="タグ（カンマ区切り）">
          <input value={tagInput} onChange={e => setTagInput(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border outline-none focus:border-blue-500 text-white"
            style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}
            placeholder="筋トレ, 食事, マインドセット"
          />
        </Field>

        <Field label="公開ステータス">
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'published' | 'draft' }))}
            className="w-full px-4 py-3 rounded-xl border outline-none focus:border-blue-500 text-white"
            style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}
          >
            <option value="draft">下書き</option>
            <option value="published">公開</option>
          </select>
        </Field>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-xl font-bold text-white transition-all hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: '#3b82f6' }}
          >
            {saving ? '保存中...' : mode === 'edit' ? '更新する' : '作成する'}
          </button>
          <button type="button" onClick={() => setMode('list')}
            className="px-6 py-3 rounded-xl font-bold border transition-all hover:bg-white/5"
            style={{ borderColor: '#1e3a5f', color: '#94a3b8' }}
          >
            キャンセル
          </button>
        </div>
      </form>
    </main>
  );

  /* ── List ── */
  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black text-white">📝 記事管理</h1>
        <button
          onClick={startCreate}
          className="px-5 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-80"
          style={{ backgroundColor: '#3b82f6' }}
        >
          + 新規作成
        </button>
      </div>

      {msg && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm text-white" style={{ backgroundColor: '#1a3a5c' }}>
          {msg}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">📝</p>
          <p style={{ color: '#475569' }}>まだ記事がありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div
              key={post.id}
              className="flex items-center gap-4 p-4 rounded-xl border"
              style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}
            >
              {post.thumbnail_url ? (
                <img src={post.thumbnail_url} alt="" className="w-16 h-12 object-cover rounded-lg flex-shrink-0" />
              ) : (
                <div className="w-16 h-12 rounded-lg flex-shrink-0 flex items-center justify-center text-2xl" style={{ backgroundColor: '#1a3a5c' }}>🌊</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm truncate">{post.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: post.status === 'published' ? 'rgba(59,130,246,0.2)' : 'rgba(100,116,139,0.2)',
                      color: post.status === 'published' ? '#3b82f6' : '#64748b',
                    }}
                  >
                    {post.status === 'published' ? '公開' : '下書き'}
                  </span>
                  <span className="text-xs" style={{ color: '#475569' }}>
                    {new Date(post.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => startEdit(post)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:border-blue-500"
                  style={{ borderColor: '#1e3a5f', color: '#94a3b8' }}
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(post.id, post.title)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:border-red-500 hover:text-red-400"
                  style={{ borderColor: '#1e3a5f', color: '#94a3b8' }}
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
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
