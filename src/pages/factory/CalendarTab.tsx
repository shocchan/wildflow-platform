// 4週間×週4投稿のカレンダー。採用企画の配置と、目的の偏り/スタイル連続の自動警告。
import { useMemo, useState } from 'react';
import type { FactoryData } from './FactoryPage';
import { updateIdea } from '../../features/factory/api';
import { PURPOSE_LABELS } from '../../features/factory/constants';
import { prodStatus } from '../../features/factory/rules';
import { checkCalendar } from '../../features/factory/rules';
import { C, Card, Notice } from './ui';

const PURPOSE_COLORS: Record<string, string> = {
  awareness: '#2563EB', save: C.green, persona: '#7C3AED', trust: C.amber,
};

export function CalendarTab({ data, reload }: { data: FactoryData; reload: () => Promise<void> }) {
  const adopted = useMemo(() => data.ideas.filter(i => i.status === 'adopted'), [data.ideas]);
  const unscheduled = adopted.filter(i => !i.scheduled_week);
  const warnings = useMemo(() => checkCalendar(adopted), [adopted]);

  // 素材待ち企画の警告: 準備期限が7日以内 or 期限超過の場合に代替候補つきで表示
  // (基準時刻はマウント時に固定: レンダー純度を保つ。再読み込みで更新される)
  const [now] = useState(() => Date.now());
  const materialAlerts = adopted
    .filter(i => prodStatus(i) === 'awaiting_material')
    .map(i => {
      const deadline = i.material_deadline ? new Date(i.material_deadline).getTime() : null;
      const daysLeft = deadline != null ? Math.ceil((deadline - now) / 86400000) : null;
      return { idea: i, daysLeft };
    });

  const assign = async (ideaId: string, week: number, slot: number) => {
    // 同じ枠にいた企画は外す
    const occupied = adopted.find(i => i.scheduled_week === week && i.scheduled_slot === slot);
    if (occupied && occupied.id !== ideaId) {
      await updateIdea(occupied.id, { scheduled_week: null, scheduled_slot: null });
    }
    await updateIdea(ideaId, { scheduled_week: week, scheduled_slot: slot });
    await reload();
  };
  const unassign = async (ideaId: string) => {
    await updateIdea(ideaId, { scheduled_week: null, scheduled_slot: null });
    await reload();
  };

  return (
    <div>
      {warnings.length > 0 && (
        <Notice tone="warn">
          {warnings.map((w, i) => <div key={i}>第{w.week}週: {w.message}</div>)}
        </Notice>
      )}
      {materialAlerts.map(({ idea, daysLeft }) => (
        <Notice key={idea.id} tone={daysLeft != null && daysLeft <= 7 ? 'error' : 'warn'}>
          📦 <b>[{idea.code}] {idea.title}</b> は素材待ちです(W{idea.scheduled_week}-{idea.scheduled_slot}配置)。
          {daysLeft == null && ' 準備期限は未設定(企画ボードの詳細から設定できます)。'}
          {daysLeft != null && daysLeft > 7 && ` 準備期限まで${daysLeft}日。`}
          {daysLeft != null && daysLeft <= 7 && daysLeft >= 0 && ` ⚠️ 準備期限まで残り${daysLeft}日。素材が揃わない場合は代替企画への差し替えを検討してください。`}
          {daysLeft != null && daysLeft < 0 && ` 🚨 準備期限を${-daysLeft}日超過。代替企画への差し替えを検討してください。`}
          {idea.required_materials && <><br />必要素材: {idea.required_materials.slice(0, 80)}…</>}
          {idea.alternative_note && <><br />代替候補: {idea.alternative_note}</>}
        </Notice>
      ))}
      <div className="flex flex-wrap gap-2 mb-4 text-xs">
        {Object.entries(PURPOSE_LABELS).map(([k, v]) => (
          <span key={k} className="px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${PURPOSE_COLORS[k]}18`, color: PURPOSE_COLORS[k] }}>● {v}</span>
        ))}
      </div>

      <div className="overflow-x-auto">
        <div className="grid gap-3 min-w-[720px]" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[1, 2, 3, 4].map(week => (
            <div key={week}>
              <p className="font-bold text-sm mb-2" style={{ color: C.text }}>第{week}週(週4投稿)</p>
              {[1, 2, 3, 4].map(slot => {
                const idea = adopted.find(i => i.scheduled_week === week && i.scheduled_slot === slot);
                return (
                  <div key={slot} className="rounded-lg border bg-white p-2 mb-2 min-h-[76px]"
                    style={{ borderColor: idea ? PURPOSE_COLORS[idea.purpose_main] : C.border }}>
                    <p className="text-xs mb-1" style={{ color: C.sub }}>#{slot}</p>
                    {idea ? (
                      <>
                        <p className="text-xs font-bold leading-tight mb-1" style={{ color: C.text }}>
                          [{idea.code}] {idea.title}
                        </p>
                        <p className="text-xs" style={{ color: PURPOSE_COLORS[idea.purpose_main] }}>
                          {PURPOSE_LABELS[idea.purpose_main]}・スタイル{idea.style}
                        </p>
                        {prodStatus(idea) === 'awaiting_material' && (
                          <p className="text-xs font-bold mt-0.5" style={{ color: C.amber }}
                            title={idea.required_materials}>
                            📦 素材待ち{idea.material_deadline ? `(期限 ${idea.material_deadline})` : ''}
                          </p>
                        )}
                        <button className="text-xs underline mt-1" style={{ color: C.sub }}
                          onClick={() => void unassign(idea.id)}>外す</button>
                      </>
                    ) : (
                      <select className="w-full text-xs rounded border px-1 py-1"
                        style={{ borderColor: C.border, color: C.sub }}
                        value=""
                        onChange={e => { if (e.target.value) void assign(e.target.value, week, slot); }}>
                        <option value="">+ 企画を配置</option>
                        {unscheduled.map(i => (
                          <option key={i.id} value={i.id}>[{i.code}] {i.title}</option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {unscheduled.length > 0 && (
        <Card title={`未配置の採用企画 (${unscheduled.length})`}>
          <ul className="text-sm" style={{ color: C.text }}>
            {unscheduled.map(i => (
              <li key={i.id} className="py-0.5">[{i.code}] {i.title}
                <span className="text-xs ml-2" style={{ color: PURPOSE_COLORS[i.purpose_main] }}>
                  {PURPOSE_LABELS[i.purpose_main]}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
