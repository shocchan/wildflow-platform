// SNS企画工場のメイン画面(/admin/factory)。管理者ログイン必須。
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  fetchAudiences, fetchBrand, fetchIdeas, fetchMaterials, fetchPillars,
  fetchReferencePosts, fetchResults, fetchValues, fetchWinPatterns, isMissingTableError,
} from '../../features/factory/api';
import type {
  Audience, Brand, Idea, Material, Pillar, PostResult, ReferencePost, ValueDef, WinPattern,
} from '../../features/factory/types';
import { Btn, C, Notice } from './ui';
import { IdeasTab } from './IdeasTab';
import { CalendarTab } from './CalendarTab';
import { GenerateTab } from './GenerateTab';
import { DataTab } from './DataTab';
import { ResultsTab } from './ResultsTab';

export interface FactoryData {
  brand: Brand | null;
  values: ValueDef[];
  pillars: Pillar[];
  audiences: Audience[];
  materials: Material[];
  references: ReferencePost[];
  ideas: Idea[];
  results: PostResult[];
  winPatterns: WinPattern[];
}

const TABS = [
  { id: 'ideas', label: '📋 企画ボード' },
  { id: 'calendar', label: '🗓 カレンダー' },
  { id: 'generate', label: '⚙️ 生成' },
  { id: 'results', label: '📈 結果・勝ちパターン' },
  { id: 'data', label: '🗂 素材・視聴者・参考・ブランド' },
] as const;
type TabId = typeof TABS[number]['id'];

function LoginForm({ onLogin }: { onLogin: (email: string, pw: string) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  return (
    <div className="max-w-sm mx-auto py-20 px-4">
      <h1 className="text-xl font-black mb-4" style={{ color: C.text }}>🏭 企画工場ログイン</h1>
      <p className="text-sm mb-4" style={{ color: C.sub }}>管理画面と同じアカウントでログインしてください。</p>
      {err && <Notice tone="error">{err}</Notice>}
      <form onSubmit={async e => {
        e.preventDefault();
        try { await onLogin(email, pw); } catch (ex) { setErr(ex instanceof Error ? ex.message : 'ログイン失敗'); }
      }}>
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
          placeholder="メールアドレス" className="w-full rounded-lg border px-3 py-2 mb-2 text-sm"
          style={{ borderColor: C.border }} autoComplete="email" />
        <input type="password" required value={pw} onChange={e => setPw(e.target.value)}
          placeholder="パスワード" className="w-full rounded-lg border px-3 py-2 mb-4 text-sm"
          style={{ borderColor: C.border }} autoComplete="current-password" />
        <button type="submit" className="w-full rounded-lg py-2 font-bold text-white"
          style={{ backgroundColor: C.green }}>ログイン</button>
      </form>
    </div>
  );
}

export function FactoryPage() {
  const { isAuthenticated, loading: authLoading, login } = useAuth();
  const [tab, setTab] = useState<TabId>('ideas');
  const [data, setData] = useState<FactoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [brand, values, pillars, audiences, materials, references, ideas, results, winPatterns] =
        await Promise.all([
          fetchBrand(), fetchValues(), fetchPillars(), fetchAudiences(), fetchMaterials(),
          fetchReferencePosts(), fetchIdeas(), fetchResults(), fetchWinPatterns(),
        ]);
      setData({ brand, values, pillars, audiences, materials, references, ideas, results, winPatterns });
      setSetupNeeded(false);
    } catch (e) {
      if (isMissingTableError(e)) {
        setSetupNeeded(true);
      } else {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- ログイン確立後の初回データロード(既存AdminPageと同パターン)
  useEffect(() => { if (isAuthenticated) void reload(); }, [isAuthenticated, reload]);

  if (authLoading) return <div className="py-20 text-center" style={{ color: C.sub }}>読み込み中...</div>;
  if (!isAuthenticated) return <LoginForm onLogin={login} />;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-black" style={{ color: C.text }}>🏭 SNS企画工場</h1>
        <Btn kind="ghost" small onClick={() => void reload()}>再読み込み</Btn>
      </div>
      <p className="text-sm mb-5" style={{ color: C.sub }}>
        wild-flowのブランド・視聴者・一次情報・投稿結果を蓄積し、価値の高い企画を生成・審査・改善する。
      </p>

      {setupNeeded && (
        <Notice tone="warn">
          <b>初期セットアップが必要です。</b> データベースにテーブルがありません。<br />
          <code>supabase/migrations/20260727_plan_factory.sql</code> を Supabase の SQL Editor で実行するか、
          <code> SUPABASE_ACCESS_TOKEN</code> を設定して <code>supabase db push</code> を実行してから「再読み込み」を押してください。
        </Notice>
      )}
      {error && <Notice tone="error">{error}</Notice>}

      <nav className="flex flex-wrap gap-2 mb-6">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-3 py-1.5 rounded-full text-sm font-bold border"
            style={tab === t.id
              ? { backgroundColor: C.green, color: '#fff', borderColor: C.green }
              : { backgroundColor: '#fff', color: C.text, borderColor: C.border }}>
            {t.label}
          </button>
        ))}
      </nav>

      {loading && <p className="text-sm mb-4" style={{ color: C.sub }}>データ取得中...</p>}

      {data && !setupNeeded && (
        <>
          {tab === 'ideas' && <IdeasTab data={data} reload={reload} />}
          {tab === 'calendar' && <CalendarTab data={data} reload={reload} />}
          {tab === 'generate' && <GenerateTab data={data} reload={reload} />}
          {tab === 'results' && <ResultsTab data={data} reload={reload} />}
          {tab === 'data' && <DataTab data={data} reload={reload} />}
        </>
      )}
    </main>
  );
}
