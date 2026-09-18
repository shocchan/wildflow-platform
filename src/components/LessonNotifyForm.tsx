import { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { track } from '../services/analytics';
import { SITE_CONFIG } from '../config/site';
import { getEntry } from '../utils/entry';

type State = 'idle' | 'saving' | 'done' | 'error';
type Interest = 'badminton' | 'beginner' | 'any';

const INTEREST_LABEL: Record<Interest, string> = {
  badminton: 'バドミントン向け',
  beginner: 'はじめての方向け',
  any: 'どちらでも',
};

/**
 * /lessons の「開催予定なし」を、開催通知の登録フォームに差し替える（2026-09-18 P0-6）。
 *
 * 保存先は既存の quiz_leads（匿名 INSERT 可・SELECT 不可）。新しいテーブルは作らない。
 *   name      : '（開催通知）' の固定目印（CSV でカンマを含まない）
 *   wild_type : '開催通知希望：<興味>'（管理画面のリード一覧でそのまま読める）
 *   scores    : {}（列が NOT NULL でも通るように空オブジェクト）
 *   source    : 'lesson_notify'（列が無い環境では PGRST204 を検知して source 抜きで入れ直す。10問診断と同じ作法）
 */
export function LessonNotifyForm() {
  const [email, setEmail] = useState('');
  const [interest, setInterest] = useState<Interest>(() => {
    const e = getEntry();
    return e === 'badminton' || e === 'beginner' ? e : 'any';
  });
  const [state, setState] = useState<State>('idle');
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === 'saving') return;
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setErr('正しいメールアドレスを入力してください');
      return;
    }
    setErr('');
    setState('saving');

    const base = {
      name: '（開催通知）',
      email: value,
      wild_type: `開催通知希望：${INTEREST_LABEL[interest]}`,
      scores: {},
    };
    let { error } = await supabase.from('quiz_leads').insert([{ ...base, source: 'lesson_notify' }]);
    if (error?.code === 'PGRST204') {
      ({ error } = await supabase.from('quiz_leads').insert([base]));
    }
    if (error) {
      console.error('[lessons] notify insert failed:', error.message);
      setState('error');
      return;
    }
    track('generate_lead', { quiz_type: 'lesson_notify', interest });
    setState('done');
  };

  if (state === 'done') {
    return (
      <div className="text-center py-10 rounded-2xl border mb-6" style={{ borderColor: '#6fcf97', backgroundColor: '#f0faf4' }}>
        <p className="text-3xl mb-2">📩</p>
        <p className="font-bold mb-1" style={{ color: '#1C2A1E' }}>登録しました</p>
        <p className="text-sm" style={{ color: '#4A6550' }}>
          次の開催が決まったら、このメールアドレスにお知らせします。
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border p-6 mb-6" style={{ borderColor: '#E2E8E4', backgroundColor: '#FFFFFF' }}>
      <img src="/img/shocchan/face.png" alt="" width={240} height={240} className="mx-auto mb-2" style={{ width: '72px', height: 'auto' }} />
      <h3 className="font-bold text-center mb-1" style={{ color: '#1C2A1E' }}>いまは開催予定のレッスンがありません</h3>
      <p className="text-sm text-center mb-5" style={{ color: '#5a7a62' }}>
        次の開催が決まったら、メールでお知らせします。日程が合うときだけ来てください。
      </p>
      <form onSubmit={submit} className="max-w-md mx-auto">
        <fieldset className="mb-3">
          <legend className="text-xs font-bold mb-2" style={{ color: '#4A6550' }}>興味があるのは</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(INTEREST_LABEL) as Interest[]).map(k => (
              <label
                key={k}
                className="text-sm px-3 py-2 rounded-full border cursor-pointer"
                style={{
                  borderColor: interest === k ? '#2D8F4E' : '#E2E8E4',
                  backgroundColor: interest === k ? '#EDF7EE' : 'transparent',
                  color: interest === k ? '#1A6B38' : '#4A6550',
                  minHeight: '40px',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                <input
                  type="radio"
                  name="interest"
                  value={k}
                  checked={interest === k}
                  onChange={() => setInterest(k)}
                  className="sr-only"
                />
                {k === 'badminton' ? '🏸 ' : k === 'beginner' ? '🌱 ' : ''}{INTEREST_LABEL[k]}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="example@email.com"
            autoComplete="email"
            aria-label="メールアドレス"
            className="flex-1 px-4 py-3 rounded-xl border text-sm outline-none"
            style={{ borderColor: '#E2E8E4', color: '#1C2A1E', minHeight: '48px' }}
            onFocus={e => (e.currentTarget.style.borderColor = '#2D8F4E')}
            onBlur={e => (e.currentTarget.style.borderColor = '#E2E8E4')}
          />
          <button
            type="submit"
            disabled={state === 'saving'}
            className="px-6 py-3 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#2D8F4E', minHeight: '48px' }}
          >
            {state === 'saving' ? '送信中…' : '開催を知らせてもらう'}
          </button>
        </div>
        {err && <p className="text-sm mt-2" style={{ color: '#EF4444' }}>{err}</p>}
        {state === 'error' && (
          <p className="text-sm mt-2" style={{ color: '#EF4444' }}>
            送信に失敗しました。時間をおいて試すか{' '}
            <a href={`mailto:${SITE_CONFIG.contactEmail}`} className="underline font-bold">{SITE_CONFIG.contactEmail}</a>
            {' '}までご連絡ください。
          </p>
        )}
        <p className="text-xs mt-3 text-center" style={{ color: '#A8D5A2' }}>
          入力いただいた情報は開催のお知らせにのみ使用します。
        </p>
      </form>
      <div className="mt-5 text-center">
        <a
          href="/lessons/package"
          className="text-sm underline"
          style={{ color: '#2D8F4E', minHeight: '44px', padding: '10px 0', display: 'inline-block' }}
        >
          待たずに始めたい方は、日程の相談つきフルパックへ →
        </a>
      </div>
    </div>
  );
}
