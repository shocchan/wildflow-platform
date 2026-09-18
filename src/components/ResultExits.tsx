import type { ReactNode } from 'react';
import { track } from '../services/analytics';
import { KawabadoInvite } from './KawabadoInvite';
import { kawabadoActivityUrl } from '../config/site';
import type { ProductHealth } from '../services/productHealth';
import type { Entry } from '../utils/entry';
import { useLang, langPath } from '../i18n/lang';
import { MESSAGES } from '../i18n/messages';
import { TODAY_MOVE } from '../data/entryCopy';

type Ability = 'strength' | 'endurance' | 'speed' | 'flexibility' | 'coordination';

/**
 * 10問診断の結果ページ「出口3ブロック」（2026-09-18 P0-4、09-19 に日中対応）。
 * 入口（/badminton・/beginner・それ以外）ごとに、①今日できる一歩 ②レッスン ③仲間／次の入口 を出し分ける。
 * 診断ロジックと判定は触っていない。②は「実際に買えるものだけ案内する」G-3 の方針をそのまま引き継ぐ。
 */

/** 伸びしろの軸 → /badminton の対応表で示した床の動き（名称は英語の正式名） */
const BADMINTON_MOVE: Record<Ability, string> = {
  strength: 'Static Beast ／ Loaded Beast',
  endurance: 'Traveling Beast ／ Traveling Crab',
  speed: 'Underswitch ／ Side Kickthrough',
  flexibility: 'Ape Reach ／ Crab Reach ／ Scorpion Reach',
  coordination: 'Beast Reach ／ Beast Flow',
};

function Block({ no, title, children }: { no: string; title: string; children: ReactNode }) {
  return (
    <div className="p-5 rounded-2xl border mb-4" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8E4' }}>
      <p className="text-xs font-bold mb-1" style={{ color: '#2D8F4E', letterSpacing: '0.14em' }}>{no}</p>
      <h3 className="text-base font-bold mb-2" style={{ color: '#1C2A1E' }}>{title}</h3>
      {children}
    </div>
  );
}

const btn = (bg: string): React.CSSProperties => ({ backgroundColor: bg, minHeight: '48px' });
const BTN = 'inline-flex items-center justify-center gap-1.5 px-6 rounded-xl font-bold text-white transition-opacity hover:opacity-90';

interface Props {
  entry: Entry;
  ability: Ability;
  abilityLabel: string;
  lesson: string;
  health: ProductHealth | null;
}

