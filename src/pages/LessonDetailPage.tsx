import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchLessonById, fetchEntryCounts, createEntry } from '../services/lessons';
import { LESSON_TYPE_MAP } from '../types/lesson';
import type { Lesson } from '../types/lesson';
import { supabase } from '../services/supabaseClient';

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
}

function formatTime(t: string) {
  return t.slice(0, 5);
}

type PageState = 'detail' | 'submitting' | 'done' | 'error';

export function LessonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [entryCount, setEntryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pageState, setPageState] = useState<PageState>('detail');
  const [errorMsg, setErrorMsg] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetchLessonById(id),
      fetchEntryCounts([id]),
    ]).then(([l, counts]) => {
      setLesson(l);
      setEntryCount(counts[id] ?? 0);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lesson) return;
    setPageState('submitting');

    try {
      const entry = await createEntry({
        lesson_id: lesson.id,
        name,
        email,
        phone: phone || null,
        message: message || null,
        payment_status: 'unpaid',
      });

      // Edge Function でメール送信
      await supabase.functions.invoke('send-lesson-payment-email', {
        body: { entryData: entry, lessonData: lesson },
      });

      setPageState('done');
    } catch (err) {
      console.error(err);
      setErrorMsg('申し込みに失敗しました。時間をおいて再度お試しください。');
      setPageState('error');
    }
  };

  if (loading) {
    return (
      <main className="max-w-2xl md:max-w-4xl mx-auto px-4 md:px-8 lg:px-12 py-10">
        <div className="h-8 w-48 rounded animate-pulse mb-4" style={{ backgroundColor: '#E2E8E4' }} />
        <div className="h-64 rounded-xl animate-pulse" style={{ backgroundColor: '#E2E8E4' }} />
      </main>
    );
  }

  if (!lesson) {
    return (
      <main className="max-w-2xl md:max-w-4xl mx-auto px-4 md:px-8 lg:px-12 py-10 text-center">
        <p className="text-4xl mb-3">🍃</p>
        <p className="font-bold" style={{ color: '#1C2A1E' }}>レッスンが見つかりませんでした</p>
        <button onClick={() => navigate('/lessons')} className="mt-4 text-sm underline" style={{ color: '#2D8F4E' }}>
          レッスン一覧に戻る
        </button>
      </main>
    );
  }

  if (pageState === 'done') {
    return (
      <main className="max-w-2xl md:max-w-4xl mx-auto px-4 md:px-8 lg:px-12 py-10 text-center">
        <div className="rounded-2xl border p-10" style={{ borderColor: '#E2E8E4', backgroundColor: '#fff' }}>
          <p className="text-5xl mb-4">✅</p>
          <h2 className="text-xl font-black mb-3" style={{ color: '#1C2A1E' }}>申し込みが完了しました！</h2>
          <p className="text-sm mb-2" style={{ color: '#5a7a62' }}>
            ご登録のメールアドレスに支払い案内をお送りしました。
          </p>
          {lesson.payment_deadline && (
            <p className="text-sm mb-2" style={{ color: '#5a7a62' }}>
              支払い期限：{formatDate(lesson.payment_deadline)}
            </p>
          )}
          <p className="text-sm mb-6" style={{ color: '#5a7a62' }}>
            ご不明な点は{' '}
            <a href="mailto:info@kawabado.com" style={{ color: '#2D8F4E', textDecoration: 'underline' }}>
              info@kawabado.com
            </a>{' '}
            までお気軽にご連絡ください。
          </p>
          <button
            onClick={() => navigate('/lessons')}
            className="px-6 py-2.5 rounded-xl font-bold text-sm text-white"
            style={{ backgroundColor: '#2D8F4E' }}
          >
            レッスン一覧に戻る
          </button>
        </div>
      </main>
    );
  }

  const info = LESSON_TYPE_MAP[lesson.lesson_type];
  const remaining = lesson.capacity - entryCount;
  const isFull = remaining <= 0;

  return (
    <main className="max-w-2xl md:max-w-4xl mx-auto px-4 md:px-8 lg:px-12 py-10">
      <button onClick={() => navigate('/lessons')} className="text-sm mb-6 flex items-center gap-1 transition-colors" style={{ color: '#2D8F4E' }}>
        ← レッスン一覧に戻る
      </button>

      {/* レッスン詳細 */}
      <div className="rounded-2xl border p-6 mb-8" style={{ borderColor: '#E2E8E4', borderLeft: `4px solid ${info.color}`, backgroundColor: '#fff' }}>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full mb-3 inline-block"
          style={{ backgroundColor: `${info.color}30`, color: '#1C2A1E' }}>
          {info.emoji} {info.label}
        </span>
        <h1 className="text-2xl font-black mb-4" style={{ color: '#1C2A1E' }}>{lesson.title}</h1>
        {lesson.description && (
          <p className="text-sm leading-relaxed mb-5" style={{ color: '#5a7a62' }}>{lesson.description}</p>
        )}
        <div className="space-y-2 text-sm" style={{ color: '#5a7a62' }}>
          <p>📅 {formatDate(lesson.date)}　{formatTime(lesson.start_time)}〜{formatTime(lesson.end_time)}</p>
          <p>📍 {lesson.location}</p>
          <div>
            <p className="mb-0.5">👤 インストラクター：{lesson.instructor}</p>
            {lesson.instructor === 'しょっちゃん' && (
              <div className="ml-5 mt-1">
                <p className="text-sm" style={{ color: '#5a7a62' }}>Animal Flow Level 1認定インストラクター・小紅書フォロワー5,000+</p>
                <a href="/profile" target="_blank" rel="noopener noreferrer" className="text-sm underline" style={{ color: '#2D8F4E' }}>
                  インストラクター紹介を見る →
                </a>
              </div>
            )}
          </div>
          <p>
            👥 残り{' '}
            <span className="font-bold" style={{ color: isFull ? '#ef4444' : '#2D8F4E' }}>
              {isFull ? '満席' : `${remaining} 席`}
            </span>
            {' '}/ {lesson.capacity}名
          </p>
          <p className="font-bold text-base" style={{ color: '#1C2A1E' }}>💴 ¥{lesson.price.toLocaleString()}</p>
          {lesson.payment_deadline && (
            <p>⏰ 支払い期限：{formatDate(lesson.payment_deadline)}</p>
          )}
        </div>
      </div>

      {/* 申込フォーム */}
      {isFull ? (
        <div className="rounded-2xl border p-8 text-center" style={{ borderColor: '#E2E8E4', backgroundColor: '#fff' }}>
          <p className="text-4xl mb-3">😢</p>
          <p className="font-bold" style={{ color: '#1C2A1E' }}>このレッスンは満席です</p>
          <p className="text-sm mt-2" style={{ color: '#5a7a62' }}>次回のレッスンをお待ちください</p>
        </div>
      ) : (
        <div className="rounded-2xl border p-6" style={{ borderColor: '#E2E8E4', backgroundColor: '#fff' }}>
          <h2 className="text-lg font-bold mb-5" style={{ color: '#1C2A1E' }}>申込フォーム</h2>
          <div className="rounded-xl p-4 mb-6 text-sm" style={{ backgroundColor: '#EDF7EE' }}>
            <p className="font-bold mb-2">📋 申し込み前にご確認ください</p>
            <ul className="space-y-1" style={{ color: '#4A6550' }}>
              <li>✓ 定員：{lesson.capacity}名（先着順）</li>
              <li>✓ 初心者・未経験者大歓迎</li>
              <li>✓ キャンセル：開催3日前まで全額返金</li>
              <li>✓ 動きやすい服装・室内シューズをご持参ください</li>
            </ul>
          </div>
          {pageState === 'error' && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }}>
              {errorMsg}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#5a7a62' }}>
                お名前 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border outline-none text-sm"
                style={{ borderColor: '#E2E8E4', color: '#1C2A1E', backgroundColor: '#F8F7F2' }}
                placeholder="山田 太郎"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#5a7a62' }}>
                メールアドレス <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border outline-none text-sm"
                style={{ borderColor: '#E2E8E4', color: '#1C2A1E', backgroundColor: '#F8F7F2' }}
                placeholder="example@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#5a7a62' }}>電話番号（任意）</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border outline-none text-sm"
                style={{ borderColor: '#E2E8E4', color: '#1C2A1E', backgroundColor: '#F8F7F2' }}
                placeholder="090-1234-5678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#5a7a62' }}>メッセージ（任意）</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border outline-none text-sm resize-none"
                style={{ borderColor: '#E2E8E4', color: '#1C2A1E', backgroundColor: '#F8F7F2' }}
                placeholder="ご質問・ご要望があればご記入ください"
              />
            </div>
            <button
              type="submit"
              disabled={pageState === 'submitting'}
              className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all"
              style={{ backgroundColor: pageState === 'submitting' ? '#93c4a7' : '#2D8F4E' }}
            >
              {pageState === 'submitting' ? '送信中...' : '申し込む'}
            </button>
          </form>
          <p className="text-sm mt-3 text-center" style={{ color: '#6B7280' }}>
            申込後、PayPay / WeChat Pay のお支払い案内メールをお送りします。
          </p>
        </div>
      )}
    </main>
  );
}
