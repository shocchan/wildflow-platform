import { TODAY_MOVE } from '../data/entryCopy';
import { track } from '../services/analytics';
import type { Entry } from '../utils/entry';
import { useLang, langPath } from '../i18n/lang';
import { MESSAGES } from '../i18n/messages';

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
 * 結果ページの最初の行動「今日やる1動作」（2026-09-18）。
 * 結果を「レッスンに来る理由」で終わらせず、いま床でできる30秒を先に渡す。
 * 動画は撮影後に entryCopy.ts の TODAY_MOVE[軸].video に URL を入れるだけ。
 */
export function TodayMove({ ability, abilityLabel, entry }: { ability: Ability; abilityLabel: string; entry: Entry }) {
  const lang = useLang();
  const t = MESSAGES[lang].today;
  const m = TODAY_MOVE[ability];
  const url = embedUrl(m.video);
  return (
    <div className="rounded-2xl mb-6 overflow-hidden" style={{ backgroundColor: '#1a3a2a' }}>
      <div className="p-5 md:p-6">
        <p className="text-xs font-bold mb-1" style={{ color: '#6fcf97', letterSpacing: '0.14em' }}>{t.kicker}</p>
        <h2 className="text-xl font-black mb-1 text-white">
          {m.name} <span className="text-sm font-medium" style={{ color: '#C8E6CA' }}>{m.jp[lang]}</span>
        </h2>
        <p className="text-sm mb-4" style={{ color: '#C8E6CA' }}>{t.lead(abilityLabel)}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {/* しょっちゃんの動作イラスト（ChatGPT生成・青タオル）。動画が入るまでの「見て分かる」担当 */}
          <img
            src={`/img/shocchan/${m.image}.webp`}
            alt={t.alt(m.jp[lang])}
            width={1024}
            height={1024}
            className="mx-auto rounded-xl"
            style={{ width: '200px', height: 'auto', backgroundColor: '#EDF7EE', padding: '8px' }}
          />
          <ol className="space-y-2 text-sm" style={{ color: '#FFFFFF' }}>
            {m.how[lang].map((h, i) => (
              <li key={i} className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center" style={{ backgroundColor: '#F5A623', color: '#1a3a2a' }}>{i + 1}</span>
                <span>{h}</span>
              </li>
            ))}
          </ol>
          <div className="relative w-full rounded-xl overflow-hidden md:col-span-2" style={{ paddingTop: '56.25%', backgroundColor: '#0f261a', border: '1px solid #2D8F4E' }}>
            {url ? (
              <iframe
                src={url}
                title={`${m.name}`}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4" style={{ color: '#9DB6A0' }}>
                <span className="text-2xl mb-1">🎬</span>
                <span className="text-sm font-bold" style={{ color: '#EAF3E6' }}>{t.videoWait}</span>
                <span className="text-xs">{t.videoSub}</span>
              </div>
            )}
          </div>
        </div>
        <p className="mt-4 text-xs" style={{ color: '#9DB6A0' }}>{t.caution}</p>
        <a
          href={langPath(m.more[entry], lang)}
          onClick={() => track('click_primary_cta', { cta: 'quick_result_today_move', entry, ability, lang })}
          className="inline-flex items-center gap-1 mt-3 text-sm font-bold underline"
          style={{ color: '#F5A623', minHeight: '44px' }}
        >
          {t.more}
        </a>
      </div>
    </div>
  );
}
