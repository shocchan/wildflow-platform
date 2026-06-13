import { useEffect, useState } from 'react';
import { fetchPublishedRecoveryPartners } from '../services/recoveryPartners';
import type { RecoveryPartner } from '../types';

const CATEGORY_LABEL: Record<string, string> = {
  yoga: 'ヨガ',
  seikotsuin: '整骨院',
};

const ABILITY_TAG_LABEL: Record<string, string> = {
  flexibility: '柔軟性アビリティ',
  strength: '筋力アビリティ',
  endurance: '持久力アビリティ',
  speed: 'スピードアビリティ',
  coordination: '協調性アビリティ',
};

function PartnerCard({ partner }: { partner: RecoveryPartner }) {
  const categoryLabel = CATEGORY_LABEL[partner.category] ?? partner.category;
  const abilityLabel = partner.ability_tag
    ? ABILITY_TAG_LABEL[partner.ability_tag] ?? partner.ability_tag
    : null;

  return (
    <div
      className="rounded-2xl overflow-hidden border flex flex-col"
      style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8E4' }}
    >
      {/* 16:9 画像エリア */}
      <div
        className="relative overflow-hidden w-full"
        style={{ paddingTop: '56.25%', backgroundColor: '#EDF7EE' }}
      >
        <div className="absolute inset-0">
          {partner.image_url ? (
            <img
              src={partner.image_url}
              alt={partner.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <span className="text-5xl">🌿</span>
              <span className="text-xs font-medium" style={{ color: '#4A6550' }}>
                画像準備中
              </span>
            </div>
          )}
        </div>

        {/* バッジ（左上） */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <span
            className="px-2.5 py-1 rounded-full text-xs font-bold"
            style={{ backgroundColor: '#1C2A1E', color: '#FFFFFF' }}
          >
            {categoryLabel}
          </span>
          {abilityLabel && (
            <span
              className="px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ backgroundColor: '#F59E0B', color: '#FFFFFF' }}
            >
              🌱 {abilityLabel}
            </span>
          )}
        </div>
      </div>

      {/* コンテンツ */}
      <div className="p-5 flex flex-col flex-1">
        <h2 className="text-lg font-black mb-2" style={{ color: '#1C2A1E' }}>
          {partner.name}
        </h2>

        {/* アクセス情報 */}
        <div className="flex items-start gap-1.5 mb-3">
          <span className="text-sm flex-shrink-0 mt-0.5">📍</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#2D8F4E' }}>
              {partner.station_info}
            </p>
            <p className="text-xs" style={{ color: '#4A6550' }}>
              {partner.address}
            </p>
          </div>
        </div>

        {/* 紹介文 */}
        <p
          className="text-sm leading-relaxed flex-1 mb-5"
          style={{ color: '#4A6550', lineHeight: '1.75' }}
        >
          {partner.description}
        </p>

        {/* CTAボタン */}
        <a
          href={partner.booking_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-full font-bold text-sm text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#2D8F4E' }}
        >
          予約・詳細を見る →
        </a>
      </div>
    </div>
  );
}

export function RecoveryPage() {
  const [partners, setPartners] = useState<RecoveryPartner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublishedRecoveryPartners()
      .then(setPartners)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main>
      {/* ヒーロー */}
      <section
        className="py-16 md:py-24 text-center px-4"
        style={{ backgroundColor: '#EDF7EE' }}
      >
        <p className="text-sm font-bold tracking-widest mb-3" style={{ color: '#2D8F4E' }}>
          RECOVERY PARTNERS
        </p>
        <h1
          className="font-black mb-5"
          style={{ color: '#1C2A1E', fontSize: 'clamp(32px, 6vw, 52px)', lineHeight: '1.2' }}
        >
          疲れたあなたへ
        </h1>
        <p
          className="text-base md:text-lg max-w-xl mx-auto"
          style={{ color: '#4A6550', lineHeight: '1.85' }}
        >
          トレーニングと同じくらい、回復は大切。
          <br />
          信頼できるパートナーと、身体をゆるめよう。
        </p>
      </section>

      {/* パートナー一覧 */}
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        {loading ? (
          // スケルトン
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton rounded-2xl h-96" />
            ))}
          </div>
        ) : partners.length === 0 ? (
          // 空状態
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🌿</p>
            <p className="text-lg font-bold mb-2" style={{ color: '#1C2A1E' }}>
              準備中です
            </p>
            <p className="text-sm" style={{ color: '#4A6550' }}>
              提携パートナーを順次追加予定です。お楽しみに。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {partners.map(p => (
              <PartnerCard key={p.id} partner={p} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
