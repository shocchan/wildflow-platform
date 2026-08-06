// 投稿結果の登録・目的別評価・率指標・価値ごとの成果集計・勝ちパターン候補管理
import { Fragment, useMemo, useState } from 'react';
import type { FactoryData } from './FactoryPage';
import type { Idea, PostResult } from '../../features/factory/types';
import { fetchWinPatterns, updateIdea, upsertResult, upsertWinPattern } from '../../features/factory/api';
import {
  ANALYSIS_FACTORS, PLATFORMS, PURPOSE_LABELS, PURPOSE_METRICS, RATE_DEFS, safeRate, winStageLabel,
} from '../../features/factory/constants';
import { Btn, C, Card, Field, Notice, Tag, TextArea, TextInput } from './ui';

const NUM_FIELDS: { key: keyof PostResult; label: string }[] = [
  { key: 'views', label: '再生数' },
  { key: 'new_viewers', label: '新規視聴者' },
  { key: 'avg_watch_sec', label: '平均視聴時間(秒)' },
  { key: 'retention_pct', label: '視聴維持率(%)' },
  { key: 'likes', label: 'いいね' },
  { key: 'saves', label: '保存' },
  { key: 'comments_count', label: 'コメント' },
  { key: 'shares', label: 'シェア' },
  { key: 'follows', label: 'フォロー' },
  { key: 'profile_views', label: 'プロフィール閲覧' },
  { key: 'site_clicks', label: 'サイト遷移' },
  { key: 'lesson_inquiries', label: 'レッスンへの質問' },
  { key: 'trial_requests', label: '体験希望' },
  { key: 'purchases', label: '申込み' },
];

/** 投稿日からの経過日数(PF間比較は同じ経過日数で行う) */
function daysSince(posted: string | null | undefined): string {
  if (!posted) return '—';
  const days = Math.floor((Date.now() - new Date(posted).getTime()) / 86400000);
  return days < 0 ? '—' : `${days}日`;
}

/** 結果1件の率指標(分母を明示。分母0/未入力はnull→「—」表示) */
function computeRates(r: Partial<PostResult>): { label: string; value: number | null; formula: string }[] {
  const g = (k: string) => (r as Record<string, unknown>)[k] as number | null | undefined;
  const denLabel: Record<string, string> = {
    views: '再生数', profile_views: 'プロフィール閲覧', site_clicks: 'サイト遷移',
  };
  const numLabel: Record<string, string> = {
    saves: '保存', likes: 'いいね', comments_count: 'コメント', shares: 'シェア',
    follows: 'フォロー', profile_views: 'プロフィール閲覧', site_clicks: 'サイト遷移',
    trial_requests: '体験希望', purchases: '申込み',
  };
  return RATE_DEFS.map(d => ({
    label: d.label,
    value: safeRate(g(d.num), g(d.den)),
    formula: `${numLabel[d.num] ?? d.num} ÷ ${denLabel[d.den] ?? d.den}`,
  }));
}

function RatesRow({ r }: { r: Partial<PostResult> }) {
  const rates = computeRates(r);
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: C.sub }}>
      {rates.map(x => (
        <span key={x.label} title={x.formula}>
          {x.label}: <b style={{ color: C.text }}>{x.value == null ? '—' : `${x.value.toFixed(2)}%`}</b>
        </span>
      ))}
    </div>
  );
}

