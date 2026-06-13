import { SITE_CONFIG } from '../config/site';

const ROWS = [
  { label: '販売事業者', value: SITE_CONFIG.companyName },
  { label: '運営責任者', value: SITE_CONFIG.representativeName },
  { label: '所在地', value: 'お問い合わせいただいた場合に遅滞なく開示いたします' },
  { label: 'お問い合わせ', value: SITE_CONFIG.contactEmail, isEmail: true },
  { label: '販売URL', value: SITE_CONFIG.siteUrl, isLink: true },
  { label: '商品・サービス名', value: 'Animal Flowレッスン（単発・パッケージ）' },
  {
    label: '販売価格',
    value: '単発レッスン：¥3,000（税込）\n野生解放フルパック：¥12,000（税込）',
    multiline: true,
  },
  { label: '支払方法', value: 'PayPay / WeChat Pay' },
  { label: '支払時期', value: 'お申し込み後、案内メール受信後3日以内' },
  { label: 'サービス提供時期', value: 'お申し込み確定後、別途日程をご案内いたします' },
  {
    label: 'キャンセルポリシー',
    value:
      'レッスン開催14日前まで：全額返金\n13日前〜前日：50%返金\n当日・無断欠席：返金不可',
    multiline: true,
  },
  { label: '特別条件', value: 'なし' },
];

export function LegalPage() {
  return (
    <main className="max-w-3xl md:max-w-4xl mx-auto px-4 md:px-8 lg:px-12 py-16">
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#2D8F4E' }}>
        LEGAL
      </p>
      <h1 className="text-2xl md:text-3xl font-black mb-2" style={{ color: '#1C2A1E' }}>
        特定商取引法に基づく表記
      </h1>
      <p className="text-sm mb-10" style={{ color: '#4A6550' }}>
        特定商取引法に基づき、以下の通り表示いたします。
      </p>

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#E2E8E4' }}>
        {ROWS.map((row, i) => (
          <div
            key={row.label}
            className="flex flex-col sm:flex-row"
            style={{
              borderBottom: i < ROWS.length - 1 ? '1px solid #E2E8E4' : undefined,
            }}
          >
            <div
              className="sm:w-48 flex-shrink-0 px-5 py-4 text-sm font-bold"
              style={{ backgroundColor: '#F8F7F2', color: '#1C2A1E' }}
            >
              {row.label}
            </div>
            <div className="flex-1 px-5 py-4 text-sm leading-relaxed" style={{ color: '#4A6550' }}>
              {row.isEmail ? (
                <a
                  href={`mailto:${row.value}`}
                  className="underline hover:opacity-70 transition-opacity"
                  style={{ color: '#2D8F4E' }}
                >
                  {row.value}
                </a>
              ) : row.isLink ? (
                <a
                  href={row.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:opacity-70 transition-opacity break-all"
                  style={{ color: '#2D8F4E' }}
                >
                  {row.value}
                </a>
              ) : row.multiline ? (
                <span className="whitespace-pre-line">{row.value}</span>
              ) : (
                row.value
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs mt-8" style={{ color: '#9CA3AF' }}>
        ※ 本表記は予告なく変更される場合があります。最新の情報はこのページをご確認ください。
      </p>
    </main>
  );
}
