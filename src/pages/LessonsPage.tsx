import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPublishedLessons, fetchEntryCounts } from '../services/lessons';
import { LESSON_TYPE_MAP } from '../types/lesson';
import type { Lesson } from '../types/lesson';

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

  useEffect(() => {
    fetchPublishedLessons()
      .then(async (ls) => {
        setLessons(ls);
        const c = await fetchEntryCounts(ls.map(l => l.id));
        setCounts(c);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black mb-2" style={{ color: '#1C2A1E' }}>レッスン</h1>
      <p className="text-sm mb-10" style={{ color: '#5a7a62' }}>Animal Flowの5つのアビリティを鍛えるレッスンを開催しています。</p>

      {/* 5つのアビリティ説明 */}
      <section className="mb-12">
        <h2 className="text-lg font-bold mb-4" style={{ color: '#1C2A1E' }}>5つのアビリティ</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {(Object.entries(LESSON_TYPE_MAP) as [keyof typeof LESSON_TYPE_MAP, typeof LESSON_TYPE_MAP[keyof typeof LESSON_TYPE_MAP]][]).map(([type, info]) => (
            <div key={type} className="rounded-xl p-4 text-center border" style={{ borderColor: info.color, backgroundColor: `${info.color}18` }}>
              <div className="text-2xl mb-1">{info.emoji}</div>
              <div className="text-xs font-bold mb-1" style={{ color: '#1C2A1E' }}>{info.ability}</div>
              <div className="text-xs" style={{ color: '#5a7a62' }}>{info.move}</div>
            </div>
          ))}
        </div>
      </section>

      {/* レッスン一覧 */}
      <section>
        <h2 className="text-lg font-bold mb-4" style={{ color: '#1C2A1E' }}>開催予定レッスン</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 rounded-xl animate-pulse" style={{ backgroundColor: '#E2E8E4' }} />
            ))}
          </div>
        ) : lessons.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border" style={{ borderColor: '#E2E8E4', color: '#5a7a62' }}>
            <p className="text-4xl mb-3">🌿</p>
            <p className="font-bold">現在開催予定のレッスンはありません</p>
            <p className="text-sm mt-1">SNSをフォローして最新情報をチェックしてください</p>
          </div>
        ) : (
          <div className="space-y-4">
            {lessons.map(lesson => {
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
    </main>
  );
}