function ResultForm({ idea, onDone }: { idea: Idea; onDone: () => void }) {
  const [r, setR] = useState<Partial<PostResult>>({
    idea_id: idea.id, platform: PLATFORMS[0], analysis: {},
    posted_at: new Date().toISOString().slice(0, 10), actual_title: idea.title,
  });
  const [judge, setJudge] = useState<'success' | 'fail' | 'na'>('na');
  const [basis, setBasis] = useState('');
  const [busy, setBusy] = useState(false);
  const num = (v: string) => (v === '' ? null : Number(v));
  const metrics = PURPOSE_METRICS[idea.purpose_main];

  const save = async () => {
    if (judge !== 'na' && !basis.trim()) {
      alert('成果判定には「判定に使った指標と基準」の記録が必須です。');
      return;
    }
    setBusy(true);
    try {
      await upsertResult({
        ...r,
        success_judgment: judge === 'na' ? null : judge,
        success_basis: basis,
      });
      await updateIdea(idea.id, { status: 'posted' });
      // 勝ちパターン候補の集計:
      // キー = 視聴者 × 投稿目的 × 価値の組み合わせ × スタイル。
      // 目的が違う企画を同じ成功として数えない。段階はUIでsuccess_countから導出。
      if (judge !== 'na') {
        const patterns = await fetchWinPatterns();
        const key = [...idea.values_used].sort().join(',');
        const found = patterns.find(p =>
          [...p.values_combo].sort().join(',') === key
          && p.audience === idea.audience
          && p.style === idea.style
          && p.purpose_main === idea.purpose_main);
        const success = (found?.success_count ?? 0) + (judge === 'success' ? 1 : 0);
        const fail = (found?.fail_count ?? 0) + (judge === 'fail' ? 1 : 0);
        await upsertWinPattern({
          id: found?.id,
          audience: idea.audience,
          purpose_main: idea.purpose_main,
          concern: idea.concern,
          theme: idea.title,
          values_combo: idea.values_used,
          hook_type: idea.hook_visual.slice(0, 60),
          duration_sec: idea.duration_sec,
          style: idea.style,
          cta_strength: idea.lesson_cta ? 'あり' : 'なし',
          metric: `${idea.primary_metric} / 基準: ${basis}`,
          success_count: success,
          fail_count: fail,
          platforms: Array.from(new Set([...(found?.platforms ?? []), r.platform!])),
          effective_purposes: Array.from(new Set([...(found?.effective_purposes ?? []), ...(judge === 'success' ? [idea.purpose_main] : [])])),
          confidence: success >= 3 ? 'high' : success >= 2 ? 'mid' : 'low',
          status: found?.status ?? 'candidate',
          next_hypothesis: found?.next_hypothesis ?? '',
          reproducibility: found?.reproducibility ?? '',
        });
      }
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title={`結果を登録: [${idea.code}] ${idea.title}`}>
      <Notice>
        この企画の主目的は<b>「{PURPOSE_LABELS[idea.purpose_main]}」</b>。評価は <b>{metrics.join('・')}</b> を優先して見ます。<br />
        1つの企画に対して<b>プラットフォームごとに1件ずつ</b>登録してください(TikTok・Lemon8・YouTubeショートで計3件)。
      </Notice>
      <div className="grid md:grid-cols-3 gap-x-4">
        <Field label="プラットフォーム">
          <select className="w-full rounded-lg border px-2 py-1.5 text-sm" style={{ borderColor: C.border }}
            value={r.platform} onChange={e => setR({ ...r, platform: e.target.value })}>
            {PLATFORMS.map(p => <option key={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="投稿日"><TextInput type="date" value={r.posted_at ?? ''} onChange={e => setR({ ...r, posted_at: e.target.value })} /></Field>
        <Field label="動画時間(秒)"><TextInput type="number" value={r.duration_sec ?? ''} onChange={e => setR({ ...r, duration_sec: num(e.target.value) })} /></Field>
        <Field label="実際のタイトル・説明文"><TextInput value={r.actual_title ?? ''} onChange={e => setR({ ...r, actual_title: e.target.value })} /></Field>
        <Field label="サムネイルまたは冒頭テロップ"><TextInput value={r.thumb_desc ?? ''} onChange={e => setR({ ...r, thumb_desc: e.target.value })} /></Field>
        <Field label="投稿URL"><TextInput value={r.post_url ?? ''} onChange={e => setR({ ...r, post_url: e.target.value })} placeholder="https://..." /></Field>
        <Field label="動画の編集差分(3PF同一なら空欄)"><TextInput value={r.edit_variant ?? ''} onChange={e => setR({ ...r, edit_variant: e.target.value })} placeholder="例: TikTokのみトレンド音源" /></Field>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-x-3">
        {NUM_FIELDS.map(f => (
          <Field key={f.key} label={metrics.some(m => f.label.includes(m.replace('数', ''))) ? `★ ${f.label}` : f.label}>
            <TextInput type="number" value={(r[f.key] as number | null) ?? ''}
              onChange={e => setR({ ...r, [f.key]: num(e.target.value) })} />
          </Field>
        ))}
      </div>
      <div className="mb-2">
        <p className="text-xs font-bold mb-1" style={{ color: C.sub }}>率指標(自動計算・カーソルで分母表示)</p>
        <RatesRow r={r} />
      </div>
      <Field label="コメント内容の要約"><TextArea value={r.comment_summary ?? ''} onChange={e => setR({ ...r, comment_summary: e.target.value })} /></Field>
      <Field label="本人の振り返り"><TextArea value={r.self_review ?? ''} onChange={e => setR({ ...r, self_review: e.target.value })} /></Field>
      <Field label="撮影・編集上の問題"><TextArea value={r.production_issues ?? ''} onChange={e => setR({ ...r, production_issues: e.target.value })} /></Field>

      <Field label="伸びなかった場合の要因分析(該当するものにチェック。「企画が悪い」と即断しない)">
        <div className="grid md:grid-cols-2 gap-1">
          {ANALYSIS_FACTORS.map(f => (
            <label key={f.key} className="text-sm flex items-center gap-2" style={{ color: C.text }}>
              <input type="checkbox" checked={!!r.analysis?.[f.key]}
                onChange={e => setR({ ...r, analysis: { ...r.analysis, [f.key]: e.target.checked } })} />
              {f.label}
            </label>
          ))}
        </div>
      </Field>
      {(r.analysis?.weak_title_thumb || r.analysis?.weak_hook) && (
        <Notice tone="warn">
          中身がよいのにタイトル・冒頭・サムネイルだけが弱かった場合は、再撮影ではなく「リメイク候補」に回してください(企画ボードでステータス変更)。
        </Notice>
      )}

      <Field label="主目的に対する成果判定(勝ちパターン候補の集計に使用)">
        <div className="flex gap-2 mb-2">
          {([['success', '成果あり'], ['fail', '成果なし'], ['na', '判定保留']] as const).map(([k, label]) => (
            <Btn key={k} small kind={judge === k ? 'primary' : 'ghost'} onClick={() => setJudge(k)}>{label}</Btn>
          ))}
        </div>
        {judge !== 'na' && (
          <TextInput value={basis} onChange={e => setBasis(e.target.value)}
            placeholder="判定に使った指標と基準(必須) 例: 保存率2%超(主目的=保存の基準)" />
        )}
      </Field>

      <div className="flex gap-2 mt-3">
        <Btn disabled={busy} onClick={() => void save()}>結果を保存</Btn>
        <Btn kind="ghost" onClick={onDone}>キャンセル</Btn>
      </div>
    </Card>
  );
}

export function ResultsTab({ data, reload }: { data: FactoryData; reload: () => Promise<void> }) {
  const [formIdea, setFormIdea] = useState<Idea | null>(null);
  const [openResult, setOpenResult] = useState<string | null>(null);
  const postable = data.ideas.filter(i => i.status === 'adopted' || i.status === 'posted');

  // 価値ごとの成果集計(結果→企画→価値でロールアップ)
  const valueStats = useMemo(() => {
    const stats = new Map<string, { count: number; views: number; saves: number; follows: number }>();
    for (const r of data.results) {
      const idea = data.ideas.find(i => i.id === r.idea_id);
      if (!idea) continue;
      for (const v of idea.values_used) {
        const s = stats.get(v) ?? { count: 0, views: 0, saves: 0, follows: 0 };
        s.count += 1;
        s.views += r.views ?? 0;
        s.saves += r.saves ?? 0;
        s.follows += r.follows ?? 0;
        stats.set(v, s);
      }
    }
    return [...stats.entries()]
      .map(([code, s]) => ({
        code,
        name: data.values.find(v => v.code === code)?.name ?? code,
        count: s.count,
        avgViews: Math.round(s.views / s.count),
        avgSaves: Math.round(s.saves / s.count),
        avgFollows: Math.round(s.follows / s.count),
      }))
      .sort((a, b) => b.avgViews - a.avgViews);
  }, [data.results, data.ideas, data.values]);

  return (
    <div>
      {formIdea ? (
        <ResultForm idea={formIdea}
          onDone={() => { setFormIdea(null); void reload(); }} />
      ) : (
        <Card title="投稿結果を登録">
          {postable.length === 0
            ? <p className="text-sm" style={{ color: C.sub }}>採用済みの企画がまだありません。</p>
            : (
              <div className="flex flex-wrap gap-2">
                {postable.map(i => (
                  <Btn key={i.id} small kind="ghost" onClick={() => setFormIdea(i)}>
                    [{i.code}] {i.title}
                  </Btn>
                ))}
              </div>
            )}
        </Card>
      )}

      <Card title={`登録済みの結果 (${data.results.length})`}>
        <p className="text-xs mb-2" style={{ color: C.sub }}>
          ⚠️ プラットフォーム間の再生数の単純比較はしないこと。経過日数を揃え、各PFで取得できる指標の違い
          (Lemon8は保存中心、TikTokは維持率が取れる等)を踏まえて率指標で見る。
        </p>
        {data.results.length === 0
          ? <p className="text-sm" style={{ color: C.sub }}>まだ結果がありません。投稿後に登録してください。</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="text-left text-xs" style={{ color: C.sub }}>
                    <th className="py-1">投稿日</th><th>経過</th><th>企画</th><th>PF</th><th>再生</th><th>保存</th><th>判定</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map(r => {
                    const idea = data.ideas.find(i => i.id === r.idea_id);
                    const open = openResult === r.id;
                    return (
                      <Fragment key={r.id}>
                        <tr className="border-t" style={{ borderColor: C.border, color: C.text }}>
                          <td className="py-1.5">{r.posted_at ?? '—'}</td>
                          <td>{daysSince(r.posted_at)}</td>
                          <td>{idea ? `[${idea.code}] ${idea.title}` : r.actual_title}</td>
                          <td>{r.post_url ? <a href={r.post_url} target="_blank" rel="noopener noreferrer" className="underline">{r.platform}</a> : r.platform}</td>
                          <td>{r.views ?? '—'}</td>
                          <td>{r.saves ?? '—'}</td>
                          <td>{r.success_judgment === 'success' ? '✅' : r.success_judgment === 'fail' ? '✖️' : '—'}</td>
                          <td><button className="text-xs underline" style={{ color: C.sub }}
                            onClick={() => setOpenResult(open ? null : r.id)}>{open ? '閉じる' : '率指標'}</button></td>
                        </tr>
                        {open && (
                          <tr>
                            <td colSpan={8} className="pb-2"><RatesRow r={r} />
                              {r.success_basis && <p className="text-xs mt-1" style={{ color: C.sub }}>判定基準: {r.success_basis}</p>}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
      </Card>

      <Card title="価値ごとの成果集計">
        {valueStats.length === 0
          ? <p className="text-sm" style={{ color: C.sub }}>結果が登録されると、どの価値が数字につながっているかここに集計されます。</p>
          : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs" style={{ color: C.sub }}>
                  <th className="py-1">価値</th><th>投稿数</th><th>平均再生</th><th>平均保存</th><th>平均フォロー</th>
                </tr>
              </thead>
              <tbody>
                {valueStats.map(v => (
                  <tr key={v.code} className="border-t" style={{ borderColor: C.border, color: C.text }}>
                    <td className="py-1.5 font-bold">{v.name}</td>
                    <td>{v.count}</td><td>{v.avgViews}</td><td>{v.avgSaves}</td><td>{v.avgFollows}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </Card>

      <Card title={`勝ちパターン候補 (${data.winPatterns.length})`}>
        <p className="text-xs mb-2" style={{ color: C.sub }}>
          母数が少ないうちは断定しません。段階: 仮説(0回) → 初回成功(1回) → 再現候補(2回) → 勝ちパターン候補(3回以上)。
          集計キーは「視聴者 × 投稿目的 × 価値の組み合わせ × スタイル」で、目的が違う企画は別集計です。
        </p>
        {data.winPatterns.length === 0
          ? <p className="text-sm" style={{ color: C.sub }}>まだありません。結果登録時の成果判定から自動で集計されます。</p>
          : data.winPatterns.map(w => (
            <div key={w.id} className="rounded-lg border p-3 mb-2" style={{ borderColor: C.border }}>
              <div className="flex items-center gap-2 flex-wrap">
                <Tag color={w.success_count >= 3 ? C.green : w.success_count >= 2 ? C.amber : C.sub}>
                  {winStageLabel(w.success_count)}
                </Tag>
                <span className="text-sm font-bold" style={{ color: C.text }}>
                  {w.audience} × {PURPOSE_LABELS[w.purpose_main as keyof typeof PURPOSE_LABELS] ?? w.purpose_main} × [{w.values_combo.join(', ')}] × スタイル{w.style}
                </span>
                <span className="text-xs" style={{ color: C.sub }}>
                  成功{w.success_count}回 / 失敗{w.fail_count}回 / PF: {w.platforms.join(',') || '—'}
                </span>
              </div>
              {w.metric && <p className="text-xs mt-1" style={{ color: C.sub }}>判定指標: {w.metric}</p>}
              <NextHypothesisEditor pattern={w} onSaved={() => void reload()} />
            </div>
          ))}
      </Card>
    </div>
  );
}

function NextHypothesisEditor({ pattern, onSaved }: {
  pattern: { id: string; next_hypothesis: string; reproducibility: string }; onSaved: () => void;
}) {
  const [hyp, setHyp] = useState(pattern.next_hypothesis);
  const [rep, setRep] = useState(pattern.reproducibility);
  const dirty = hyp !== pattern.next_hypothesis || rep !== pattern.reproducibility;
  return (
    <div className="grid md:grid-cols-2 gap-x-3 mt-2">
      <Field label="再現可能性メモ"><TextInput value={rep} onChange={e => setRep(e.target.value)} /></Field>
      <Field label="次に検証する仮説"><TextInput value={hyp} onChange={e => setHyp(e.target.value)} /></Field>
      {dirty && (
        <div>
          <Btn small onClick={async () => {
            await upsertWinPattern({ id: pattern.id, next_hypothesis: hyp, reproducibility: rep });
            onSaved();
          }}>保存</Btn>
        </div>
      )}
    </div>
  );
}
