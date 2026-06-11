import { useEffect, useState, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Cropper from 'react-easy-crop';
import { fetchAllPostsAdmin, createPost, updatePost, deletePost } from '../services/posts';
import { fetchProfileSettings, saveProfileSettings, defaultProfileSettings, type ProfileSettings } from '../services/settings';
import { fetchAllLessonsAdmin, createLesson, updateLesson, deleteLesson, fetchEntriesForLesson, updateEntryPaymentStatus } from '../services/lessons';
import { LESSON_TYPE_MAP } from '../types/lesson';
import type { Lesson, LessonEntry, LessonType, LessonStatus } from '../types/lesson';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { getCroppedImg, type CropArea } from '../utils/cropImage';
import type { Post } from '../types';

type Mode = 'list' | 'create' | 'edit';
type AdminTab = 'posts' | 'lessons' | 'leads' | 'profile';

const emptyForm = (): Omit<Post, 'id' | 'created_at'> => ({
  title: '',
  body: '',
  thumbnail_url: '',
  youtube_url: '',
  external_url: '',
  tags: [],
  status: 'draft',
  content_type: 'html',
});

// ── ツールバーボタン ───────────────────────────────────────
function ToolbarBtn({
  onClick, active, children, title,
}: {
  onClick: () => void; active?: boolean; children: React.ReactNode; title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="px-2 py-1 rounded text-sm font-bold transition-colors"
      style={{
        backgroundColor: active ? '#3b82f6' : 'transparent',
        color: active ? '#fff' : '#94a3b8',
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1e3a5f'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
    >
      {children}
    </button>
  );
}

// ── リッチテキストエディタ ─────────────────────────────────
function RichEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: '本文を入力してください…' }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[400px] px-5 py-4 text-slate-200 leading-relaxed prose-wild',
      },
    },
  });

  const setLink = () => {
    const url = window.prompt('URL を入力してください');
    if (!url) return;
    editor?.chain().focus().setLink({ href: url }).run();
  };

  if (!editor) return null;

  return (
    <div
      className="rounded-xl border overflow-hidden transition-colors focus-within:border-blue-500"
      style={{ backgroundColor: '#0a0f1e', borderColor: '#1e3a5f' }}
    >
      {/* ツールバー */}
      <div
        className="flex flex-wrap items-center gap-0.5 px-2 py-2 border-b"
        style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}
      >
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="見出し1">H1</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="見出し2">H2</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="見出し3">H3</ToolbarBtn>
        <div className="w-px h-5 mx-1" style={{ backgroundColor: '#1e3a5f' }} />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="太字"><b>B</b></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="斜体"><i>I</i></ToolbarBtn>
        <div className="w-px h-5 mx-1" style={{ backgroundColor: '#1e3a5f' }} />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="箇条書き">・</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="番号付きリスト">1.</ToolbarBtn>
        <div className="w-px h-5 mx-1" style={{ backgroundColor: '#1e3a5f' }} />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="引用">❝</ToolbarBtn>
        <ToolbarBtn onClick={setLink} active={editor.isActive('link')} title="リンク">🔗</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="水平線">—</ToolbarBtn>
      </div>
      {/* エディタ本体 */}
      <EditorContent editor={editor} />
    </div>
  );
}

