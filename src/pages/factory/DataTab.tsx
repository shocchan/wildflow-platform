// 蓄積データの管理: ブランド情報 / 16価値 / 視聴者タイプ / 一次情報素材 / 参考投稿
import { useState } from 'react';
import type { FactoryData } from './FactoryPage';
import type { Audience, Material, ReferencePost } from '../../features/factory/types';
import {
  deleteMaterial, deleteReferencePost, saveBrand, upsertAudience, upsertMaterial, upsertReferencePost, upsertValue,
} from '../../features/factory/api';
import { MATERIAL_CATEGORIES, PLATFORMS, QUALITY_RULES } from '../../features/factory/constants';
import { Btn, C, Card, Field, fromLines, Notice, Tag, TextArea, TextInput, toLines } from './ui';

type Sub = 'materials' | 'audiences' | 'references' | 'brand';

// ── 素材 ──
const FACT_STATUS_LABELS: Record<string, string> = {
  confirmed: '本人確認済み', site_published: 'サイト公開済み', unverified: '未確認',
};
const USAGE_STATUS_LABELS: Record<string, string> = {
  approved: '使用承認済み', unconfirmed: '承認待ち', prohibited: '使用禁止',
};

function MaterialsSection({ data, reload }: SectionProps) {
  const empty: Partial<Material> = {
    category: MATERIAL_CATEGORIES[0], title: '', body: '', verified: false,
    source_type: 'owner_input', source_reference: '', fact_status: 'unverified',
    wildflow_relevance: '', public_usage_status: 'unconfirmed', approved_by_owner: false,
    prohibited_claims: '', notes: '', tags: [],
  };
  const [edit, setEdit] = useState<Partial<Material> | null>(null);
  const save = async () => {
    if (!edit?.title?.trim()) return;
    await upsertMaterial({
      ...edit,
      verified: edit.fact_status === 'confirmed' || edit.fact_status === 'site_published',
      approved_at: edit.approved_by_owner ? (edit.approved_at ?? new Date().toISOString()) : null,
    });
    setEdit(null);
    await reload();
  };
  return (
    <div>
      <Notice>
        企画に使える一次情報はここに登録されたものだけです。本人が経験していないことは登録しないでください。<br />
        <b>AI生成に渡されるのは「本人承認済み(使用承認済み)」の素材のみ</b>です。承認待ちの素材は自動投入されません。
      </Notice>
      <Btn small onClick={() => setEdit(empty)}>+ 素材を追加</Btn>
      {edit && (
        <Card title={edit.id ? '素材を編集' : '素材を追加'}>
          <div className="grid md:grid-cols-2 gap-x-4">
            <Field label="種類">
              <select className="w-full rounded-lg border px-2 py-1.5 text-sm" style={{ borderColor: C.border }}
                value={edit.category} onChange={e => setEdit({ ...edit, category: e.target.value })}>
                {MATERIAL_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="タイトル">
              <TextInput value={edit.title ?? ''} onChange={e => setEdit({ ...edit, title: e.target.value })} />
            </Field>
          </div>
          <Field label="内容(実際にあったこと・考えたことを具体的に)">
            <TextArea rows={4} value={edit.body ?? ''} onChange={e => setEdit({ ...edit, body: e.target.value })} />
          </Field>
          <div className="grid md:grid-cols-2 gap-x-4">
            <Field label="出典の種類">
              <select className="w-full rounded-lg border px-2 py-1.5 text-sm" style={{ borderColor: C.border }}
                value={edit.source_type} onChange={e => setEdit({ ...edit, source_type: e.target.value as Material['source_type'] })}>
                <option value="owner_input">本人の入力・申告</option>
                <option value="site_copy">サイト掲載コピー</option>
                <option value="interview">ヒアリング</option>
                <option value="other">その他</option>
              </select>
            </Field>
            <Field label="出典の詳細(どのページ・発言から)">
              <TextInput value={edit.source_reference ?? ''} onChange={e => setEdit({ ...edit, source_reference: e.target.value })} />
            </Field>
            <Field label="事実確認状態">
              <select className="w-full rounded-lg border px-2 py-1.5 text-sm" style={{ borderColor: C.border }}
                value={edit.fact_status} onChange={e => setEdit({ ...edit, fact_status: e.target.value as Material['fact_status'] })}>
                {Object.entries(FACT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="SNS使用の承認状態">
              <select className="w-full rounded-lg border px-2 py-1.5 text-sm" style={{ borderColor: C.border }}
                value={edit.public_usage_status}
                onChange={e => {
                  const v = e.target.value as Material['public_usage_status'];
                  setEdit({ ...edit, public_usage_status: v, approved_by_owner: v === 'approved' });
                }}>
                {Object.entries(USAGE_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
          </div>
          <Field label="wild-flowとの関連性">
            <TextInput value={edit.wildflow_relevance ?? ''} onChange={e => setEdit({ ...edit, wildflow_relevance: e.target.value })} />
          </Field>
          <Field label="この素材について語ってはいけないこと(未提供の詳細など)">
            <TextArea value={edit.prohibited_claims ?? ''} onChange={e => setEdit({ ...edit, prohibited_claims: e.target.value })} />
          </Field>
          <Field label="メモ">
            <TextInput value={edit.notes ?? ''} onChange={e => setEdit({ ...edit, notes: e.target.value })} />
          </Field>
          <div className="flex gap-2 mt-2">
            <Btn small onClick={() => void save()}>保存</Btn>
            <Btn small kind="ghost" onClick={() => setEdit(null)}>キャンセル</Btn>
          </div>
        </Card>
      )}
      <div className="mt-3">
        {data.materials.map(m => (
          <div key={m.id} className="rounded-lg border bg-white p-3 mb-2" style={{ borderColor: C.border }}>
            <div className="flex items-center gap-2 flex-wrap">
              <Tag>{m.category}</Tag>
              <Tag color={m.fact_status === 'unverified' ? C.amber : C.green}>
                {FACT_STATUS_LABELS[m.fact_status] ?? m.fact_status}
              </Tag>
              <Tag color={m.public_usage_status === 'approved' ? C.green : m.public_usage_status === 'prohibited' ? C.red : C.amber}>
                {USAGE_STATUS_LABELS[m.public_usage_status] ?? m.public_usage_status}
              </Tag>
              <span className="font-bold text-sm flex-1" style={{ color: C.text }}>{m.title}</span>
              <Btn small kind="ghost" onClick={() => setEdit(m)}>編集</Btn>
              <Btn small kind="danger" onClick={async () => { await deleteMaterial(m.id); await reload(); }}>削除</Btn>
            </div>
            <p className="text-sm mt-1" style={{ color: C.sub }}>{m.body}</p>
            {m.source_reference && <p className="text-xs mt-1" style={{ color: C.sub }}>出典: {m.source_reference}</p>}
            {m.prohibited_claims && <p className="text-xs mt-0.5" style={{ color: C.amber }}>語らないこと: {m.prohibited_claims}</p>}
          </div>
        ))}
        {data.materials.length === 0 && <p className="text-sm mt-2" style={{ color: C.sub }}>素材がありません。</p>}
      </div>
    </div>
  );
}

// ── 視聴者 ──
function AudiencesSection({ data, reload }: SectionProps) {
  const [edit, setEdit] = useState<Partial<Audience> | null>(null);
  const save = async () => {
    if (!edit?.name?.trim() || !edit?.code?.trim()) return;
    await upsertAudience(edit);
    setEdit(null);
    await reload();
  };
  return (
    <div>
      <Btn small onClick={() => setEdit({ code: '', name: '', concerns: [], active: true, sort_order: data.audiences.length + 1 })}>+ 視聴者タイプを追加</Btn>
      {edit && (
        <Card title={edit.id ? '視聴者タイプを編集' : '視聴者タイプを追加'}>
          <div className="grid md:grid-cols-2 gap-x-4">
            <Field label="コード(半角英字)"><TextInput value={edit.code ?? ''} disabled={!!edit.id} onChange={e => setEdit({ ...edit, code: e.target.value })} /></Field>
            <Field label="名称"><TextInput value={edit.name ?? ''} onChange={e => setEdit({ ...edit, name: e.target.value })} /></Field>
          </div>
          <Field label="現在の状態"><TextArea value={edit.current_state ?? ''} onChange={e => setEdit({ ...edit, current_state: e.target.value })} /></Field>
          <Field label="具体的な悩み(1行1つ)"><TextArea rows={4} value={toLines(edit.concerns)} onChange={e => setEdit({ ...edit, concerns: fromLines(e.target.value) })} /></Field>
          <Field label="期待している変化"><TextArea value={edit.desired_change ?? ''} onChange={e => setEdit({ ...edit, desired_change: e.target.value })} /></Field>
          <Field label="抵抗や不安"><TextArea value={edit.resistance ?? ''} onChange={e => setEdit({ ...edit, resistance: e.target.value })} /></Field>
          <Field label="刺さりやすいメッセージ"><TextArea value={edit.messages_that_work ?? ''} onChange={e => setEdit({ ...edit, messages_that_work: e.target.value })} /></Field>
          <Field label="反応した投稿(メモ)"><TextArea value={edit.responded_posts ?? ''} onChange={e => setEdit({ ...edit, responded_posts: e.target.value })} /></Field>
          <Field label="反応しなかった投稿(メモ)"><TextArea value={edit.not_responded_posts ?? ''} onChange={e => setEdit({ ...edit, not_responded_posts: e.target.value })} /></Field>
          <div className="flex gap-2 mt-2">
            <Btn small onClick={() => void save()}>保存</Btn>
            <Btn small kind="ghost" onClick={() => setEdit(null)}>キャンセル</Btn>
          </div>
        </Card>
      )}
      <div className="mt-3">
        {data.audiences.map(a => (
          <div key={a.id} className="rounded-lg border bg-white p-3 mb-2" style={{ borderColor: C.border }}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono" style={{ color: C.sub }}>{a.code}</span>
              <span className="font-bold text-sm flex-1" style={{ color: C.text }}>{a.name}</span>
              <Btn small kind="ghost" onClick={() => setEdit(a)}>編集</Btn>
            </div>
            <p className="text-xs mt-1" style={{ color: C.sub }}>悩み: {a.concerns.join(' / ')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 参考投稿 ──
function ReferencesSection({ data, reload }: SectionProps) {
  const [edit, setEdit] = useState<Partial<ReferencePost> | null>(null);
  const save = async () => {
    if (!edit?.url?.trim()) return;
    await upsertReferencePost(edit);
    setEdit(null);
    await reload();
  };
  const num = (v: string) => (v === '' ? null : Number(v));
  return (
    <div>
      <Notice>
        単純に再生数が高い投稿を正解にしないこと。アカウント規模・投稿日・トレンド・保存性・コメント内容まで見て
        「再現可能な要素」と「その投稿者固有の要素」を分けて記録します。
      </Notice>
      <Btn small onClick={() => setEdit({ platform: PLATFORMS[0], values_used: [] })}>+ 参考投稿を登録</Btn>
      {edit && (
        <Card title="参考投稿を登録">
          <div className="grid md:grid-cols-2 gap-x-4">
            <Field label="URL"><TextInput value={edit.url ?? ''} onChange={e => setEdit({ ...edit, url: e.target.value })} /></Field>
            <Field label="プラットフォーム">
              <select className="w-full rounded-lg border px-2 py-1.5 text-sm" style={{ borderColor: C.border }}
                value={edit.platform} onChange={e => setEdit({ ...edit, platform: e.target.value })}>
                {PLATFORMS.map(p => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="投稿者"><TextInput value={edit.author ?? ''} onChange={e => setEdit({ ...edit, author: e.target.value })} /></Field>
            <Field label="投稿日"><TextInput type="date" value={edit.posted_at ?? ''} onChange={e => setEdit({ ...edit, posted_at: e.target.value || null })} /></Field>
            <Field label="タイトル"><TextInput value={edit.title ?? ''} onChange={e => setEdit({ ...edit, title: e.target.value })} /></Field>
            <Field label="冒頭1〜3秒"><TextInput value={edit.hook ?? ''} onChange={e => setEdit({ ...edit, hook: e.target.value })} /></Field>
            <Field label="動画時間(秒)"><TextInput type="number" value={edit.duration_sec ?? ''} onChange={e => setEdit({ ...edit, duration_sec: num(e.target.value) })} /></Field>
            <Field label="投稿者のフォロワー数"><TextInput type="number" value={edit.follower_count ?? ''} onChange={e => setEdit({ ...edit, follower_count: num(e.target.value) })} /></Field>
            <Field label="再生数"><TextInput type="number" value={edit.views ?? ''} onChange={e => setEdit({ ...edit, views: num(e.target.value) })} /></Field>
            <Field label="いいね"><TextInput type="number" value={edit.likes ?? ''} onChange={e => setEdit({ ...edit, likes: num(e.target.value) })} /></Field>
            <Field label="保存"><TextInput type="number" value={edit.saves ?? ''} onChange={e => setEdit({ ...edit, saves: num(e.target.value) })} /></Field>
            <Field label="コメント"><TextInput type="number" value={edit.comments ?? ''} onChange={e => setEdit({ ...edit, comments: num(e.target.value) })} /></Field>
            <Field label="シェア"><TextInput type="number" value={edit.shares ?? ''} onChange={e => setEdit({ ...edit, shares: num(e.target.value) })} /></Field>
            <Field label="扱っているテーマ"><TextInput value={edit.theme ?? ''} onChange={e => setEdit({ ...edit, theme: e.target.value })} /></Field>
            <Field label="対象視聴者"><TextInput value={edit.target_audience ?? ''} onChange={e => setEdit({ ...edit, target_audience: e.target.value })} /></Field>
          </div>
          <Field label="使用されている価値">
            <div className="flex flex-wrap gap-1">
              {data.values.map(v => {
                const on = edit.values_used?.includes(v.code);
                return (
                  <button key={v.code} type="button"
                    className="text-xs px-2 py-1 rounded-full border"
                    style={on ? { backgroundColor: C.green, color: '#fff', borderColor: C.green } : { borderColor: C.border, color: C.sub }}
                    onClick={() => setEdit({
                      ...edit,
                      values_used: on ? edit.values_used!.filter(x => x !== v.code) : [...(edit.values_used ?? []), v.code],
                    })}>
                    {v.name}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="価値が表現されている箇所"><TextArea value={edit.value_locations ?? ''} onChange={e => setEdit({ ...edit, value_locations: e.target.value })} /></Field>
          <Field label="選ばれたと考えられる理由"><TextArea value={edit.why_chosen ?? ''} onChange={e => setEdit({ ...edit, why_chosen: e.target.value })} /></Field>
          <Field label="再現可能な要素"><TextArea value={edit.reproducible ?? ''} onChange={e => setEdit({ ...edit, reproducible: e.target.value })} /></Field>
          <Field label="その投稿者固有で再現しにくい要素"><TextArea value={edit.not_reproducible ?? ''} onChange={e => setEdit({ ...edit, not_reproducible: e.target.value })} /></Field>
          <Field label="wild-flowに応用する場合の注意点"><TextArea value={edit.application_notes ?? ''} onChange={e => setEdit({ ...edit, application_notes: e.target.value })} /></Field>
          <div className="flex gap-2 mt-2">
            <Btn small onClick={() => void save()}>保存</Btn>
            <Btn small kind="ghost" onClick={() => setEdit(null)}>キャンセル</Btn>
          </div>
        </Card>
      )}
      <div className="mt-3">
        {data.references.map(r => (
          <div key={r.id} className="rounded-lg border bg-white p-3 mb-2" style={{ borderColor: C.border }}>
            <div className="flex items-center gap-2">
              <Tag>{r.platform}</Tag>
              <span className="font-bold text-sm flex-1" style={{ color: C.text }}>{r.title || r.url}</span>
              <span className="text-xs" style={{ color: C.sub }}>
                再生{r.views ?? '—'} / F{r.follower_count ?? '—'}
              </span>
              <Btn small kind="ghost" onClick={() => setEdit(r)}>編集</Btn>
              <Btn small kind="danger" onClick={async () => { await deleteReferencePost(r.id); await reload(); }}>削除</Btn>
            </div>
            {r.reproducible && <p className="text-xs mt-1" style={{ color: C.sub }}>再現可能: {r.reproducible}</p>}
          </div>
        ))}
        {data.references.length === 0 && <p className="text-sm mt-2" style={{ color: C.sub }}>参考投稿がまだありません。</p>}
      </div>
    </div>
  );
}

// ── ブランド+価値 ──
function BrandSection({ data, reload }: SectionProps) {
  const [core, setCore] = useState(data.brand?.core_message ?? '');
  const [sub, setSub] = useState(data.brand?.sub_message ?? '');
  const [world, setWorld] = useState(toLines(data.brand?.worldview));
  const [notes, setNotes] = useState(data.brand?.notes ?? '');
  const [valueEdit, setValueEdit] = useState<{ id?: string; code: string; name: string; description: string } | null>(null);
  return (
    <div>
      <Card title="ブランド情報">
        <Field label="中心メッセージ"><TextArea value={core} onChange={e => setCore(e.target.value)} /></Field>
        <Field label="補助メッセージ"><TextArea value={sub} onChange={e => setSub(e.target.value)} /></Field>
        <Field label="世界観(1行1つ)"><TextArea rows={5} value={world} onChange={e => setWorld(e.target.value)} /></Field>
        <Field label="メモ"><TextArea value={notes} onChange={e => setNotes(e.target.value)} /></Field>
        <Btn small onClick={async () => {
          await saveBrand({ id: data.brand?.id, core_message: core, sub_message: sub, worldview: fromLines(world), notes });
          await reload();
        }}>ブランド情報を保存</Btn>
      </Card>

      <Card title={`価値マップ(${data.values.length}種)`}
        right={<Btn small kind="ghost" onClick={() => setValueEdit({ code: '', name: '', description: '' })}>+ 価値を追加</Btn>}>
        {valueEdit && (
          <div className="rounded-lg border p-3 mb-3" style={{ borderColor: C.border }}>
            <div className="grid md:grid-cols-3 gap-x-3">
              <Field label="コード"><TextInput value={valueEdit.code} disabled={!!valueEdit.id} onChange={e => setValueEdit({ ...valueEdit, code: e.target.value })} /></Field>
              <Field label="名称"><TextInput value={valueEdit.name} onChange={e => setValueEdit({ ...valueEdit, name: e.target.value })} /></Field>
              <Field label="説明"><TextInput value={valueEdit.description} onChange={e => setValueEdit({ ...valueEdit, description: e.target.value })} /></Field>
            </div>
            <div className="flex gap-2">
              <Btn small onClick={async () => {
                if (!valueEdit.code.trim() || !valueEdit.name.trim()) return;
                await upsertValue({ ...valueEdit, sort_order: data.values.length + 1 });
                setValueEdit(null);
                await reload();
              }}>保存</Btn>
              <Btn small kind="ghost" onClick={() => setValueEdit(null)}>キャンセル</Btn>
            </div>
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-2">
          {data.values.map(v => (
            <div key={v.id} className="text-sm flex items-start gap-2">
              <span className="font-bold whitespace-nowrap" style={{ color: C.green }}>{v.sort_order}. {v.name}</span>
              <span style={{ color: C.sub }}>{v.description}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="品質・安全ルール(生成AIにも常時適用)">
        <ul className="text-sm list-disc pl-5" style={{ color: C.sub }}>
          {QUALITY_RULES.map(r => <li key={r} className="py-0.5">{r}</li>)}
        </ul>
      </Card>
    </div>
  );
}

interface SectionProps { data: FactoryData; reload: () => Promise<void> }

export function DataTab({ data, reload }: SectionProps) {
  const [sub, setSub] = useState<Sub>('materials');
  const subs: { id: Sub; label: string }[] = [
    { id: 'materials', label: `一次情報素材 (${data.materials.length})` },
    { id: 'audiences', label: `視聴者タイプ (${data.audiences.length})` },
    { id: 'references', label: `参考投稿 (${data.references.length})` },
    { id: 'brand', label: 'ブランド・価値' },
  ];
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {subs.map(s => (
          <Btn key={s.id} small kind={sub === s.id ? 'primary' : 'ghost'} onClick={() => setSub(s.id)}>{s.label}</Btn>
        ))}
      </div>
      {sub === 'materials' && <MaterialsSection data={data} reload={reload} />}
      {sub === 'audiences' && <AudiencesSection data={data} reload={reload} />}
      {sub === 'references' && <ReferencesSection data={data} reload={reload} />}
      {sub === 'brand' && <BrandSection data={data} reload={reload} />}
    </div>
  );
}
