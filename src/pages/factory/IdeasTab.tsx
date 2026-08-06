// 企画ボード: 採用候補/採用/保留/リメイク/却下の一覧と、撮影・語りの設計図の閲覧・編集
import { useMemo, useState } from 'react';
import type { FactoryData } from './FactoryPage';
import type { Idea, IdeaScores, IdeaStatus, ProductionStatus } from '../../features/factory/types';
import { updateIdea } from '../../features/factory/api';
import { PRODUCTION_STATUS_LABELS, PURPOSE_LABELS, SCORE_ITEMS, STATUS_LABELS, STYLE_LABELS } from '../../features/factory/constants';
import { computeTotal, gateIdea, prodStatus } from '../../features/factory/rules';
import { Btn, C, Card, Notice, Tag } from './ui';

const STATUS_ORDER: IdeaStatus[] = ['adopted', 'candidate', 'hold', 'remake', 'rejected', 'posted'];
const STATUS_COLORS: Record<IdeaStatus, string> = {
  adopted: C.green, candidate: '#2563EB', hold: C.amber, remake: '#7C3AED', rejected: C.red, posted: C.sub,
};

const PROD_COLORS: Record<string, string> = {
  not_started: C.sub, awaiting_material: C.amber, preparing: '#2563EB', shot: '#7C3AED',
  editing: '#7C3AED', ready: C.green, posted: C.sub, unpublished: C.red,
};

function ScoreEditor({ idea, onSaved }: { idea: Idea; onSaved: () => void }) {
  const [scores, setScores] = useState<Partial<IdeaScores>>(idea.scores);
  const [saving, setSaving] = useState(false);
  const total = computeTotal(scores);
  const gate = gateIdea({ ...idea, scores });
  return (
    <Card title={`審査(合計 ${total}/24点)`}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        {SCORE_ITEMS.map(item => (
          <label key={item.key} className="text-xs" style={{ color: C.sub }}>
            {item.label}
            <select
              value={scores[item.key as keyof IdeaScores] ?? 0}
              onChange={e => setScores(s => ({ ...s, [item.key]: Number(e.target.value) }))}
              className="w-full rounded border px-1 py-1 mt-0.5" style={{ borderColor: C.border, color: C.text }}>
              {[0, 1, 2, 3].map(n => <option key={n} value={n}>{n}点</option>)}
            </select>
          </label>
        ))}
      </div>
      {!gate.pass && <Notice tone="warn">採用条件未達: {gate.problems.join(' / ')}</Notice>}
      <Btn small disabled={saving} onClick={async () => {
        setSaving(true);
        await updateIdea(idea.id, { scores, score_total: total });
        setSaving(false);
        onSaved();
      }}>採点を保存</Btn>
    </Card>
  );
}

