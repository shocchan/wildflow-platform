import { SITE_CONFIG } from '../config/site';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold mb-3" style={{ color: '#1C2A1E' }}>
        {title}
      </h2>
      <div className="text-sm leading-relaxed" style={{ color: '#4A6550' }}>
        {children}
      </div>
    </section>
  );
}

export function PrivacyPage() {
  return (
    <main className="max-w-3xl md:max-w-4xl mx-auto px-4 md:px-8 lg:px-12 py-16">
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#2D8F4E' }}>
        PRIVACY
      </p>
      <h1 className="text-2xl md:text-3xl font-black mb-2" style={{ color: '#1C2A1E' }}>
        プライバシーポリシー
      </h1>
      <p className="text-sm mb-10" style={{ color: '#9CA3AF' }}>制定日：2026年6月</p>

      <div
        className="rounded-2xl border p-6 md:p-8 space-y-0"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8E4' }}
      >
        <Section title="1. 事業者">
          <p>{SITE_CONFIG.companyName}（以下「当社」）は、お客様の個人情報を適切に保護することを重要な社会的責務と考えています。</p>
        </Section>

        <Section title="2. 取得する情報">
          <p>当社は、サービス提供にあたり以下の情報を取得することがあります。</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>氏名</li>
            <li>メールアドレス</li>
            <li>野生診断の結果データ（匿名化して統計処理する場合があります）</li>
          </ul>
        </Section>

        <Section title="3. 取得の目的">
          <ul className="space-y-1 list-disc list-inside">
            <li>レッスン申し込みの受付・ご連絡</li>
            <li>野生診断結果のご案内メール送信</li>
            <li>サービス改善のための統計分析（個人を特定しない形で利用）</li>
          </ul>
        </Section>

        <Section title="4. 第三者への提供">
          <p>
            法令に基づく場合を除き、お客様の個人情報を第三者に提供することはありません。
          </p>
        </Section>

        <Section title="5. 業務委託">
          <p>
            メール送信処理にResend（resend.com）を利用しています。委託先においても適切な個人情報の保護が行われるよう管理します。
          </p>
        </Section>

        <Section title="6. 保存期間">
          <p>
            個人情報はサービス終了まで、または本人からの削除依頼があるまで保存します。削除のご依頼は下記お問い合わせ先までご連絡ください。
          </p>
        </Section>

        <Section title="7. 安全管理">
          <p>
            個人情報への不正アクセス・紛失・破壊・改ざんを防ぐため、適切な安全管理措置を講じます。
          </p>
        </Section>

        <Section title="8. お問い合わせ">
          <p>個人情報の開示・訂正・削除等のご依頼は、以下の連絡先までお願いいたします。</p>
          <p className="mt-2">
            <a
              href={`mailto:${SITE_CONFIG.contactEmail}`}
              className="underline hover:opacity-70 transition-opacity"
              style={{ color: '#2D8F4E' }}
            >
              {SITE_CONFIG.contactEmail}
            </a>
          </p>
        </Section>

        <p className="text-xs pt-4 border-t" style={{ color: '#9CA3AF', borderColor: '#E2E8E4' }}>
          本ポリシーは予告なく改定される場合があります。改定後のポリシーはこのページに掲載します。
        </p>
      </div>
    </main>
  );
}
