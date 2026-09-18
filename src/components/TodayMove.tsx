import { TODAY_MOVE } from '../data/entryCopy';
import { track } from '../services/analytics';
import type { Entry } from '../utils/entry';

type Ability = keyof typeof TODAY_MOVE;

/** YouTube / Vimeo の URL か ID → embed URL。/animalflow.html の埋め込みと同じ判定 */
function embedUrl(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  const vm = s.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  if (/^\d{6,}$/.test(s)) return `https://player.vimeo.com/video/${s}`;
  const yt = s.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([A-Za-z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return `https://www.youtube.com/embed/${s}`;
  return null;
}

/**
 * 結果ページの最初の行動「今日やる1動作」（2026-09-18 ガラッと改善案 #2）。
 * 結果を「レッスンに来る理由」で終わらせず、いま床でできる30秒を先に渡す。
 * 動画は撮影後に entryCopy.ts の TODAY_MOVE[軸].video に URL を入れるだけ。
 */
export function TodayMove({ ability, abilityLabel, entry }: { ability: Ability; abilityLabel: string; entry: Entry }) {
  const m = TODAY_MOVE[ability];
  const url = embedUrl(m.video);
  return (
    <div className="rounded-2xl mb-6 overflow-hidden" style={{ backgroundColor: '#1a3a2a' }}>
      <div className="p-5 md:p-6 relative">
        <img
          src="/img/shocchan/joy.png"
          alt=""
          width={370}
          height={320}
          className="absolute right-3 top-2 hidden sm:block"
          style={{ width: '92px', height: 'auto', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,.25))' }}
        />
        <p className="text-xs font-bold mb-1" style={{ color: '#6fcf97', letterSpacing: '0.14em' }}>TODAY ／ 今日やる1動作（30秒）</p>
        <h2 className="text-xl font-black mb-1 text-white">
          {m.name} <span className="text-sm font-medium" style={{ color: '#C8E6CA' }}>{m.jp}</span>
        </h2>
        <p className="text-sm mb-4" style={{ color: '#C8E6CA' }}>
          「{abilityLabel}」が伸びしろなら、まずこれ1つ。レッスンに来なくても、今日の床でできます。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <ol className="space-y-2 text-sm" style={{ color: '#FFFFFF' }}>
            {m.how.map((h, i) => (
              <li key={i} className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center" style={{ backgroundColor: '#F5A623', color: '#1a3a2a' }}>{i + 1}</span>
                <span>{h}</span>
              </li>
            ))}
          </ol>
          <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingTop: '56.25%', backgroundColor: '#0f261a', border: '1px solid #2D8F4E' }}>
            {url ? (
              <iframe
                src={url}
                title={`${m.name} の動画`}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4" style={{ color: '#9DB6A0' }}>
                <span className="text-2xl mb-1">🎬</span>
                <span className="text-sm font-bold" style={{ color: '#EAF3E6' }}>30秒動画 準備中</span>
                <span className="text-xs">撮影しだい、ここに入ります</span>
              </div>
            )}
          </div>
        </div>
        <p className="mt-4 text-xs" style={{ color: '#9DB6A0' }}>
          痛みがある部位は動かさないでください。治療ではなく、負担が集まりにくい体の使い方の練習です。
        </p>
        <a
          href={m.more[entry]}
          onClick={() => track('click_primary_cta', { cta: 'quick_result_today_move', entry, ability })}
          className="inline-flex items-center gap-1 mt-3 text-sm font-bold underline"
          style={{ color: '#F5A623', minHeight: '44px' }}
        >
          この動きの詳しい説明を見る →
        </a>
      </div>
    </div>
  );
}
