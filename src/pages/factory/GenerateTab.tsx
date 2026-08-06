// 生成タブ: 初期40案の投入(冪等)と、AIによる追加企画生成(ジョブ管理つき)。
import { useEffect, useState } from 'react';
import type { FactoryData } from './FactoryPage';
import type { GenerationJob } from '../../features/factory/types';
import { fetchJobs, nextIdeaCode, insertIdeas, upsertIdeasSkipExisting } from '../../features/factory/api';
import { generateIdeas, importJobIdeas } from '../../features/factory/generate';
import { buildSeedDrafts, SEED_BATCH_ID, seedCounts } from '../../features/factory/seedIdeas';
import { BATCH_RATIO } from '../../features/factory/constants';
import { Btn, C, Card, Field, Notice, TextInput } from './ui';

// アプリ内AI生成UIのフラグ。CEO決定(2026-07-27)により当面false(休眠)。
// 追加企画はClaude Codeセッションで生成する運用。将来self-serve化するときにtrueへ。
const AI_GENERATION_UI_ENABLED = false;

export function GenerateTab({ data, reload }: { data: FactoryData; reload: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [count, setCount] = useState(8);
  const [quality, setQuality] = useState<'standard' | 'high'>('standard');
  const [pillarFocus, setPillarFocus] = useState('');
  const [note, setNote] = useState('');
  const [jobs, setJobs] = useState<GenerationJob[]>([]);

  const seedIdeasInDb = data.ideas.filter(i => i.batch_id === SEED_BATCH_ID);
  const seedDone = seedIdeasInDb.length > 0;
  const push = (msg: string) => setLog(l => [...l, msg]);

  const loadJobs = async () => {
    try { setJobs(await fetchJobs(10)); } catch { /* テーブル未作成時は無視 */ }
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect -- 初回のジョブ履歴ロード
  useEffect(() => { void loadJobs(); }, []);

  const runSeed = async () => {
    const counts = seedCounts();
    const confirmed = window.confirm(
      `初期40案を投入します。\n\n` +
      `採用 ${counts.adopted ?? 0} / 保留 ${counts.hold ?? 0} / リメイク ${counts.remake ?? 0} / 却下 ${counts.rejected ?? 0}\n` +
      `※ 既に同じ管理番号(WF-xxx)がある場合は上書きせずスキップされます。\n\n実行しますか?`,
    );
    if (!confirmed) return;
    setBusy(true);
    setLog([]);
    try {
      const drafts = buildSeedDrafts(data.materials);
      const inserted = await upsertIdeasSkipExisting(drafts);
      const skipped = drafts.length - inserted;
      push(`✅ 投入完了: 挿入${inserted}件 / スキップ(既存)${skipped}件 (${new Date().toLocaleString('ja-JP')})`);
      if (data.materials.length === 0) {
        push('⚠️ 素材DBが空のため、実体験を使う企画は素材未リンクで投入されました。マイグレーションのseed素材を確認してください。');
      }
      await reload();
    } catch (e) {
      push(`❌ ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const runGenerate = async () => {
    if (busy) return; // 二重クリック防止(サーバ側でも同時実行1件を強制)
    setBusy(true);
    setLog([]);
    try {
      push(`🤖 AI生成を開始(${count}案 / ${quality === 'high' ? '高品質モデル' : '標準モデル'})...`);
      push('⏳ 1〜3分かかります。タブを閉じても結果はジョブに保存され、後から取り込めます。');
      const startCode = await nextIdeaCode().then(c => parseInt(c.replace('WF-', ''), 10));
      const outcome = await generateIdeas(
        {
          brand: data.brand, values: data.values, pillars: data.pillars, audiences: data.audiences,
          materials: data.materials, references: data.references,
          existingIdeas: data.ideas, winPatterns: data.winPatterns,
        },
        { count, quality, pillarFocus: pillarFocus || undefined, note: note || undefined, batchId: `gen-${Date.now()}`, startCode },
      );
      const all = [...outcome.accepted, ...outcome.rejected];
      if (outcome.invalidCount > 0) {
        push(`⚠️ 構造不正で除外: ${outcome.invalidCount}件`);
        outcome.invalidReasons.forEach(r => push(`  └ ${r}`));
      }
      if (all.length === 0) {
        push('⚠️ 保存可能な案がありませんでした。');
      } else {
        await insertIdeas(all);
        push(`✅ ${all.length}案を保存。審査通過(採用候補) ${outcome.accepted.length}件 / 自動除外 ${outcome.rejected.length}件`);
        outcome.rejected.forEach(r => push(`  └ 除外 [${r.code}] ${r.title}: ${r.reject_reason}`));
      }
      push(`💰 モデル: ${outcome.model} / 入力${outcome.usage?.input_tokens ?? '?'}tok / 出力${outcome.usage?.output_tokens ?? '?'}tok / 実測費用 $${outcome.estimatedCostUsd?.toFixed(4) ?? '?'}`);
      if (outcome.costWarning) push(outcome.costWarning);
      if (outcome.truncated) push('⚠️ 出力が上限で途切れた可能性があります。件数を減らして再実行してください。');
      await reload();
      await loadJobs();
    } catch (e) {
      push(`❌ ${e instanceof Error ? e.message : String(e)}`);
      await loadJobs();
    } finally {
      setBusy(false);
    }
  };

  const runImport = async (job: GenerationJob) => {
    setBusy(true);
    try {
      const startCode = await nextIdeaCode().then(c => parseInt(c.replace('WF-', ''), 10));
      const outcome = await importJobIdeas(job, {
        brand: data.brand, values: data.values, pillars: data.pillars, audiences: data.audiences,
        materials: data.materials, references: data.references,
        existingIdeas: data.ideas, winPatterns: data.winPatterns,
      }, startCode);
      const all = [...outcome.accepted, ...outcome.rejected];
      if (all.length > 0) await insertIdeas(all);
      push(`✅ ジョブ ${job.id.slice(0, 8)} から ${all.length}案を取り込みました(採用候補${outcome.accepted.length})`);
      await reload();
      await loadJobs();
    } catch (e) {
      push(`❌ ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const monthCost = jobs
    .filter(j => j.created_at >= new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    .reduce((s, j) => s + (j.estimated_cost_usd ?? 0), 0);

  return (
    <div>
      <Card title="① 初期40案の投入">
        <p className="text-sm mb-2" style={{ color: C.sub }}>
          審査済みの初回バッチ(2026-07-27監査反映)。比率目安: {BATCH_RATIO.map(r => `${r.label}${Math.round(r.ratio * 100)}%`).join(' / ')}。
          管理番号のunique制約により再実行しても二重登録されません(既存はスキップ・上書きなし)。
        </p>
        {seedDone && (
          <Notice>投入済み: {seedIdeasInDb.length}件(初回投入 {new Date(seedIdeasInDb[0]?.created_at).toLocaleString('ja-JP')})</Notice>
        )}
        <Btn disabled={busy} kind={seedDone ? 'ghost' : 'primary'} onClick={() => void runSeed()}>
          {seedDone ? '再実行(既存はスキップされます)' : '初期40案を投入する'}
        </Btn>
      </Card>

      {AI_GENERATION_UI_ENABLED ? (
        <Card title="② AIで追加企画を生成(将来の完全自動化用・現在は休眠中)">
          <Notice>
            <b>運用方針(2026-07-27 CEO決定):</b> 追加企画はClaude Codeセッションで生成する(APIキー不要・追加費用なし)。
            「◯◯の柱で5案作って」と依頼 → 審査済みの形でコード化 → ①と同じ投入ボタンで反映、という流れ。
            下のボタンはAPIキー(<code>ANTHROPIC_API_KEY</code>)を設定するまで動きません。
          </Notice>
          <p className="text-sm mb-3" style={{ color: C.sub }}>
            ブランド・視聴者・<b>本人承認済みの素材のみ</b>・参考投稿・既存企画を文脈として渡し、
            生成後にコード側で検証(構造・危険表現・価値3つ以上・24点ゲート・重複)してから保存します。
            制限: 1時間5回 / 24時間20回 / 同時1件 / 月間費用上限あり。
          </p>
          <div className="grid md:grid-cols-4 gap-3 mb-3">
            <Field label="生成数(1〜10)">
              <TextInput type="number" min={1} max={10} value={count}
                onChange={e => setCount(Math.min(10, Math.max(1, Number(e.target.value) || 1)))} />
            </Field>
            <Field label="モデル">
              <select className="w-full rounded-lg border px-2 py-1.5 text-sm"
                style={{ borderColor: C.border, color: C.text }}
                value={quality} onChange={e => setQuality(e.target.value as 'standard' | 'high')}>
                <option value="standard">標準(claude-sonnet-5 / $3・$15)— 通常の企画生成</option>
                <option value="high">高品質(claude-opus-5 / $5・$25)— 重要企画・再審査用</option>
              </select>
            </Field>
            <Field label="柱の指定(任意)">
              <select className="w-full rounded-lg border px-2 py-1.5 text-sm"
                style={{ borderColor: C.border, color: C.text }}
                value={pillarFocus} onChange={e => setPillarFocus(e.target.value)}>
                <option value="">指定なし(バランス)</option>
                {data.pillars.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="追加指示(任意)">
              <TextInput value={note} onChange={e => setNote(e.target.value)} placeholder="例: 冬向けの企画を中心に" />
            </Field>
          </div>
          <Btn disabled={busy} onClick={() => void runGenerate()}>
            {busy ? '実行中...' : 'AI生成を実行'}
          </Btn>
        </Card>
      ) : (
        <Card title="② 追加企画の作り方(アプリ内AI生成は休眠中)">
          <Notice>
            <b>運用方針(2026-07-27 CEO決定):</b> 追加企画は<b>Claude Codeセッション</b>で生成します(APIキー不要・追加費用なし)。<br />
            依頼例: 「初心者向けの柱で5案作って」→ 審査済みの形でコード化 → ①と同じ投入ボタンで反映。<br />
            アプリ内のAI生成機能はコードとして実装済みですが、当面使用しないためこの画面には表示していません。
          </Notice>
        </Card>
      )}

      {log.length > 0 && (
        <Card title="実行ログ">
          <div className="text-sm whitespace-pre-wrap" style={{ color: C.text }}>
            {log.map((l, i) => <p key={i} className="py-0.5">{l}</p>)}
          </div>
        </Card>
      )}

      <Card title={`生成ジョブ履歴(直近${jobs.length}件 / 今月の実測費用 $${monthCost.toFixed(4)})`}
        right={<Btn small kind="ghost" onClick={() => void loadJobs()}>更新</Btn>}>
        {jobs.length === 0
          ? <p className="text-sm" style={{ color: C.sub }}>まだ生成履歴がありません。</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="text-left text-xs" style={{ color: C.sub }}>
                    <th className="py-1">日時</th><th>状態</th><th>モデル</th><th>入力tok</th><th>出力tok</th><th>費用($)</th><th>取込</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(j => (
                    <tr key={j.id} className="border-t" style={{ borderColor: C.border, color: C.text }}>
                      <td className="py-1.5">{new Date(j.created_at).toLocaleString('ja-JP')}</td>
                      <td style={{ color: j.status === 'failed' ? C.red : j.status === 'completed' ? C.green : C.amber }}>
                        {j.status === 'processing' ? '実行中' : j.status === 'completed' ? '完了' : '失敗'}
                      </td>
                      <td>{j.model || '—'}</td>
                      <td>{j.input_tokens ?? '—'}</td>
                      <td>{j.output_tokens ?? '—'}</td>
                      <td>{j.estimated_cost_usd?.toFixed(4) ?? '—'}</td>
                      <td>
                        {j.status === 'completed' && !j.imported && j.ideas_json
                          ? <Btn small disabled={busy} onClick={() => void runImport(j)}>取り込み</Btn>
                          : j.imported ? '済' : j.error ? <span className="text-xs" style={{ color: C.red }}>{j.error.slice(0, 40)}</span> : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </Card>
    </div>
  );
}