export function ResultExits({ entry, ability, abilityLabel, lesson, health }: Props) {
  const lang = useLang();
  const t = MESSAGES[lang].exits;
  const cta = (name: string) => () => track('click_primary_cta', { cta: name, entry, ability, lang });
  const kawaHref = (c: string) => kawabadoActivityUrl(c).replace('/ja/', lang === 'zh' ? '/zh/' : '/ja/');

  /* ② レッスン：買えるものだけ案内する（既存 G-3 のロジックをそのまま） */
  const lessonBlock = (
    <Block no={t.no02} title={t.lessonTitle}>
      <p className="text-sm font-bold mb-3" style={{ color: '#1C2A1E' }}>{lesson}</p>
      {health === null ? null : health.singleLessonBuyable ? (
        <a href="/lessons" onClick={cta('quick_result_lessons')} className={BTN} style={btn('#2D8F4E')}>{t.seeLessons(health.nextLessonDate ?? '')}</a>
      ) : health.publishedPackages > 0 ? (
        <>
          <a href="/lessons/package" onClick={cta('quick_result_package')} className={BTN} style={btn('#D97706')}>{t.pack}</a>
          <p className="mt-2 text-sm" style={{ color: '#5a7a62' }}>{t.packNote}</p>
        </>
      ) : (
        <p className="text-sm" style={{ color: '#5a7a62' }}>
          {t.none1}
          <a href="/lessons" className="font-bold underline" style={{ color: '#2D8F4E' }}>{t.noneNotify}</a>
          {t.none2}
          <a href="/contact" className="font-bold underline" style={{ color: '#2D8F4E' }}>{t.contact}</a>
          {t.none3}
        </p>
      )}
      {ability === 'flexibility' && (
        <p className="mt-3 text-sm" style={{ color: '#4A6550' }}>
          🌿 <a href="/recovery" className="font-bold underline" style={{ color: '#2D8F4E' }}>{t.recovery}</a>{t.recoveryTail}
        </p>
      )}
    </Block>
  );

  if (entry === 'badminton') {
    return (
      <section aria-label="next">
        <h2 className="text-lg font-bold mb-3" style={{ color: '#1C2A1E' }}>{t.badTitle}</h2>
        <Block no={t.no01bad} title={t.badBlock(abilityLabel, t.courtLabels[ability])}>
          <p className="text-sm mb-3" style={{ color: '#4A6550' }}>
            {t.badBody1} <strong style={{ color: '#1C2A1E' }}>{BADMINTON_MOVE[ability]}</strong>{t.badBody2}
          </p>
          <a href={langPath('/badminton#axes', lang)} onClick={cta('quick_result_badminton_table')} className={BTN} style={btn('#F59E0B')}>{t.badCta}</a>
        </Block>
        {lessonBlock}
        <Block no={t.no03bad} title={t.kawaTitle}>
          <p className="text-sm mb-3" style={{ color: '#4A6550' }}>{t.kawaBody}</p>
          <a
            href={kawaHref('quick_quiz_result_badminton')}
            target="_blank"
            rel="noopener"
            onClick={() => track('click_kawabado_referral', { placement: 'quick_quiz_result_badminton', lang })}
            className={BTN}
            style={btn('#1a3a2a')}
          >
            {t.kawaCta}
          </a>
        </Block>
      </section>
    );
  }

  if (entry === 'beginner') {
    const anchor = TODAY_MOVE[ability].more.beginner;
    return (
      <section aria-label="next">
        <h2 className="text-lg font-bold mb-3" style={{ color: '#1C2A1E' }}>{t.begTitle}</h2>
        <Block no={t.no01beg} title={t.begBlock(t.beginnerSteps[ability])}>
          <p className="text-sm mb-3" style={{ color: '#4A6550' }}>{t.begBody(abilityLabel)}</p>
          <a href={langPath(anchor, lang)} onClick={cta('quick_result_beginner_step')} className={BTN} style={btn('#F59E0B')}>{t.begCta}</a>
        </Block>
        {lessonBlock}
        <Block no={t.no03beg} title={t.blogTitle}>
          <p className="text-sm mb-3" style={{ color: '#4A6550' }}>{t.blogBody}</p>
          <a href="/blog" onClick={cta('quick_result_blog')} className={BTN} style={btn('#2D8F4E')}>{t.blogCta}</a>
        </Block>
      </section>
    );
  }

  /* 入口が分からない（トップの診断など）→ ①動きを見る ②レッスン ③どちらの入口か選んでもらう */
  return (
    <section aria-label="next">
      <Block no={t.no01gen} title={t.genTitle}>
        <p className="text-sm mb-3" style={{ color: '#4A6550' }}>{t.genBody(abilityLabel)}</p>
        <a href={langPath('/animalflow.html', lang)} onClick={cta('quick_result_animalflow')} className={BTN} style={btn('#F59E0B')}>{t.genCta}</a>
      </Block>
      {lessonBlock}
      <Block no={t.no03gen} title={t.chooseTitle}>
        <div className="flex flex-col sm:flex-row gap-3">
          <a href={langPath('/badminton', lang)} onClick={cta('quick_result_to_badminton')} className={`${BTN} flex-1`} style={btn('#1a3a2a')}>{t.chooseBad}</a>
          <a href={langPath('/beginner', lang)} onClick={cta('quick_result_to_beginner')} className={`${BTN} flex-1`} style={btn('#2D8F4E')}>{t.chooseBeg}</a>
        </div>
      </Block>
      <KawabadoInvite placement="quick_quiz_result" />
    </section>
  );
}