// ── サムネイルアップローダー（クロップ付き 16:9）─────────
function ThumbnailUploader({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('ファイルサイズは5MB以下にしてください'); return; }
    if (!file.type.startsWith('image/')) { alert('画像ファイルを選択してください'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const onCropComplete = useCallback((_: unknown, pixels: CropArea) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleCropAndUpload = async () => {
    if (!rawImageSrc || !croppedAreaPixels) return;
    setUploading(true);
    try {
      const blob = await getCroppedImg(rawImageSrc, croppedAreaPixels, { width: 1280, height: 720 });
      const filename = `${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from('thumbnails')
        .upload(filename, blob, { upsert: false, contentType: 'image/jpeg' });
      if (error) throw error;
      const { data } = supabase.storage.from('thumbnails').getPublicUrl(filename);
      onChange(data.publicUrl);
      setShowCropper(false);
      setRawImageSrc(null);
    } catch (err) {
      alert(`アップロードに失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="space-y-3">
        {value && (
          <img
            src={value}
            alt="サムネイル"
            className="w-full max-w-sm rounded-xl object-cover aspect-video border"
            style={{ borderColor: '#1e3a5f' }}
          />
        )}
        <div className="flex items-center gap-3">
          <label
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all hover:border-blue-500 hover:text-blue-400"
            style={{ borderColor: '#1e3a5f', color: uploading ? '#475569' : '#94a3b8', backgroundColor: '#0a0f1e' }}
          >
            {uploading ? '⏳ アップロード中...' : '📁 画像を選択'}
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={uploading} />
          </label>
          {value && (
            <button type="button" onClick={() => onChange('')} className="text-sm transition-colors hover:text-red-300" style={{ color: '#ef4444' }}>
              削除
            </button>
          )}
        </div>
      </div>

      {showCropper && rawImageSrc && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#1e3a5f' }}>
            <h3 className="text-white font-bold">📐 画像をトリミング（16:9）</h3>
            <button onClick={() => { setShowCropper(false); setRawImageSrc(null); }} className="text-slate-400 hover:text-white text-xl leading-none px-2">✕</button>
          </div>
          <div className="relative flex-1">
            <Cropper
              image={rawImageSrc}
              crop={crop}
              zoom={zoom}
              aspect={16 / 9}
              cropShape="rect"
              showGrid={true}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="px-6 py-3 flex items-center gap-4" style={{ backgroundColor: '#0a0f1e' }}>
            <span className="text-xs text-slate-400 w-12">縮小</span>
            <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={e => setZoom(Number(e.target.value))} className="flex-1 accent-blue-500" />
            <span className="text-xs text-slate-400 w-12 text-right">拡大</span>
          </div>
          <div className="flex gap-3 justify-end px-5 py-4 border-t" style={{ borderColor: '#1e3a5f', backgroundColor: '#0a0f1e' }}>
            <button onClick={() => { setShowCropper(false); setRawImageSrc(null); }}
              className="px-5 py-2.5 rounded-xl border text-sm font-medium transition-colors"
              style={{ borderColor: '#1e3a5f', color: '#94a3b8' }}>キャンセル</button>
            <button onClick={handleCropAndUpload} disabled={uploading}
              className="px-6 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#3b82f6' }}>
              {uploading ? '⏳ アップロード中...' : '✓ この範囲で保存'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Markdownエディタ ──────────────────────────────────────
function MarkdownEditor({ value, onChange }: { value: string; onChange: (md: string) => void }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={20}
      className="w-full px-5 py-4 rounded-xl border outline-none focus:border-blue-500 text-slate-200 text-sm resize-y font-mono"
      style={{ backgroundColor: '#0a0f1e', borderColor: '#1e3a5f', lineHeight: '1.7' }}
      placeholder={'Markdownで本文を入力してください\n\n## 見出し\n\n本文テキスト'}
    />
  );
}

// ── タグ入力 ──────────────────────────────────────────────
function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('');

  const add = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) onChange([...tags, val]);
    setInput('');
  };

  const remove = (tag: string) => onChange(tags.filter(t => t !== tag));

  return (
    <div
      className="flex flex-wrap gap-2 items-center px-3 py-2 rounded-xl border min-h-[46px] transition-colors focus-within:border-blue-500"
      style={{ backgroundColor: '#0a0f1e', borderColor: '#1e3a5f' }}
    >
      {tags.map(tag => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
          style={{ backgroundColor: '#1e3a5f', color: '#7dd3fc' }}
        >
          #{tag}
          <button type="button" onClick={() => remove(tag)} className="ml-0.5 hover:text-red-400 text-xs leading-none">×</button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } if (e.key === ',') { e.preventDefault(); add(); } }}
        onBlur={add}
        placeholder={tags.length === 0 ? 'タグを入力してEnter' : '+ タグを追加'}
        className="flex-1 min-w-[100px] bg-transparent outline-none text-sm text-white placeholder:text-slate-600"
      />
    </div>
  );
}

// ── ステータス切り替え ─────────────────────────────────────
function StatusToggle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const options = [
    { value: 'draft', label: '🔒 下書き', desc: '非公開' },
    { value: 'published', label: '🌐 公開', desc: '全員に表示' },
  ];
  return (
    <div className="flex gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className="flex-1 py-2.5 px-3 rounded-xl border text-sm font-bold transition-all"
          style={{
            backgroundColor: value === opt.value ? (opt.value === 'published' ? 'rgba(59,130,246,0.15)' : 'rgba(100,116,139,0.1)') : 'transparent',
            borderColor: value === opt.value ? (opt.value === 'published' ? '#3b82f6' : '#64748b') : '#1e3a5f',
            color: value === opt.value ? (opt.value === 'published' ? '#3b82f6' : '#94a3b8') : '#475569',
          }}
        >
          {opt.label}
          <span className="block text-xs font-normal opacity-60">{opt.desc}</span>
        </button>
      ))}
    </div>
  );
}

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
    setLoading(true); setError('');
    try { await onLogin(email, pw); }
    catch (err) { setError(err instanceof Error ? err.message : 'ログインに失敗しました'); setPw(''); }
    finally { setLoading(false); }
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
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>メールアドレス</label>
              <input ref={emailRef} type="email" required value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                className="w-full px-4 py-3 rounded-xl border outline-none text-white transition-colors focus:border-blue-500"
                style={{ backgroundColor: '#0a0f1e', borderColor: error ? 'rgba(239,68,68,0.5)' : '#1e3a5f' }}
                placeholder="admin@example.com" autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>パスワード</label>
              <input type="password" required value={pw}
                onChange={e => { setPw(e.target.value); setError(''); }}
                className="w-full px-4 py-3 rounded-xl border outline-none text-white transition-colors focus:border-blue-500"
                style={{ backgroundColor: '#0a0f1e', borderColor: error ? 'rgba(239,68,68,0.5)' : '#1e3a5f' }}
                placeholder="••••••••••" autoComplete="current-password" />
            </div>
            <button type="submit" disabled={loading || !email || !pw}
              className="w-full py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 disabled:opacity-40 mt-2"
              style={{ backgroundColor: '#3b82f6' }}>
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

