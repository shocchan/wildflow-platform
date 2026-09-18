import { kawabadoActivityUrl } from '../config/site';
import { track } from '../services/analytics';
import { useLang } from '../i18n/lang';
import { MESSAGES } from '../i18n/messages';

interface Props {
  /** 設置場所。UTMのcampaignとGAイベントに入るので、後から「どこが効いたか」が分かる */
  placement: string;
  /** 導入の一文。文脈に合わせて差し替える（省略時は辞書の既定文） */
  lead?: string;
}

/**
 * kawabado（川口・蕨のバドミントン活動）への送客ブロック。
 * 押し付けがましくならないよう、必ず「文脈のある本文リンク」として置くこと。
 * リンクはUTM付き・dofollow。zh のときは kawabado の zh ページへ（/ja/ → /zh/）。
 */
export function KawabadoInvite({ placement, lead }: Props) {
  const lang = useLang();
  const t = MESSAGES[lang].exits;
  const href = kawabadoActivityUrl(placement).replace('/ja/', lang === 'zh' ? '/zh/' : '/ja/');
  return (
    <div className="p-5 rounded-2xl border mb-6" style={{ backgroundColor: '#F8F7F2', borderColor: '#E2E8E4' }}>
      <p className="text-base font-bold mb-1" style={{ color: '#1C2A1E' }}>{t.kawaInviteTitle}</p>
      <p className="text-sm leading-relaxed mb-3" style={{ color: '#4A6550' }}>
        {lead ?? t.kawaInviteLead}
        {t.kawaInviteBody}
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener"
        onClick={() => track('click_kawabado_referral', { placement })}
        className="inline-flex items-center gap-1 text-sm font-bold underline transition-opacity hover:opacity-70"
        style={{ color: '#2D8F4E', minHeight: '44px' }}
      >
        {t.kawaInviteCta}
      </a>
    </div>
  );
}