function ProductionEditor({ idea, onSaved }: { idea: Idea; onSaved: () => void }) {
  const [prod, setProd] = useState<ProductionStatus>(prodStatus(idea));
  const [materials, setMaterials] = useState(idea.required_materials ?? '');
  const [deadline, setDeadline] = useState(idea.material_deadline ?? '');
  const [alt, setAlt] = useState(idea.alternative_note ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  return (
    <Card title="制作進捗(企画の審査状態とは別管理)">
      <div className="grid md:grid-cols-3 gap-3 mb-2">
        <label className="text-xs" style={{ color: C.sub }}>
          進捗
          <select value={prod} onChange={e => setProd(e.target.value as ProductionStatus)}
            className="w-full rounded border px-2 py-1.5 mt-0.5 text-sm" style={{ borderColor: C.border, color: C.text }}>
            {Object.entries(PRODUCTION_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className="text-xs" style={{ color: C.sub }}>
          撮影可能予定日 / 準備期限
          <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
            className="w-full rounded border px-2 py-1.5 mt-0.5 text-sm" style={{ borderColor: C.border, color: C.text }} />
        </label>
        <label className="text-xs" style={{ color: C.sub }}>
          代替企画候補(期限に間に合わない場合)
          <input value={alt} onChange={e => setAlt(e.target.value)}
            className="w-full rounded border px-2 py-1.5 mt-0.5 text-sm" style={{ borderColor: C.border, color: C.text }} />
        </label>
      </div>
      <label className="text-xs block mb-2" style={{ color: C.sub }}>
        必要素材の要約(素材待ちの場合)
        <textarea rows={2} value={materials} onChange={e => setMaterials(e.target.value)}
          className="w-full rounded border px-2 py-1.5 mt-0.5 text-sm" style={{ borderColor: C.border, color: C.text }} />
      </label>
      {err && <Notice tone="error">{err}</Notice>}
      <Btn small disabled={saving} onClick={async () => {
        setSaving(true);
        setErr('');
        try {
          await updateIdea(idea.id, {
            production_status: prod,
            required_materials: materials,
            material_deadline: deadline || null,
            alternative_note: alt,
          });
          onSaved();
        } catch (e) {
          setErr(`保存失敗: ${e instanceof Error ? e.message : String(e)}(DBに制作進捗の列が未追加の場合は 20260727c のSQLを実行してください)`);
        } finally {
          setSaving(false);
        }
      }}>進捗を保存</Btn>
    </Card>
  );
}

function Blueprint({ idea, data }: { idea: Idea; data: FactoryData }) {
  const valueName = (code: string) => data.values.find(v => v.code === code)?.name ?? code;
  const audienceName = data.audiences.find(a => a.code === idea.audience)?.name ?? idea.audience;
  const pillarName = data.pillars.find(p => p.code === idea.pillar_main)?.name ?? idea.pillar_main;
  const materials = idea.material_ids
    .map(id => data.materials.find(m => m.id === id)?.title)
    .filter(Boolean);
  const utmCode = idea.code.replace('WF-', 'wf').toLowerCase().replace('wf-', 'wf');
  const utmLink = (source: string) =>
    `https://wild-flow.com/?utm_source=${source}&utm_medium=social&utm_campaign=wildflow_launch&utm_content=${utmCode}`;
  const rows: [string, React.ReactNode][] = [
    ['発信スタイル', `${idea.style}: ${STYLE_LABELS[idea.style]}`],
    ['主目的 / 副次目的', `${PURPOSE_LABELS[idea.purpose_main]}${idea.purpose_sub ? ` / ${idea.purpose_sub}` : ''}`],
    ['主コンテンツ柱', pillarName],
    ['想定視聴者', audienceName],
    ['視聴者の悩み', idea.concern],
    ['この企画を見る理由', idea.reason_to_watch],
    ['最も伝えたいメッセージ', idea.core_message],
    ['持ち帰ってほしい一文', idea.takeaway],
    ['冒頭1〜3秒(映像)', idea.hook_visual],
    ['最初に話す一言', idea.hook_line],
    ['見せる動き', idea.moves.join(' / ')],
    ['撮影する角度', idea.camera_angles],
    ['必要な比較映像', idea.comparison_footage || 'なし'],
    ['大まかな構成', idea.structure],
    ['話すポイント', idea.talking_points.map((p, i) => `${i + 1}. ${p}`).join('　')],
    ['使用する実体験', materials.length ? materials.join(' / ') : (idea.needs_material ? '⚠️ 一次情報の追加が必要' : 'なし')],
    ['誤解されたくない部分', idea.avoid_misunderstanding],
    ['安全面の注意', idea.safety_notes],
    ['最後に残す問い', idea.closing_question],
    ['自然な締め方', idea.closing_style],
    ['コメントを促す質問', idea.comment_prompt],
    ['検索キーワード', idea.keywords.join(', ')],
    ['レッスン導線', idea.lesson_cta ? `あり: ${idea.lesson_cta_phrase}` : 'なし'],
    ['想定尺 / 撮影難易度 / 編集難易度', `${idea.duration_sec}秒 / ★${idea.shoot_difficulty} / ★${idea.edit_difficulty}`],
    ['重視する評価指標', idea.primary_metric],
    ['別形式への展開', idea.repurpose || '—'],
    ['リメイク・メモ', idea.remake_note || '—'],
    ['投稿用UTMリンク(プロフィール/キャプション用。同じ動画はutm_content共通でPF比較する)', (
      <div className="text-xs space-y-1">
        {[['TikTok', 'tiktok'], ['Lemon8', 'lemon8'], ['YouTubeショート', 'youtube']].map(([label, source]) => (
          <div key={source} className="flex items-center gap-2">
            <span className="font-bold w-28 shrink-0">{label}</span>
            <code className="break-all select-all">{utmLink(source)}</code>
          </div>
        ))}
      </div>
    )],
  ];
  return (
    <div>
      {prodStatus(idea) === 'awaiting_material' && (
        <Notice tone="warn">
          📦 <b>素材待ち</b>: {idea.required_materials || '必要素材が未記入です'}
          {idea.material_deadline && <><br />準備期限: {idea.material_deadline}</>}
          {idea.alternative_note && <><br />代替候補: {idea.alternative_note}</>}
        </Notice>
      )}
      {idea.needs_material && prodStatus(idea) !== 'awaiting_material' && (
        <Notice tone="warn">⚠️ 一次情報の追加が必要です。素材タブで該当する実体験を登録してから撮影してください。</Notice>
      )}
      <div className="mb-2">
        {idea.values_used.map(v => <Tag key={v}>{valueName(v)}</Tag>)}
        <span className="text-xs ml-2" style={{ color: C.sub }}>価値 {idea.values_used.length}つ</span>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-b align-top" style={{ borderColor: C.border }}>
              <td className="py-1.5 pr-3 font-bold whitespace-nowrap text-xs" style={{ color: C.sub, width: '11em' }}>{label}</td>
              <td className="py-1.5" style={{ color: C.text }}>{value || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function IdeasTab({ data, reload }: { data: FactoryData; reload: () => Promise<void> }) {
  const [filter, setFilter] = useState<IdeaStatus | 'all'>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const ideas = useMemo(() => {
    const list = filter === 'all' ? data.ideas : data.ideas.filter(i => i.status === filter);
    return [...list].sort((a, b) =>
      STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || a.code.localeCompare(b.code));
  }, [data.ideas, filter]);

  const counts = useMemo(() => {
    const m = new Map<IdeaStatus, number>();
    data.ideas.forEach(i => m.set(i.status, (m.get(i.status) ?? 0) + 1));
    return m;
  }, [data.ideas]);

  const setStatus = async (idea: Idea, status: IdeaStatus) => {
    await updateIdea(idea.id, { status, ...(status !== 'adopted' ? { scheduled_week: null, scheduled_slot: null } : {}) });
    await reload();
  };

  if (data.ideas.length === 0) {
    return <Notice>企画がまだありません。「⚙️ 生成」タブから初期40案を投入するか、AI生成を実行してください。</Notice>;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <Btn small kind={filter === 'all' ? 'primary' : 'ghost'} onClick={() => setFilter('all')}>
          すべて ({data.ideas.length})
        </Btn>
        {STATUS_ORDER.map(s => (
          <Btn key={s} small kind={filter === s ? 'primary' : 'ghost'} onClick={() => setFilter(s)}>
            {STATUS_LABELS[s]} ({counts.get(s) ?? 0})
          </Btn>
        ))}
      </div>

      {ideas.map(idea => {
        const open = openId === idea.id;
        return (
          <div key={idea.id} className="rounded-xl border bg-white mb-2" style={{ borderColor: C.border }}>
            <button className="w-full text-left px-4 py-3 flex items-center gap-3"
              onClick={() => setOpenId(open ? null : idea.id)}>
              <span className="text-xs font-mono" style={{ color: C.sub }}>{idea.code}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${STATUS_COLORS[idea.status]}18`, color: STATUS_COLORS[idea.status] }}>
                {STATUS_LABELS[idea.status]}
              </span>
              {idea.status === 'adopted' && (
                <span className="text-xs px-2 py-0.5 rounded-full border"
                  style={{ borderColor: PROD_COLORS[prodStatus(idea)], color: PROD_COLORS[prodStatus(idea)] }}>
                  {prodStatus(idea) === 'awaiting_material' ? '📦 ' : ''}{PRODUCTION_STATUS_LABELS[prodStatus(idea)]}
                </span>
              )}
              <span className="font-bold flex-1" style={{ color: C.text }}>{idea.title}</span>
              {idea.needs_material && <span title="一次情報の追加が必要">⚠️</span>}
              {idea.scheduled_week && (
                <span className="text-xs" style={{ color: C.green }}>W{idea.scheduled_week}-{idea.scheduled_slot}</span>
              )}
              <span className="text-xs font-bold" style={{ color: idea.score_total >= 17 ? C.green : C.sub }}>
                {idea.score_total}点
              </span>
            </button>
            {open && (
              <div className="px-4 pb-4">
                {idea.reject_reason && (
                  <Notice tone={idea.status === 'rejected' ? 'error' : 'warn'}>{idea.reject_reason}</Notice>
                )}
                <Blueprint idea={idea} data={data} />
                <div className="mt-3">
                  <ProductionEditor idea={idea} onSaved={() => void reload()} />
                  <ScoreEditor idea={idea} onSaved={() => void reload()} />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(['adopted', 'candidate', 'hold', 'remake', 'rejected', 'posted'] as IdeaStatus[])
                    .filter(s => s !== idea.status)
                    .map(s => (
                      <Btn key={s} small kind={s === 'rejected' ? 'danger' : 'ghost'}
                        onClick={() => void setStatus(idea, s)}>
                        → {STATUS_LABELS[s]}
                      </Btn>
                    ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
