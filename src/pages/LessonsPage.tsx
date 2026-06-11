import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPublishedLessons, fetchEntryCounts } from '../services/lessons';
import { LESSON_TYPE_MAP } from '../types/lesson';
import type { Lesson, LessonType } from '../types/lesson';

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
}

function formatTime(t: string) {
  return t.slice(0, 5);
}

export function LessonsPage() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<LessonType | null>(null);

  useEffect(() => {
    fetchPublishedLessons()
      .then(async (ls) => {
        setLessons(ls);
        const c = await fetchEntryCounts(ls.map(l => l.id));
        setCounts(c);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredLessons = activeFilter
    ? lessons.filter(l => l.lesson_type === activeFilter)
    : lessons;

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black mb-2" style={{ color: '#1C2A1E' }}>レッスン</h1>
      <p className="text-sm mb-4" style={{ color: '#5a7a62' }}>Animal Flowの5つのアビリティを鍛えるレッスンを開催しています。</p>

      {/* 体験イメージリンク */}
      <a href="/lessons/experience" className="inline-flex items-center text-sm underline mb-8" style={{ color: '#2D8F4E', minHeight: '44px', padding: '10px 0' }}>
        👀 レッスンってどんな感じ？体験イメージを見る
      </a>

      {/* フルパックバナー */}
      <div
        className="rounded-2xl border-2 p-6 mb-10"
        style={{ backgroundColor: '#FFFBEB', borderColor: '#F59E0B' }}
      >
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <span className="text-2xl">🐉</span>
          <h3 className="text-xl font-bold" style={{ color: '#1C2A1E' }}>野生解放フルパック</h3>
          <span
            className="text-xs px-2 py-1 rounded-full font-bold text-white"
            style={{ backgroundColor: '#F59E0B' }}
          >
            20% OFF
          </span>
        </div>
        <p className="text-sm mb-4" style={{ color: '#5a7a62' }}>
          5つ全てのアビリティを解放する完全プログラム。<br />
          通常¥15,000 → <strong className="text-lg" style={{ color: '#D97706' }}>¥12,000</strong>
        </p>
        <a
          href="/lessons/package"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#D97706' }}
        >
          フルパックで申し込む →
        </a>
      </div>

      {/* 5つのアビリティ（フィルター兼用） */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4" style={{ color: '#1C2A1E' }}>5つのアビリティ</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {(Object.entries(LESSON_TYPE_MAP) as [LessonType, typeof LESSON_TYPE_MAP[LessonType]][]).map(([type, info]) => {
            const isActive = activeFilter === type;
            return (
              <button
                key={type}
                onClick={() => setActiveFilter(isActive ? null : type)}
                className="rounded-xl p-4 text-center border transition-all"
                style={{
                  borderColor: isActive ? info.color : info.color,
                  backgroundColor: isActive ? `${info.color}40` : `${info.color}18`,
                  outline: isActive ? `2px solid ${info.color}` : 'none',
                  cursor: 'pointer',
                }}
              >
                <div className="text-2xl mb-1">{info.emoji}</div>
                <div className="text-xs font-bold mb-1" style={{ color: '#1C2A1E' }}>{info.ability}</div>
                <div className="text-xs" style={{ color: '#5a7a62' }}>{info.move}</div>
                {isActive && (
                  <div className="text-xs mt-1 font-bold" style={{ color: info.color }}>✓ 絞込中</div>
                )}
              </button>
            );
          })}
        </div>
        {activeFilter && (
          <p className="text-xs mt-3" style={{ color: '#5a7a62' }}>
            {LESSON_TYPE_MAP[activeFilter].ability}のレッスンを表示中 —{' '}
            <button
              onClick={() => setActiveFilter(null)}
              className="underline font-medium"
              style={{ color: '#2D8F4E' }}
            >
              全て表示
            </button>
          </p>
        )}
      </section>

      {/* レッスン一覧 */}
      <section>
        <h2 className="text-2xl font-bold mb-4" style={{ color: '#1C2A1E' }}>開催予定レッスン</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 rounded-xl animate-pulse" style={{ backgroundColor: '#E2E8E4' }} />
            ))}
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border" style={{ borderColor: '#E2E8E4', color: '#5a7a62' }}>
            <p className="text-4xl mb-3">🌿</p>
            <p className="font-bold">
              {activeFilter
                ? `${LESSON_TYPE_MAP[activeFilter].ability}のレッスンは現在開催予定がありません`
                : '現在開催予定のレッスンはありません'}
            </p>
            <p className="text-sm mt-1">SNSをフォローして最新情報をチェックしてください</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLessons.map(lesson => {
              const info = LESSON_TYPE_MAP[lesson.lesson_type];
              const entryCount = counts[lesson.id] ?? 0;
              const remaining = lesson.capacity - entryCount;
              const isFull = remaining <= 0;

              return (
                <div
                  key={lesson.id}
                  className="rounded-xl border p-5"
                  style={{ borderColor: '#E2E8E4', borderLeft: `4px solid ${info.color}`, backgroundColor: '#fff' }}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full mb-2 inline-block"
                        style={{ backgroundColor: `${info.color}30`, color: '#1C2A1E' }}>
                        {info.emoji} {info.label}
                      </span>
                      <h3 className="font-bold text-lg leading-snug mb-2" style={{ color: '#1C2A1E' }}>{lesson.title}</h3>
                      <div className="space-y-1 text-sm" style={{ color: '#5a7a62' }}>
                        <p>📅 {formatDate(lesson.date)}　{formatTime(lesson.start_time)}〜{formatTime(lesson.end_time)}</p>
                        <p>📍 {lesson.location}</p>
                        <p>👤 インストラクター：{lesson.instructor}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span>
                            👥 残り{' '}
                            <span className="font-bold" style={{ color: isFull ? '#ef4444' : '#2D8F4E' }}>
                              {isFull ? '満席' : `${remaining} 席`}
                            </span>
                            {' '}/ {lesson.capacity}名
                          </span>
                          <span className="font-bold" style={{ color: '#1C2A1E' }}>
                            💴 ¥{lesson.price.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: '#6B7280' }}>
                          💳 支払い方法：PayPay / WeChat Pay
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <button
                        disabled={isFull}
                        onClick={() => navigate(`/lessons/${lesson.id}`)}
                        className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
                        style={{
                          backgroundColor: isFull ? '#E2E8E4' : '#2D8F4E',
                          color: isFull ? '#9ca3af' : '#fff',
                          cursor: isFull ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {isFull ? '満席' : '申し込む'}
                      </button>
                    </div>
                  </div>
                  {lesson.description && (
                    <p className="mt-3 text-sm leading-relaxed" style={{ color: '#5a7a62' }}>{lesson.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 受講者の声 */}
      <section className="py-16">
        <h2 className="text-2xl font-bold text-center mb-8" style={{ color: '#1C2A1E' }}>受講者の声</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl p-6 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8E4' }}>
              <p className="text-sm text-center" style={{ color: '#9CA3AF' }}>
                💬 受講者の声を追加予定
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