// ── 記事フォーム ──────────────────────────────────────────
function PostForm({
  mode, initial, onSave, onCancel,
}: {
  mode: 'create' | 'edit';
  initial: Omit<Post, 'id' | 'created_at'>;
  onSave: (form: Omit<Post, 'id' | 'created_at'>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      ...form,
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
        <input required value={form.title} onChange={e => set('title', e.target.value)}
          className="w-full px-4 py-3 rounded-xl border outline-none focus:border-blue-500 text-white text-base transition-colors"
          style={{ backgroundColor: '#0a0f1e', borderColor: '#1e3a5f' }}
          placeholder="記事タイトルを入力" />
      </Field>

      {/* 本文エディタ（切り替え式） */}
      <Field label="本文 *">
        <div className="space-y-2">
          <div className="flex gap-2">
            {([['html', '✍️ リッチテキスト'], ['markdown', '📝 Markdown']] as const).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => set('content_type', mode)}
                className="px-4 py-2 rounded-lg text-sm font-bold transition-all border"
                style={{
                  backgroundColor: form.content_type === mode ? (mode === 'html' ? 'rgba(59,130,246,0.15)' : 'rgba(100,116,139,0.1)') : 'transparent',
                  borderColor: form.content_type === mode ? '#3b82f6' : '#1e3a5f',
                  color: form.content_type === mode ? '#60a5fa' : '#475569',
                }}
              >{label}</button>
            ))}
          </div>
          {form.content_type === 'markdown'
            ? <MarkdownEditor value={form.body} onChange={v => set('body', v)} />
            : <RichEditor key="rich" value={form.body} onChange={v => set('body', v)} />
          }
        </div>
      </Field>

      {/* サムネイル */}
      <Field label="サムネイル画像">
        <ThumbnailUploader value={form.thumbnail_url || ''} onChange={v => set('thumbnail_url', v)} />
      </Field>

      {/* YouTube / 外部リンク */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="YouTube URL">
          <input value={form.youtube_url || ''} onChange={e => set('youtube_url', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border outline-none focus:border-blue-500 text-white text-sm transition-colors"
            style={{ backgroundColor: '#0a0f1e', borderColor: '#1e3a5f' }}
            placeholder="https://youtube.com/watch?v=..." />
        </Field>
        <Field label="外部リンクURL">
          <input value={form.external_url || ''} onChange={e => set('external_url', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border outline-none focus:border-blue-500 text-white text-sm transition-colors"
            style={{ backgroundColor: '#0a0f1e', borderColor: '#1e3a5f' }}
            placeholder="https://..." />
        </Field>
      </div>

      {/* タグ */}
      <Field label="タグ">
        <TagInput tags={form.tags || []} onChange={v => set('tags', v)} />
      </Field>

      {/* ステータス */}
      <Field label="公開ステータス">
        <StatusToggle value={form.status} onChange={v => set('status', v as 'published' | 'draft')} />
      </Field>

      <div className="flex gap-3 pt-2 border-t" style={{ borderColor: '#1e3a5f' }}>
        <button type="submit" disabled={saving}
          className="px-8 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#3b82f6' }}>
          {saving ? '保存中...' : mode === 'edit' ? '✓ 更新する' : '✓ 作成する'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-6 py-3 rounded-xl font-bold border transition-all hover:bg-white/5"
          style={{ borderColor: '#1e3a5f', color: '#94a3b8' }}>
          キャンセル
        </button>
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
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);

  useEffect(() => {
    fetchProfileSettings().then(setForm).catch(() => setForm({ ...defaultProfileSettings }));
  }, []);

  const set = (k: keyof ProfileSettings, v: string) =>
    setForm(f => f ? { ...f, [k]: v } : f);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setRawImageSrc(reader.result as string); setCrop({ x: 0, y: 0 }); setZoom(1); setShowCropper(true); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const onCropComplete = useCallback((_: unknown, pixels: CropArea) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleCropAndUpload = async () => {
    if (!rawImageSrc || !croppedAreaPixels) return;
    setUploading(true);
    try {
      const blob = await getCroppedImg(rawImageSrc, croppedAreaPixels);
      const { error } = await supabase.storage.from('avatars').upload('profile.jpg', blob, { upsert: true, contentType: 'image/jpeg' });
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl('profile.jpg');
      set('photo_url', `${data.publicUrl}?t=${Date.now()}`);
      setShowCropper(false); setRawImageSrc(null);
      onToast('✅ 画像をアップロードしました');
    } catch { onToast('❌ アップロードに失敗しました'); }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try { await saveProfileSettings(form); onToast('✅ プロフィールを更新しました'); }
    catch { onToast('❌ 保存に失敗しました'); }
    finally { setSaving(false); }
  };

  if (!form) return <p className="text-slate-400 text-sm">読み込み中...</p>;

  return (
    <>
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
          <div className="flex-shrink-0">
            {form.photo_url
              ? <img src={form.photo_url} alt="preview" className="w-20 h-20 rounded-full object-cover border-2" style={{ borderColor: '#3b82f6' }} onError={e => (e.currentTarget.style.display = 'none')} />
              : <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl border-2" style={{ backgroundColor: '#1a3a5c', borderColor: '#1e3a5f' }}>🌊</div>
            }
          </div>
          <div className="flex-1 space-y-2">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            <button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-2.5 rounded-xl border font-bold text-sm transition-all hover:border-blue-500 hover:text-blue-400 disabled:opacity-50"
              style={{ borderColor: '#1e3a5f', color: '#94a3b8', backgroundColor: '#0a0f1e' }}>
              {uploading ? '⏳ アップロード中...' : '📁 画像ファイルを選択'}
            </button>
            <input value={form.photo_url} onChange={e => set('photo_url', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border outline-none focus:border-blue-500 text-white text-xs"
              style={{ backgroundColor: '#0a0f1e', borderColor: '#1e3a5f', color: '#64748b' }}
              placeholder="またはURLを直接入力（https://...）" />
          </div>
        </div>
      </Field>

      <Field label="ミッション">
        <textarea value={form.mission} onChange={e => set('mission', e.target.value)} rows={4}
          className="w-full px-4 py-3 rounded-xl border outline-none focus:border-blue-500 text-white text-sm resize-y"
          style={{ backgroundColor: '#0a0f1e', borderColor: '#1e3a5f', lineHeight: '1.7' }} />
      </Field>

      <Field label="ストーリー">
        <textarea value={form.story} onChange={e => set('story', e.target.value)} rows={5}
          className="w-full px-4 py-3 rounded-xl border outline-none focus:border-blue-500 text-white text-sm resize-y"
          style={{ backgroundColor: '#0a0f1e', borderColor: '#1e3a5f', lineHeight: '1.7' }} />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Twitter / X URL">
          <input value={form.twitter_url} onChange={e => set('twitter_url', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border outline-none focus:border-blue-500 text-white text-sm"
            style={{ backgroundColor: '#0a0f1e', borderColor: '#1e3a5f' }} placeholder="https://twitter.com/..." />
        </Field>
        <Field label="小紅書（XHS）URL">
          <input value={form.xhs_url} onChange={e => set('xhs_url', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border outline-none focus:border-blue-500 text-white text-sm"
            style={{ backgroundColor: '#0a0f1e', borderColor: '#1e3a5f' }} placeholder="https://xhslink.com/..." />
        </Field>
        <Field label="lemon8 URL">
          <input value={form.lemon8_url} onChange={e => set('lemon8_url', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border outline-none focus:border-blue-500 text-white text-sm"
            style={{ backgroundColor: '#0a0f1e', borderColor: '#1e3a5f' }} placeholder="https://s.lemon8-app.com/..." />
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

    {showCropper && rawImageSrc && (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#1e3a5f' }}>
          <h3 className="text-white font-bold">📐 画像をトリミング</h3>
          <button onClick={() => { setShowCropper(false); setRawImageSrc(null); }} className="text-slate-400 hover:text-white text-xl leading-none px-2">✕</button>
        </div>
        <div className="relative flex-1">
          <Cropper image={rawImageSrc} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false}
            onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
        </div>
        <div className="px-6 py-3 flex items-center gap-4" style={{ backgroundColor: '#0a0f1e' }}>
          <span className="text-xs text-slate-400 w-12">縮小</span>
          <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={e => setZoom(Number(e.target.value))} className="flex-1 accent-blue-500" />
          <span className="text-xs text-slate-400 w-12 text-right">拡大</span>
        </div>
        <div className="flex gap-3 justify-end px-5 py-4 border-t" style={{ borderColor: '#1e3a5f', backgroundColor: '#0a0f1e' }}>
          <button onClick={() => { setShowCropper(false); setRawImageSrc(null); }}
            className="px-5 py-2.5 rounded-xl border text-sm font-medium transition-colors"
            style={{ borderColor: '#1e3a5f', color: '#94a3b8' }}>キャンセル</button>
          <button onClick={handleCropAndUpload} disabled={uploading}
            className="px-6 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#3b82f6' }}>
            {uploading ? '⏳ アップロード中...' : '✓ この範囲で保存'}
          </button>
        </div>
      </div>
    )}
    </>
  );
}

// ── 体験写真管理フォーム ──────────────────────────────────
function ExperiencePhotosForm({ onToast }: { onToast: (msg: string) => void }) {
  const [photos, setPhotos] = useState<string[]>(['', '', '', '', '', '']);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [cropTargetIdx, setCropTargetIdx] = useState<number | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'experience_photos')
      .single()
      .then(({ data }) => {
        if (data?.value?.photos) setPhotos(data.value.photos);
      });
  }, []);

  // ファイル選択後の処理（input[type=file]のonChange）
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      if (!src) return;
      setRawImageSrc(src);
      setCropTargetIdx(idx);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    // 同じファイルを再選択できるようにリセット
    e.target.value = '';
  };

  const onCropComplete = useCallback((_: unknown, pixels: CropArea) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleCropAndUpload = async () => {
    if (!rawImageSrc || !croppedAreaPixels || cropTargetIdx === null) return;
    const idx = cropTargetIdx;
    setUploadingIdx(idx);
    setShowCropper(false);
    try {
      const blob = await getCroppedImg(rawImageSrc, croppedAreaPixels);
      const filename = `experience_${idx}_${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from('photos')
        .upload(filename, blob, { upsert: true, contentType: 'image/jpeg' });
      if (error) throw error;
      const { data } = supabase.storage.from('photos').getPublicUrl(filename);
      const newPhotos = [...photos];
      newPhotos[idx] = `${data.publicUrl}?t=${Date.now()}`;
      setPhotos(newPhotos);
      setRawImageSrc(null);
      setCropTargetIdx(null);
      onToast('✅ アップロード完了！「写真を保存する」を押して確定してください');
    } catch (err) {
      console.error('Upload error:', err);
      onToast('❌ アップロードに失敗しました（photosバケットが存在するか確認してください）');
    }
    finally { setUploadingIdx(null); }
  };

  const handleDelete = (idx: number) => {
    const newPhotos = [...photos];
    newPhotos[idx] = '';
    setPhotos(newPhotos);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase
        .from('site_settings')
        .upsert({ key: 'experience_photos', value: { photos }, updated_at: new Date().toISOString() });
      onToast('✅ 写真URLを保存しました');
    } catch { onToast('❌ 保存に失敗しました'); }
    finally { setSaving(false); }
  };

  return (
    <>
    <div className="mt-10 pt-8 border-t" style={{ borderColor: '#1e3a5f' }}>
      <h3 className="text-white font-bold text-lg mb-2">📷 体験写真管理</h3>
      <p className="text-xs mb-1" style={{ color: '#64748b' }}>
        /lessons/experience に表示する写真（最大6枚・16:9）
      </p>
      <p className="text-xs mb-6" style={{ color: '#475569' }}>
        ※ Supabaseに <code className="bg-slate-800 px-1 rounded">photos</code> バケット（Public）が必要です
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {photos.map((url, idx) => (
          <div key={idx} className="rounded-xl overflow-hidden border" style={{ borderColor: '#1e3a5f', backgroundColor: '#0a0f1e' }}>
            {/* プレビュー */}
            <div className="aspect-video relative flex items-center justify-center" style={{ backgroundColor: '#111827' }}>
              {url ? (
                <>
                  <img src={url} alt={`写真${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleDelete(idx)}
                    className="absolute top-1 right-1 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ backgroundColor: 'rgba(239,68,68,0.9)' }}
                  >✕</button>
                </>
              ) : (
                <div className="text-center pointer-events-none">
                  <span className="text-2xl block mb-1">📷</span>
                  <span className="text-xs" style={{ color: '#475569' }}>スロット {idx + 1}</span>
                </div>
              )}
              {uploadingIdx === idx && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                  <span className="text-white text-sm font-bold">⏳ 処理中...</span>
                </div>
              )}
            </div>
            {/* ─── label でファイルinputを直接トリガー（最も確実な方法）─── */}
            <div className="p-2">
              <label
                className="w-full px-3 py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                style={{
                  borderColor: '#1e3a5f',
                  color: uploadingIdx !== null ? '#475569' : '#94a3b8',
                  backgroundColor: '#0a0f1e',
                  pointerEvents: uploadingIdx !== null ? 'none' : 'auto',
                }}
                onMouseEnter={e => { if (uploadingIdx === null) (e.currentTarget as HTMLLabelElement).style.borderColor = '#3b82f6'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLLabelElement).style.borderColor = '#1e3a5f'; }}
              >
                📁 {url ? '差し替え' : 'アップロード'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingIdx !== null}
                  onChange={e => handleFileChange(e, idx)}
                />
              </label>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        disabled={saving}
        onClick={handleSave}
        className="px-8 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: '#3b82f6' }}
      >
        {saving ? '保存中...' : '✓ 写真を保存する'}
      </button>
    </div>

    {/* クロッパーオーバーレイ */}
    {showCropper && rawImageSrc && (
      <div className="fixed inset-0 flex flex-col" style={{ zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.92)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: '#1e3a5f', backgroundColor: '#0a0f1e' }}>
          <h3 className="text-white font-bold">📐 写真をトリミング（16:9）</h3>
          <button
            type="button"
            onClick={() => { setShowCropper(false); setRawImageSrc(null); setCropTargetIdx(null); }}
            className="text-slate-400 hover:text-white text-2xl leading-none w-10 h-10 flex items-center justify-center"
          >✕</button>
        </div>
        <div className="relative flex-1" style={{ minHeight: 0 }}>
          <Cropper
            image={rawImageSrc}
            crop={crop}
            zoom={zoom}
            aspect={16 / 9}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="px-6 py-3 flex items-center gap-4 flex-shrink-0" style={{ backgroundColor: '#0a0f1e' }}>
          <span className="text-xs text-slate-400 w-12 text-right">縮小</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            className="flex-1 accent-blue-500"
          />
          <span className="text-xs text-slate-400 w-12">拡大</span>
        </div>
        <div className="flex gap-3 justify-end px-5 py-4 border-t flex-shrink-0" style={{ borderColor: '#1e3a5f', backgroundColor: '#0a0f1e' }}>
          <button
            type="button"
            onClick={() => { setShowCropper(false); setRawImageSrc(null); setCropTargetIdx(null); }}
            className="px-5 py-2.5 rounded-xl border text-sm font-medium"
            style={{ borderColor: '#1e3a5f', color: '#94a3b8' }}
          >キャンセル</button>
          <button
            type="button"
            onClick={handleCropAndUpload}
            className="px-6 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90"
            style={{ backgroundColor: '#3b82f6' }}
          >
            ✓ この範囲でアップロード
          </button>
        </div>
      </div>
    )}
    </>
  );
}

// ── 受講者の声管理フォーム ────────────────────────────────
interface Testimonial {
  name: string;
  animal_type: string;
  comment: string;
}

const emptyTestimonial = (): Testimonial => ({ name: '', animal_type: '', comment: '' });

function TestimonialsForm({ onToast }: { onToast: (msg: string) => void }) {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'experience_testimonials')
      .single()
      .then(({ data, error }) => {
        if (!error && data?.value?.testimonials?.length) {
          setItems(data.value.testimonials);
        } else {
          setItems([emptyTestimonial(), emptyTestimonial(), emptyTestimonial()]);
        }
      });
  }, []);

  const set = (idx: number, key: keyof Testimonial, val: string) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [key]: val } : item));
  };

  const addItem = () => setItems(prev => [...prev, emptyTestimonial()]);

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase
        .from('site_settings')
        .upsert({ key: 'experience_testimonials', value: { testimonials: items }, updated_at: new Date().toISOString() });
      onToast('✅ 受講者の声を保存しました');
    } catch { onToast('❌ 保存に失敗しました'); }
    finally { setSaving(false); }
  };

  return (
    <div className="mt-10 pt-8 border-t" style={{ borderColor: '#1e3a5f' }}>
      <h3 className="text-white font-bold text-lg mb-2">💬 受講者の声管理</h3>
      <p className="text-xs mb-6" style={{ color: '#64748b' }}>
        /lessons/experience と /lessons に表示される受講者の声を管理します
      </p>
      <div className="space-y-4 mb-6">
        {items.map((item, idx) => (
          <div key={idx} className="rounded-xl border p-4 relative" style={{ borderColor: '#1e3a5f', backgroundColor: '#0a0f1e' }}>
            <button
              type="button"
              onClick={() => removeItem(idx)}
              className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors hover:bg-red-900"
              style={{ color: '#ef4444' }}
            >✕</button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: '#94a3b8' }}>お名前</label>
                <input
                  value={item.name}
                  onChange={e => set(idx, 'name', e.target.value)}
                  placeholder="田中さん（30代・女性）"
                  className="w-full px-3 py-2 rounded-lg border outline-none focus:border-blue-500 text-white text-sm"
                  style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: '#94a3b8' }}>動物タイプ（任意）</label>
                <input
                  value={item.animal_type}
                  onChange={e => set(idx, 'animal_type', e.target.value)}
                  placeholder="例：カワウソ型"
                  className="w-full px-3 py-2 rounded-lg border outline-none focus:border-blue-500 text-white text-sm"
                  style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: '#94a3b8' }}>コメント</label>
              <textarea
                value={item.comment}
                onChange={e => set(idx, 'comment', e.target.value)}
                rows={3}
                placeholder="レッスンの感想を入力..."
                className="w-full px-3 py-2 rounded-lg border outline-none focus:border-blue-500 text-white text-sm resize-none"
                style={{ backgroundColor: '#111827', borderColor: '#1e3a5f', lineHeight: '1.6' }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={addItem}
          className="px-5 py-2.5 rounded-xl border text-sm font-bold transition-all hover:border-blue-500 hover:text-blue-400"
          style={{ borderColor: '#1e3a5f', color: '#94a3b8', backgroundColor: '#0a0f1e' }}
        >
          ＋ 声を追加
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="px-8 py-2.5 rounded-xl font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#3b82f6' }}
        >
          {saving ? '保存中...' : '✓ 保存する'}
        </button>
      </div>
    </div>
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

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const load = () => { setLoading(true); fetchAllPostsAdmin().then(setPosts).finally(() => setLoading(false)); };

  useEffect(() => { if (isAuthenticated) load(); }, [isAuthenticated]);

  if (authLoading) return null;
  if (!isAuthenticated) return <LoginScreen onLogin={login} />;

  const filtered = posts.filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.tags?.some(t => t.includes(search))
  );
  const published = posts.filter(p => p.status === 'published').length;
  const draft = posts.filter(p => p.status === 'draft').length;

  if (mode === 'create' || mode === 'edit') {
    const initial = editingPost
      ? { title: editingPost.title, body: editingPost.body, thumbnail_url: editingPost.thumbnail_url || '', youtube_url: editingPost.youtube_url || '', external_url: editingPost.external_url || '', tags: editingPost.tags || [], status: editingPost.status, content_type: editingPost.content_type || 'html' as const }
      : emptyForm();

    const handleSave = async (form: Omit<Post, 'id' | 'created_at'>) => {
      try {
        if (mode === 'edit' && editingPost) { await updatePost(editingPost.id, form); showToast('✅ 記事を更新しました'); }
        else { await createPost(form); showToast('✅ 記事を作成しました'); }
        load(); setMode('list');
      } catch { showToast('❌ 保存に失敗しました'); }
    };

    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        {toast && <Toast msg={toast} />}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => setMode('list')} className="flex items-center gap-1 text-sm transition-colors hover:text-blue-300" style={{ color: '#3b82f6' }}>← 一覧に戻る</button>
          <span style={{ color: '#1e3a5f' }}>/</span>
          <h1 className="text-xl font-bold text-white">{mode === 'edit' ? '記事を編集' : '新規記事作成'}</h1>
        </div>
        <div className="rounded-2xl border p-6 md:p-8" style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}>
          <PostForm mode={mode} initial={initial} onSave={handleSave} onCancel={() => setMode('list')} />
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      {toast && <Toast msg={toast} />}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white">🛠 管理画面</h1>
        <button onClick={logout} className="px-4 py-2.5 rounded-xl text-sm border transition-colors hover:border-red-500 hover:text-red-400" style={{ borderColor: '#1e3a5f', color: '#64748b' }}>ログアウト</button>
      </div>
      <div className="flex gap-1 mb-8 p-1 rounded-xl" style={{ backgroundColor: '#111827' }}>
        {([['posts', '📝 記事管理'], ['lessons', '🏃 レッスン管理'], ['leads', '📊 診断リード'], ['profile', '👤 プロフィール']] as [AdminTab, string][]).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all"
            style={{ backgroundColor: activeTab === tab ? '#3b82f6' : 'transparent', color: activeTab === tab ? '#fff' : '#64748b' }}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="rounded-2xl border p-6 md:p-8" style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}>
          <ProfileForm onToast={showToast} />
          <ExperiencePhotosForm onToast={showToast} />
          <TestimonialsForm onToast={showToast} />
        </div>
      )}

      {activeTab === 'lessons' && <LessonsAdminTab onToast={showToast} />}

      {activeTab === 'leads' && <QuizLeadsTab />}

      {activeTab === 'posts' && (<>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm" style={{ color: '#475569' }}>全 {posts.length} 件（公開 {published} · 下書き {draft}）</p>
          <button onClick={() => { setEditingPost(null); setMode('create'); }}
            className="px-5 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 flex items-center gap-1"
            style={{ backgroundColor: '#3b82f6' }}>+ 新規作成</button>
        </div>
        <div className="mb-6">
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full md:w-72 px-4 py-2.5 rounded-xl border outline-none focus:border-blue-500 text-white text-sm"
            style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}
            placeholder="🔍 タイトル・タグで検索" />
        </div>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 rounded-2xl border" style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}>
            <p className="text-5xl mb-4">📝</p>
            <p className="font-bold text-white mb-1">{search ? '検索結果がありません' : 'まだ記事がありません'}</p>
            {!search && <button onClick={() => { setEditingPost(null); setMode('create'); }} className="mt-4 text-sm underline" style={{ color: '#3b82f6' }}>最初の記事を作成する</button>}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(post => (
              <PostRow key={post.id} post={post}
                onEdit={() => { setEditingPost(post); setMode('edit'); }}
                onDelete={async () => {
                  if (!confirm(`「${post.title}」を削除しますか？`)) return;
                  try { await deletePost(post.id); showToast('🗑 削除しました'); load(); }
                  catch { showToast('❌ 削除に失敗しました'); }
                }} />
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
    <div className="flex items-center gap-4 p-4 rounded-xl border transition-colors hover:border-blue-900" style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}>
      {post.thumbnail_url
        ? <img src={post.thumbnail_url} alt="" className="w-16 h-12 object-cover rounded-lg flex-shrink-0" />
        : <div className="w-16 h-12 rounded-lg flex-shrink-0 flex items-center justify-center text-2xl" style={{ backgroundColor: '#1a3a5c' }}>🌊</div>
      }
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white text-sm truncate leading-snug">{post.title}</p>
        <div className="flex items-center flex-wrap gap-2 mt-1.5">
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: post.status === 'published' ? 'rgba(59,130,246,0.15)' : 'rgba(100,116,139,0.15)', color: post.status === 'published' ? '#3b82f6' : '#64748b' }}>
            {post.status === 'published' ? '🌐 公開' : '🔒 下書き'}
          </span>
          {post.tags?.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1e3a5f', color: '#7dd3fc' }}>#{tag}</span>
          ))}
          <span className="text-xs" style={{ color: '#334155' }}>{date}</span>
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button onClick={onEdit} className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:border-blue-500 hover:text-blue-400" style={{ borderColor: '#1e3a5f', color: '#94a3b8' }}>編集</button>
        <button onClick={onDelete} className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:border-red-500 hover:text-red-400" style={{ borderColor: '#1e3a5f', color: '#94a3b8' }}>削除</button>
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
    <div className="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-medium text-white shadow-lg" style={{ backgroundColor: '#1a3a5c', border: '1px solid #1e3a5f' }}>
      {msg}
    </div>
  );
}

