import { kawabadoActivityUrl } from '../config/site';
import { track } from '../services/analytics';

interface Props {
  /** 設置場所。UTMのcampaignとGAイベントに入るので、後から「どこが効いたか」が分かる */
  placement: string;
  /** 導入の一文。文脈に合わせて差し替える */
  lead: string;
}

/**
 * kawabado（川口・蕨のバドミントン活動）への送客ブロック。
 *
 * wildflowの読者（川口・蕨で「体を動かしたい人」）とkawabadoの通常活動は対象が重なる。
 * 押し付けがましくならないよう、必ず「文脈のある本文リンク」として置くこと。
 * リンクはUTM付き・dofollow（kawabado側からwildflowへのサイトワイドリンクとは扱いが逆。
 * あちらは nofollow にする方針）。
 */
export function KawabadoInvite({ placement, lead }: Props) {
  return (
    <div
      className="p-5 rounded-2xl border mb-6"
      style={{ backgroundColor: '#F8F7F2', borderColor: '#E2E8E4' }}
    >
      <p className="text-base font-bold mb-1" style={{ color: '#1C2A1E' }}>
        🏸 川口・蕨で、まず体を動かしたい方へ
      </p>
      <p className="text-sm leading-relaxed mb-3" style={{ color: '#4A6550' }}>
        {lead}
        wildflowと同じしょっちゃんが、川口・蕨でバドミントンの活動もやっています。
        初心者や1人参加の方が多い、ゆるい集まりです。
      </p>
      <a
        href={kawabadoActivityUrl(placement)}
        target="_blank"
        rel="noopener"
        onClick={() => track('click_kawabado_referral', { placement })}
        className="inline-flex items-center gap-1 text-sm font-bold underline transition-opacity hover:opacity-70"
        style={{ color: '#2D8F4E', minHeight: '44px' }}
      >
        kawabado の通常活動を見る →
      </a>
    </div>
  );
}
