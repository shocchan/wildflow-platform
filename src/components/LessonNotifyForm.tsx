import { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { track } from '../services/analytics';
import { SITE_CONFIG } from '../config/site';
import { getEntry } from '../utils/entry';
import { useLang } from '../i18n/lang';
import { MESSAGES } from '../i18n/messages';

type State = 'idle' | 'saving' | 'done' | 'error';
type Interest = 'badminton' | 'beginner' | 'any';

/**
 * /lessons の「開催予定なし」を、開催通知の登録フォームに差し替える（2026-09-18 P0-6、09-19 日中対応）。
 *
 * 保存先は既存の quiz_leads（匿名 INSERT 可・SELECT 不可）。新しいテーブルは作らない。
 *   name      : '（開催通知）' の固定目印（CSV でカンマを含まない）
 *   wild_type : '開催通知希望：<興味>'（管理画面のリード一覧でそのまま読める。zh のときは末尾に [zh]）
 *   scores    : {}（列が NOT NULL でも通るように空オブジェクト）
 *   source    : 'lesson_notify'（列が無い環境では PGRST204 を検知して source 抜きで入れ直す）
 */
export function LessonNotifyForm() {
  const lang = useLang();
  const t = MESSAGES[lang].notify;
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
      setErr(MESSAGES[lang].result.emailError);
      return;
    }
    setErr('');
    setState('saving');

    // 管理画面は日本語なので、興味の値は日本語ラベルで保存し、言語は末尾に付ける
    const jaInterest = MESSAGES.ja.notify.interest[interest];
    const base = {
      name: '（開催通知）',
      email: value,
      wild_type: `開催通知希望：${jaInterest}${lang === 'zh' ? ' [zh]' : ''}`,
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
    track('generate_lead', { quiz_type: 'lesson_notify', interest, lang });
    setState('done');
  };

  if (state === 'done') {
    return (
      <div className="text-center py-10 rounded-2xl border mb-6" style={{ borderColor: '#6fcf97', backgroundColor: '#f0faf4' }}>
        <p className="text-3xl mb-2">📩</p>
        <p className="font-bold mb-1" style={{ color: '#1C2A1E' }}>{t.doneTitle}</p>
        <p className="text-sm" style={{ color: '#4A6550' }}>{t.doneBody}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border p-6 mb-6" style={{ borderColor: '#E2E8E4', backgroundColor: '#FFFFFF' }}>
      <img src="/img/shocchan/face.webp" alt="" width={240} height={240} className="mx-auto mb-2" style={{ width: '72px', height: 'auto' }} />
      <h3 className="font-bold text-center mb-1" style={{ color: '#1C2A1E' }}>{t.title}</h3>
      <p className="text-sm text-center mb-5" style={{ color: '#5a7a62' }}>{t.body}</p>
      <form onSubmit={submit} className="max-w-md mx-auto">
        <fieldset className="mb-3">
          <legend className="text-xs font-bold mb-2" style={{ color: '#4A6550' }}>{t.legend}</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(t.interest) as Interest[]).map(k => (
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
                <input type="radio" name="interest" value={k} checked={interest === k} onChange={() => setInterest(k)} className="sr-only" />
                {k === 'badminton' ? '🏸 ' : k === 'beginner' ? '🌱 ' : ''}{t.interest[k]}
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
            aria-label={t.email}
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
            {state === 'saving' ? MESSAGES[lang].result.sending : t.submit}
          </button>
        </div>
        {err && <p className="text-sm mt-2" style={{ color: '#EF4444' }}>{err}</p>}
        {state === 'error' && (
          <p className="text-sm mt-2" style={{ color: '#EF4444' }}>
            {MESSAGES[lang].result.sendFail}{' '}
            <a href={`mailto:${SITE_CONFIG.contactEmail}`} className="underline font-bold">{SITE_CONFIG.contactEmail}</a>
            {' '}{MESSAGES[lang].result.sendFail2}
          </p>
        )}
        <p className="text-xs mt-3 text-center" style={{ color: '#A8D5A2' }}>{t.privacy}</p>
      </form>
      <div className="mt-5 text-center">
        <a href="/lessons/package" className="text-sm underline" style={{ color: '#2D8F4E', minHeight: '44px', padding: '10px 0', display: 'inline-block' }}>
          {t.pack}
        </a>
      </div>
    </div>
  );
}