// ── レッスン管理タブ ───────────────────────────────────────
const emptyLessonForm = (): Omit<Lesson, 'id' | 'created_at'> => ({
  title: '',
  lesson_type: 'strength',
  description: null,
  date: '',
  start_time: '',
  end_time: '',
  location: '',
  capacity: 8,
  price: 3000,
  instructor: 'しょっちゃん',
  status: 'draft',
  payment_deadline: null,
  paypay_id: 'shocchance',
});

function LessonsAdminTab({ onToast }: { onToast: (msg: string) => void }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [form, setForm] = useState<Omit<Lesson, 'id' | 'created_at'>>(emptyLessonForm());
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [entries, setEntries] = useState<LessonEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  const load = () => {
    setLoading(true);
    fetchAllLessonsAdmin().then(setLessons).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingLesson(null);
    setForm(emptyLessonForm());
    setShowForm(true);
    setSelectedLesson(null);
  };

  const openEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setForm({
      title: lesson.title,
      lesson_type: lesson.lesson_type,
      description: lesson.description,
      date: lesson.date,
      start_time: lesson.start_time,
      end_time: lesson.end_time,
      location: lesson.location,
      capacity: lesson.capacity,
      price: lesson.price,
      instructor: lesson.instructor,
      status: lesson.status,
      payment_deadline: lesson.payment_deadline,
      paypay_id: lesson.paypay_id,
    });
    setShowForm(true);
    setSelectedLesson(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLesson) {
        await updateLesson(editingLesson.id, form);
        onToast('✅ レッスンを更新しました');
      } else {
        await createLesson(form);
        onToast('✅ レッスンを作成しました');
      }
      setShowForm(false);
      load();
    } catch {
      onToast('❌ 保存に失敗しました');
    }
  };

  const handleDelete = async (lesson: Lesson) => {
    if (!confirm(`「${lesson.title}」を削除しますか？`)) return;
    try {
      await deleteLesson(lesson.id);
      onToast('🗑 削除しました');
      load();
    } catch {
      onToast('❌ 削除に失敗しました');
    }
  };

  const handleStatusToggle = async (lesson: Lesson, status: LessonStatus) => {
    try {
      await updateLesson(lesson.id, { status });
      onToast('✅ ステータスを更新しました');
      load();
    } catch {
      onToast('❌ 更新に失敗しました');
    }
  };

  const openEntries = async (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setShowForm(false);
    setLoadingEntries(true);
    const data = await fetchEntriesForLesson(lesson.id);
    setEntries(data);
    setLoadingEntries(false);
  };

  const handlePaymentStatus = async (entry: LessonEntry, status: LessonEntry['payment_status']) => {
    try {
      await updateEntryPaymentStatus(entry.id, status);
      onToast('✅ 入金ステータスを更新しました');
      if (selectedLesson) openEntries(selectedLesson);
    } catch {
      onToast('❌ 更新に失敗しました');
    }
  };

  const inputStyle = { backgroundColor: '#0a0f1e', borderColor: '#1e3a5f', color: '#e2e8f0' };

  if (showForm) {
    return (
      <div>
        <button onClick={() => setShowForm(false)} className="flex items-center gap-1 text-sm mb-6 transition-colors hover:text-blue-300" style={{ color: '#3b82f6' }}>
          ← 一覧に戻る
        </button>
        <h2 className="text-lg font-bold text-white mb-5">{editingLesson ? 'レッスンを編集' : '新規レッスン作成'}</h2>
        <form onSubmit={handleSave} className="rounded-2xl border p-6 space-y-4" style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: '#94a3b8' }}>タイトル <span style={{ color: '#ef4444' }}>*</span></label>
              <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border outline-none text-sm focus:border-blue-500"
                style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#94a3b8' }}>レッスンタイプ <span style={{ color: '#ef4444' }}>*</span></label>
              <select required value={form.lesson_type} onChange={e => setForm(f => ({ ...f, lesson_type: e.target.value as LessonType }))}
                className="w-full px-4 py-2.5 rounded-xl border outline-none text-sm"
                style={inputStyle}>
                {(Object.entries(LESSON_TYPE_MAP) as [LessonType, typeof LESSON_TYPE_MAP[LessonType]][]).map(([type, info]) => (
                  <option key={type} value={type}>{info.emoji} {info.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#94a3b8' }}>ステータス</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as LessonStatus }))}
                className="w-full px-4 py-2.5 rounded-xl border outline-none text-sm"
                style={inputStyle}>
                <option value="draft">🔒 下書き</option>
                <option value="published">🌐 公開</option>
                <option value="cancelled">❌ キャンセル</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#94a3b8' }}>開催日 <span style={{ color: '#ef4444' }}>*</span></label>
              <input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border outline-none text-sm"
                style={inputStyle} />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1" style={{ color: '#94a3b8' }}>開始時間 <span style={{ color: '#ef4444' }}>*</span></label>
                <input required type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border outline-none text-sm"
                  style={inputStyle} />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1" style={{ color: '#94a3b8' }}>終了時間 <span style={{ color: '#ef4444' }}>*</span></label>
                <input required type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border outline-none text-sm"
                  style={inputStyle} />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: '#94a3b8' }}>場所 <span style={{ color: '#ef4444' }}>*</span></label>
              <input required value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border outline-none text-sm"
                style={inputStyle} placeholder="例：渋谷区代々木公園" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#94a3b8' }}>定員</label>
              <input type="number" min={1} value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 rounded-xl border outline-none text-sm"
                style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#94a3b8' }}>参加費（円）</label>
              <input type="number" min={0} value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 rounded-xl border outline-none text-sm"
                style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#94a3b8' }}>支払い期限</label>
              <input type="date" value={form.payment_deadline ?? ''} onChange={e => setForm(f => ({ ...f, payment_deadline: e.target.value || null }))}
                className="w-full px-4 py-2.5 rounded-xl border outline-none text-sm"
                style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#94a3b8' }}>PayPay ID</label>
              <input value={form.paypay_id ?? ''} onChange={e => setForm(f => ({ ...f, paypay_id: e.target.value || null }))}
                className="w-full px-4 py-2.5 rounded-xl border outline-none text-sm"
                style={inputStyle} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: '#94a3b8' }}>説明文</label>
              <textarea rows={4} value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value || null }))}
                className="w-full px-4 py-2.5 rounded-xl border outline-none text-sm resize-none"
                style={inputStyle} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="px-6 py-2.5 rounded-xl font-bold text-white text-sm" style={{ backgroundColor: '#3b82f6' }}>
              {editingLesson ? '更新する' : '作成する'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-xl text-sm border" style={{ borderColor: '#1e3a5f', color: '#64748b' }}>
              キャンセル
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (selectedLesson) {
    return (
      <div>
        <button onClick={() => setSelectedLesson(null)} className="flex items-center gap-1 text-sm mb-6 transition-colors hover:text-blue-300" style={{ color: '#3b82f6' }}>
          ← レッスン一覧に戻る
        </button>
        <h2 className="text-lg font-bold text-white mb-1">申込者一覧</h2>
        <p className="text-sm mb-5" style={{ color: '#64748b' }}>{selectedLesson.title}</p>
        {loadingEntries ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl animate-pulse" style={{ backgroundColor: '#1e3a5f' }} />)}</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border" style={{ borderColor: '#1e3a5f', color: '#64748b' }}>
            <p className="text-3xl mb-2">📋</p>
            <p>まだ申込者はいません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map(entry => (
              <div key={entry.id} className="flex items-center gap-4 p-4 rounded-xl border" style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm">{entry.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{entry.email}{entry.phone ? ` · ${entry.phone}` : ''}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
                    申込日：{new Date(entry.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                  {entry.message && <p className="text-xs mt-1" style={{ color: '#64748b' }}>💬 {entry.message}</p>}
                </div>
                <select
                  value={entry.payment_status}
                  onChange={e => handlePaymentStatus(entry, e.target.value as LessonEntry['payment_status'])}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border outline-none"
                  style={{
                    backgroundColor: entry.payment_status === 'paid' ? 'rgba(34,197,94,0.15)' : entry.payment_status === 'cancelled' ? 'rgba(239,68,68,0.15)' : 'rgba(100,116,139,0.15)',
                    borderColor: entry.payment_status === 'paid' ? '#22c55e' : entry.payment_status === 'cancelled' ? '#ef4444' : '#64748b',
                    color: entry.payment_status === 'paid' ? '#22c55e' : entry.payment_status === 'cancelled' ? '#ef4444' : '#94a3b8',
                  }}
                >
                  <option value="unpaid">⏳ 未払い</option>
                  <option value="paid">✅ 入金済み</option>
                  <option value="cancelled">❌ キャンセル</option>
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm" style={{ color: '#475569' }}>全 {lessons.length} 件</p>
        <button onClick={openCreate} className="px-5 py-2.5 rounded-xl font-bold text-white text-sm" style={{ backgroundColor: '#3b82f6' }}>
          + 新規作成
        </button>
      </div>
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ backgroundColor: '#1e3a5f' }} />)}</div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border" style={{ borderColor: '#1e3a5f', color: '#64748b' }}>
          <p className="text-4xl mb-3">🏃</p>
          <p className="font-bold text-white mb-1">まだレッスンがありません</p>
          <button onClick={openCreate} className="mt-3 text-sm underline" style={{ color: '#3b82f6' }}>最初のレッスンを作成する</button>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map(lesson => {
            const info = LESSON_TYPE_MAP[lesson.lesson_type];
            const statusColor = lesson.status === 'published' ? '#3b82f6' : lesson.status === 'cancelled' ? '#ef4444' : '#64748b';
            const statusLabel = lesson.status === 'published' ? '🌐 公開' : lesson.status === 'cancelled' ? '❌ キャンセル' : '🔒 下書き';
            return (
              <div key={lesson.id} className="flex items-center gap-4 p-4 rounded-xl border" style={{ backgroundColor: '#111827', borderColor: '#1e3a5f', borderLeft: `3px solid ${info.color}` }}>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{info.emoji} {lesson.title}</p>
                  <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                    {lesson.date} {lesson.start_time.slice(0,5)}〜{lesson.end_time.slice(0,5)} · {lesson.location}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${statusColor}22`, color: statusColor }}>{statusLabel}</span>
                    <span className="text-xs" style={{ color: '#475569' }}>¥{lesson.price.toLocaleString()} · {lesson.capacity}名</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                  <button onClick={() => openEntries(lesson)} className="px-3 py-1.5 rounded-lg text-xs border transition-colors hover:border-green-500 hover:text-green-400" style={{ borderColor: '#1e3a5f', color: '#94a3b8' }}>申込者</button>
                  {lesson.status !== 'published' && (
                    <button onClick={() => handleStatusToggle(lesson, 'published')} className="px-3 py-1.5 rounded-lg text-xs border transition-colors hover:border-blue-500 hover:text-blue-400" style={{ borderColor: '#1e3a5f', color: '#94a3b8' }}>公開</button>
                  )}
                  {lesson.status === 'published' && (
                    <button onClick={() => handleStatusToggle(lesson, 'draft')} className="px-3 py-1.5 rounded-lg text-xs border transition-colors hover:border-yellow-500 hover:text-yellow-400" style={{ borderColor: '#1e3a5f', color: '#94a3b8' }}>下書きに戻す</button>
                  )}
                  <button onClick={() => openEdit(lesson)} className="px-3 py-1.5 rounded-lg text-xs border transition-colors hover:border-blue-500 hover:text-blue-400" style={{ borderColor: '#1e3a5f', color: '#94a3b8' }}>編集</button>
                  <button onClick={() => handleDelete(lesson)} className="px-3 py-1.5 rounded-lg text-xs border transition-colors hover:border-red-500 hover:text-red-400" style={{ borderColor: '#1e3a5f', color: '#94a3b8' }}>削除</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface QuizLead {
  id: string;
  name: string;
  email: string;
  wild_type: string;
  scores: Record<string, number>;
  created_at: string;
}

function QuizLeadsTab() {
  const [leads, setLeads] = useState<QuizLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('quiz_leads')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setLeads((data as QuizLead[]) ?? []);
        setLoading(false);
      });
  }, []);

  const handleExportCsv = () => {
    const header = 'お名前,メール,野生タイプ,診断日時';
    const rows = leads.map(l =>
      [l.name, l.email, l.wild_type, new Date(l.created_at).toLocaleString('ja-JP')].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm" style={{ color: '#475569' }}>全 {leads.length} 件</p>
        <button
          onClick={handleExportCsv}
          className="px-4 py-2 rounded-xl text-sm font-bold border transition-colors hover:border-green-500 hover:text-green-400"
          style={{ borderColor: '#1e3a5f', color: '#94a3b8' }}
        >
          📥 CSVエクスポート
        </button>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: '#475569' }}>読み込み中...</p>
      ) : leads.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center" style={{ backgroundColor: '#111827', borderColor: '#1e3a5f' }}>
          <p className="text-3xl mb-3">📭</p>
          <p className="font-bold text-white mb-1">リードがまだありません</p>
          <p className="text-sm" style={{ color: '#475569' }}>詳細診断が回答されると、ここに表示されます。</p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#1e3a5f' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#0a0f1e' }}>
                <th className="px-4 py-3 text-left font-bold" style={{ color: '#94a3b8' }}>お名前</th>
                <th className="px-4 py-3 text-left font-bold" style={{ color: '#94a3b8' }}>メール</th>
                <th className="px-4 py-3 text-left font-bold" style={{ color: '#94a3b8' }}>野生タイプ</th>
                <th className="px-4 py-3 text-left font-bold" style={{ color: '#94a3b8' }}>診断日時</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, i) => (
                <tr
                  key={lead.id}
                  style={{ backgroundColor: i % 2 === 0 ? '#111827' : '#0d1424', borderTop: '1px solid #1e3a5f' }}
                >
                  <td className="px-4 py-3 text-white">{lead.name}</td>
                  <td className="px-4 py-3" style={{ color: '#94a3b8' }}>{lead.email}</td>
                  <td className="px-4 py-3 font-bold" style={{ color: '#2D8F4E' }}>{lead.wild_type}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#475569' }}>
                    {new Date(lead.created_at).toLocaleString('ja-JP')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
