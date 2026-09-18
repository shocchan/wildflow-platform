import { useLang, setLang, type Lang } from '../i18n/lang';

/** ヘッダーの言語切替（日本語／中文）。静的ページ側は各ページ上部バーに同じ見た目のリンクを置く */
export function LangToggle({ compact = false }: { compact?: boolean }) {
  const lang = useLang();
  const btn = (l: Lang, label: string) => (
    <button
      type="button"
      onClick={() => setLang(l)}
      aria-pressed={lang === l}
      className="px-2.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap"
      style={{
        minHeight: compact ? '32px' : '36px',
        backgroundColor: lang === l ? '#2D8F4E' : 'transparent',
        color: lang === l ? '#FFFFFF' : '#4A6550',
      }}
    >
      {label}
    </button>
  );
  return (
    <div className="inline-flex items-center rounded-full border p-0.5" style={{ borderColor: '#E2E8E4', backgroundColor: '#F8F7F2' }} aria-label="言語 / Language">
      {btn('ja', '日本語')}
      {btn('zh', '中文')}
    </div>
  );
}
