/** ブランドロゴ（SVG）。X は公式のXマーク、LINE は公式ロゴの吹き出し形。色は各社ガイドの指定色 */
export function XLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function LineLogo({ size = 20 }: { size?: number }) {
  // LINE のアイコン（白い吹き出しに緑の LINE ワードマーク）。緑地の上に置く前提
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#fff" d="M24 4C12.4 4 3 11.7 3 21.2c0 8.5 7.5 15.6 17.7 17 .7.1 1.6.5 1.9 1.1.2.5.1 1.4.1 2l-.3 1.9c-.1.6-.5 2.2 1.9 1.2s12.6-7.4 17.2-12.7C44.7 28 45 24.7 45 21.2 45 11.7 35.6 4 24 4z" />
      <path fill="#06C755" d="M17.3 26.1h-3.8V17.7c0-.4-.4-.8-.8-.8s-.8.4-.8.8v9.2c0 .4.4.8.8.8h4.6c.4 0 .8-.4.8-.8s-.3-.8-.8-.8zm3.1-9.2c-.4 0-.8.4-.8.8v9.2c0 .4.4.8.8.8s.8-.4.8-.8v-9.2c0-.4-.3-.8-.8-.8zm10.6 0c-.4 0-.8.4-.8.8v5.7l-4.7-6.2c-.2-.2-.5-.4-.8-.3-.3.1-.6.4-.6.8v9.2c0 .4.4.8.8.8s.8-.4.8-.8v-5.7l4.7 6.2c.2.2.4.3.6.3h.2c.3-.1.6-.4.6-.8v-9.2c0-.4-.4-.8-.8-.8zm7.4 1.6c.4 0 .8-.4.8-.8s-.4-.8-.8-.8h-4.6c-.4 0-.8.4-.8.8v9.2c0 .4.4.8.8.8h4.6c.4 0 .8-.4.8-.8s-.4-.8-.8-.8h-3.8v-3h3.8c.4 0 .8-.4.8-.8s-.4-.8-.8-.8h-3.8v-3h3.8z" />
    </svg>
  );
}

export function LinkIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
