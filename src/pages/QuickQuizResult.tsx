import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { QuickResult } from '../utils/calcQuickType';
import { ABILITY_LABELS, ABILITY_TO_ANIMALS, ABILITY_LESSON } from '../utils/calcQuickType';
import { track } from '../services/analytics';
import { supabase } from '../services/supabaseClient';
import { SITE_CONFIG } from '../config/site';
import { KawabadoInvite } from '../components/KawabadoInvite';

const ABILITY_ORDER = ['strength', 'endurance', 'speed', 'flexibility', 'coordination'] as const;

const SITE_URL = SITE_CONFIG.siteUrl;

function AbilityBar({ label, score, isLow }: { label: string; score: number; isLow: boolean }) {
  const color = isLow ? '#F59E0B' : '#2D8F4E';
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span style={{ color }}>
          {label}
          {isLow && <span className="ml-1 text-sm">▲ 伸びしろ</span>}
        </span>
        <span style={{ color }}>{score}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E2E8E4' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

type LeadState = 'idle' | 'saving' | 'done' | 'error';

export function QuickQuizResult() {
  useEffect(() => { track('complete_wild_type_diagnosis', { quiz_type: 'quick' }); }, []);
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result as QuickResult | undefined;
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [leadState, setLeadState] = useState<LeadState>('idle');
  const [leadError, setLeadError] = useState('');

  if (!result) {
    navigate('/quiz/quick');
    return null;
  }

  const { lowestAbility, secondLowest, scores } = result;
  const lowestLabel = ABILITY_LABELS[lowestAbility];
  const animals = ABILITY_TO_ANIMALS[lowestAbility];
  const lesson = ABILITY_LESSON[lowestAbility];

  /**
   * 結果を見せた「あと」の任意メール登録。
   * ⚠️ 結果表示をメールでゲートしない（先に結果を見せる）。ここは完全に任意。
   * 保存先は60問診断と同じ quiz_leads。source='quick' で取得元を区別する。
   */
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (leadState === 'saving') return;
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setLeadError('正しいメールアドレスを入力してください');
      return;
    }
    setLeadError('');
    setLeadState('saving');

    // 10問診断は名前を取らない。name はNOT NULL想定なので固定の目印を入れる
    // （CSV出力でカンマを含まない文字列にすること）
    const base = {
      name: '（10問診断）',
      email: value,
      wild_type: `10問診断：${lowestLabel}が伸びしろ`,
      scores,
    };

    let { error } = await supabase.from('quiz_leads').insert([{ ...base, source: 'quick' }]);
    // source 列を足すマイグレーション（20260824_quiz_leads_source.sql）が未適用でも
    // 取りこぼさないよう、列が無い場合は source 抜きで入れ直す
    if (error?.code === 'PGRST204') {
      ({ error } = await supabase.from('quiz_leads').insert([base]));
    }

    if (error) {
      console.error('[quick-quiz] quiz_leads insert failed:', error.message);
      setLeadState('error');
      return;
    }
    track('generate_lead', { quiz_type: 'quick' });
    setLeadState('done');
  };

  const shareTextX = `私は${lowestLabel}が伸びしろの身体タイプでした！🐾\nあなたの野生タイプは何型？ #wildflow #身体のMBTI\n${SITE_URL}/quiz/quick`;
  const shareTextLine = `私は${lowestLabel}が伸びしろの身体タイプでした！あなたは？wildflowで診断してみて👇 ${SITE_URL}/quiz/quick`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${SITE_URL}/quiz/quick`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="max-w-2xl md:max-w-4xl mx-auto px-4 md:px-8 lg:px-12 py-12">
      <div className="text-center mb-8">
        <p className="text-sm font-medium mb-1" style={{ color: '#1A6B38' }}>簡易診断 結果</p>
        <h1 className="font-black mb-2" style={{ color: '#1C2A1E', fontSize: '36px', lineHeight: '1.3' }}>
          あなたが最も伸ばせるアビリティは
        </h1>
        <div
          className="inline-block px-6 py-3 rounded-2xl mt-2"
          style={{ backgroundColor: '#FEF3C7', border: '2px solid #F59E0B' }}
        >
          <p className="text-2xl font-black" style={{ color: '#D97706' }}>
            🌱 {lowestLabel}
          </p>
        </div>
      </div>

      {/* スコアグラフ */}
      <div
        className="p-6 rounded-2xl border mb-6"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8E4' }}
      >
        <p className="text-sm font-bold mb-4" style={{ color: '#4A6550' }}>── 5軸アビリティスコア ──</p>
        {ABILITY_ORDER.map(ab => (
          <AbilityBar
            key={ab}
            label={ABILITY_LABELS[ab]}
            score={scores[ab]}
            isLow={ab === lowestAbility || ab === secondLowest}
          />
        ))}
      </div>

      {/* 該当動物タイプ */}
      <div
        className="p-6 rounded-2xl border mb-6"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8E4' }}
      >
        <h2 className="text-lg font-bold mb-3" style={{ color: '#1C2A1E' }}>
          このアビリティが伸びしろの動物タイプ
        </h2>
        <p className="text-sm mb-3" style={{ color: '#4A6550' }}>
          「{lowestLabel}」が伸びしろの動物タイプはこれら：
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {animals.map(animal => (
            <span
              key={animal}
              className="px-3 py-1.5 rounded-full text-sm font-bold"
              style={{ backgroundColor: '#EDF7EE', color: '#2D8F4E', border: '1px solid #2D8F4E' }}
            >
              {animal}
            </span>
          ))}
        </div>
        <p className="text-xs" style={{ color: '#4A6550' }}>
          あなたがどのタイプに当てはまるかは、詳細診断（60問）で判定できます。
        </p>
      </div>

      {/* おすすめレッスン */}
      <div
        className="p-5 rounded-2xl mb-6"
        style={{ backgroundColor: '#EDF7EE', borderLeft: '4px solid #2D8F4E' }}
      >
        <h2 className="text-base font-bold mb-1" style={{ color: '#1A6B38' }}>🎯 おすすめレッスン</h2>
        <p className="text-sm font-bold" style={{ color: '#1C2A1E' }}>{lesson}</p>
        <a
          href="/lessons"
          className="inline-flex items-center gap-1 mt-3 text-sm font-bold transition-opacity hover:opacity-70"
          style={{ color: '#2D8F4E', minHeight: '44px' }}
        >
          レッスン詳細を見る →
        </a>
        {lowestAbility === 'flexibility' && (
          <p className="mt-3 text-sm" style={{ color: '#4A6550' }}>
            🌿{' '}
            <a
              href="/recovery"
              className="font-bold underline transition-opacity hover:opacity-70"
              style={{ color: '#2D8F4E' }}
            >
              /recovery のヨガ教室
            </a>
            もチェックしてみてください。
          </p>
        )}
      </div>

      {/* 結果保存（任意のメール登録）— 結果を見せたあとに置く。ゲートしない */}
      <div
        className="p-6 rounded-2xl border mb-6"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8E4' }}
      >
        {leadState === 'done' ? (
          <div className="text-center">
            <p className="text-3xl mb-2">📩</p>
            <p className="font-bold mb-1" style={{ color: '#1C2A1E' }}>登録しました！</p>
            <p className="text-sm" style={{ color: '#4A6550' }}>
              「{lowestLabel}」を伸ばすトレーニングの解説をお送りします。
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-base font-bold mb-1" style={{ color: '#1C2A1E' }}>
              📩 この結果を保存する（任意）
            </h2>
            <p className="text-sm mb-4" style={{ color: '#4A6550' }}>
              メールアドレスを入れておくと、「{lowestLabel}」を伸ばすトレーニングの
              詳しい解説と、新しいレッスンのお知らせが届きます。入力しなくても結果はこのまま見られます。
            </p>
            <form onSubmit={handleLeadSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@email.com"
                autoComplete="email"
                className="flex-1 px-4 py-3 rounded-xl border text-sm outline-none transition-colors"
                style={{ borderColor: '#E2E8E4', color: '#1C2A1E', minHeight: '48px' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#2D8F4E')}
                onBlur={e => (e.currentTarget.style.borderColor = '#E2E8E4')}
              />
              <button
                type="submit"
                disabled={leadState === 'saving'}
                className="px-6 py-3 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#2D8F4E', minHeight: '48px' }}
              >
                {leadState === 'saving' ? '送信中…' : '受け取る'}
              </button>
            </form>
            {leadError && (
              <p className="text-sm mt-2" style={{ color: '#EF4444' }}>{leadError}</p>
            )}
            {leadState === 'error' && (
              <p className="text-sm mt-2" style={{ color: '#EF4444' }}>
                送信に失敗しました。時間をおいて試すか{' '}
                <a href={`mailto:${SITE_CONFIG.contactEmail}`} className="underline font-bold">
                  {SITE_CONFIG.contactEmail}
                </a>{' '}
                までご連絡ください。
              </p>
            )}
            <p className="text-xs mt-3" style={{ color: '#A8D5A2' }}>
              入力いただいた情報は解説とお知らせの送付にのみ使用します。
            </p>
          </>
        )}
      </div>

      {/* 詳細診断CTA */}
      <div
        className="p-6 rounded-2xl border text-center mb-6"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#2D8F4E', borderWidth: '2px' }}
      >
        <p className="font-bold mb-1" style={{ color: '#1C2A1E' }}>どのタイプか詳しく知りたい方は</p>
        <p className="text-sm mb-4" style={{ color: '#4A6550' }}>
          60問の詳細診断で、22タイプの中からあなたの野生タイプを完全判定。
          結果はメールでお送りします。
        </p>
        <a
          href="/quiz"
          className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#2D8F4E' }}
        >
          📊 60問で詳しく診断する →
        </a>
      </div>

      {/* kawabadoへの送客（文脈のある本文リンク） */}
      <KawabadoInvite
        placement="quick_quiz_result"
        lead="wildflowのレッスンは不定期開催です。「今週どこかで動きたい」なら、"
      />

      {/* シェアボタン */}
      <div
        className="p-5 rounded-2xl border mb-6"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8E4' }}
      >
        <p className="text-sm font-bold mb-3 text-center" style={{ color: '#1C2A1E' }}>
          📣 友達にシェアする
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTextX)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#000000' }}
          >
            𝕏 でシェアする
          </a>
          <a
            href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(`${SITE_URL}/quiz/quick`)}&text=${encodeURIComponent(shareTextLine)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#06C755' }}
          >
            LINE でシェアする
          </a>
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm border-2 transition-opacity hover:opacity-80"
            style={{ borderColor: '#E2E8E4', color: '#1C2A1E', backgroundColor: '#F8F7F2' }}
          >
            {copied ? '✅ コピーしました！' : '🔗 URLをコピー（XHS・lemon8用）'}
          </button>
        </div>
      </div>

      <div className="text-center mt-6">
        <button
          onClick={() => navigate('/quiz/quick')}
          className="text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: '#4A6550' }}
        >
          🔄 もう一度簡易診断する
        </button>
      </div>
    </main>
  );
}
