import type { ReactNode } from 'react';
import { track } from '../services/analytics';
import { KawabadoInvite } from './KawabadoInvite';
import { kawabadoActivityUrl } from '../config/site';
import type { ProductHealth } from '../services/productHealth';
import type { Entry } from '../utils/entry';

type Ability = 'strength' | 'endurance' | 'speed' | 'flexibility' | 'coordination';

/**
 * 10問診断の結果ページ「出口3ブロック」（2026-09-18 バドミントン・ピボット P0-4）。
 *
 * 入口（/badminton・/beginner・それ以外）ごとに、①今日できる一歩 ②レッスン ③仲間／次の入口 を出し分ける。
 * 診断ロジックと判定は触っていない。見せ方（出口）だけ。
 * ②は「実際に買えるものだけ案内する」G-3 の方針をそのまま引き継ぐ。
 */

/** 伸びしろの軸 → /badminton の対応表で示した床の動き */
const BADMINTON_MOVE: Record<Ability, { court: string; move: string }> = {
  strength:     { court: 'スマッシュ後の踏ん張り・低い構え',       move: 'Static Beast ／ Loaded Beast' },
  endurance:    { court: 'ラリー後半で足が止まる',                 move: 'Traveling Beast ／ Traveling Crab' },
  speed:        { court: 'フォア⇄バックの切り替え・一歩目',        move: 'Underswitch ／ Side Kickthrough' },
  flexibility:  { court: 'ハイバックで肩が詰まる・胸が開かない',   move: 'Ape Reach ／ Crab Reach ／ Scorpion Reach' },
  coordination: { court: '打点に入るのが半歩ずれる・片足でぐらつく', move: 'Beast Reach ／ Beast Flow' },
};

/** 伸びしろの軸 → /beginner の6ステップのどこから始めるか */
const BEGINNER_STEP: Record<Ability, { anchor: string; label: string }> = {
  strength:     { anchor: '#t2', label: '② 体の"スイッチ"を入れる（四つん這いで止まる）' },
  endurance:    { anchor: '#t4', label: '④ 動物みたいに歩く' },
  speed:        { anchor: '#t5', label: '⑤ 動きをつなげる' },
  flexibility:  { anchor: '#t3', label: '③ 気持ちよく、伸ばす' },
  coordination: { anchor: '#t6', label: '⑥ 流れるように動く' },
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
  const cta = (name: string) => () => track('click_primary_cta', { cta: name, entry, ability });

  /* ② レッスン：買えるものだけ案内する（既存 G-3 のロジックをそのまま） */
  const lessonBlock = (
    <Block no="02 ／ 一緒に動く" title="🎯 あなたに効くレッスン">
      <p className="text-sm font-bold mb-3" style={{ color: '#1C2A1E' }}>{lesson}</p>
      {health === null ? null : health.singleLessonBuyable ? (
        <a href="/lessons" onClick={cta('quick_result_lessons')} className={BTN} style={btn('#2D8F4E')}>
          開催予定のレッスンを見る（次回 {health.nextLessonDate}）→
        </a>
      ) : health.publishedPackages > 0 ? (
        <>
          <a href="/lessons/package" onClick={cta('quick_result_package')} className={BTN} style={btn('#D97706')}>
            日程の相談つきでフルパックに申し込む →
          </a>
          <p className="mt-2 text-sm" style={{ color: '#5a7a62' }}>
            いまは単発レッスンの開催予定がありません。フルパックは日程を相談しながら進められます。
          </p>
        </>
      ) : (
        <p className="text-sm" style={{ color: '#5a7a62' }}>
          いまは開催予定のレッスンがありません。
          <a href="/lessons" className="font-bold underline" style={{ color: '#2D8F4E' }}>次の開催の連絡を受け取る</a>
          か、
          <a href="/contact" className="font-bold underline" style={{ color: '#2D8F4E' }}>お問い合わせ</a>
          からどうぞ。
        </p>
      )}
      {ability === 'flexibility' && (
        <p className="mt-3 text-sm" style={{ color: '#4A6550' }}>
          🌿 <a href="/recovery" className="font-bold underline" style={{ color: '#2D8F4E' }}>/recovery のヨガ教室</a>もチェックしてみてください。
        </p>
      )}
    </Block>
  );

  if (entry === 'badminton') {
    const m = BADMINTON_MOVE[ability];
    return (
      <section aria-label="次の一歩">
        <h2 className="text-lg font-bold mb-3" style={{ color: '#1C2A1E' }}>🏸 バドミントンの体に戻すと</h2>
        <Block no="01 ／ 今日からできる床の動き" title={`「${abilityLabel}」が伸びしろ → コートでは「${m.court}」`}>
          <p className="text-sm mb-3" style={{ color: '#4A6550' }}>
            対応する床の動きは <strong style={{ color: '#1C2A1E' }}>{m.move}</strong>。
            練習前の5分に入れるところから。「治す」ではなく、負担が集まりにくい体の使い方を覚える練習です。
          </p>
          <a href="/badminton#axes" onClick={cta('quick_result_badminton_table')} className={BTN} style={btn('#F59E0B')}>
            5軸×コートの対応表を見る →
          </a>
        </Block>
        {lessonBlock}
        <Block no="03 ／ コートで会う" title="🏸 川口・蕨のバドミントン活動（kawabado）">
          <p className="text-sm mb-3" style={{ color: '#4A6550' }}>
            wildflowと同じしょっちゃんがやっている、初心者や1人参加の多いゆるい集まりです。床の動きは、コートで試してこそ。
          </p>
          <a
            href={kawabadoActivityUrl('quick_quiz_result_badminton')}
            target="_blank"
            rel="noopener"
            onClick={() => track('click_kawabado_referral', { placement: 'quick_quiz_result_badminton' })}
            className={BTN}
            style={btn('#1a3a2a')}
          >
            kawabado の通常活動を見る ↗
          </a>
        </Block>
      </section>
    );
  }

  if (entry === 'beginner') {
    const s = BEGINNER_STEP[ability];
    return (
      <section aria-label="次の一歩">
        <h2 className="text-lg font-bold mb-3" style={{ color: '#1C2A1E' }}>🌱 はじめての方の、次の一歩</h2>
        <Block no="01 ／ 今日の1分" title={`まずはここから：${s.label}`}>
          <p className="text-sm mb-3" style={{ color: '#4A6550' }}>
            「{abilityLabel}」が伸びしろなら、6つのステップのうちこの動きから。できない動きは飛ばして構いません。
          </p>
          <a href={`/beginner${s.anchor}`} onClick={cta('quick_result_beginner_step')} className={BTN} style={btn('#F59E0B')}>
            その動きを見る →
          </a>
        </Block>
        {lessonBlock}
        <Block no="03 ／ 読んで知る" title="📖 しょっちゃんのブログ">
          <p className="text-sm mb-3" style={{ color: '#4A6550' }}>
            上海で Animal Flow に出会った話や、体づくりのヒント。まずは読みものから、という方へ。
          </p>
          <a href="/blog" onClick={cta('quick_result_blog')} className={BTN} style={btn('#2D8F4E')}>
            ブログを読む →
          </a>
        </Block>
      </section>
    );
  }

  /* 入口が分からない（トップの診断など）→ ①動きを見る ②レッスン ③どちらの入口か選んでもらう */
  return (
    <section aria-label="次の一歩">
      <Block no="01 ／ 動きを見る" title="🐾 Animal Flow ってどんな動き？">
        <p className="text-sm mb-3" style={{ color: '#4A6550' }}>
          床さえあればできる6つのステップ。「{abilityLabel}」を伸ばす動きも、この中にあります。
        </p>
        <a href="/animalflow.html" onClick={cta('quick_result_animalflow')} className={BTN} style={btn('#F59E0B')}>
          6つのステップを見る →
        </a>
      </Block>
      {lessonBlock}
      <Block no="03 ／ あなたはどっち？" title="入口を選ぶと、もっと具体的になります">
        <div className="flex flex-col sm:flex-row gap-3">
          <a href="/badminton" onClick={cta('quick_result_to_badminton')} className={`${BTN} flex-1`} style={btn('#1a3a2a')}>
            🏸 バドミントンをしている
          </a>
          <a href="/beginner" onClick={cta('quick_result_to_beginner')} className={`${BTN} flex-1`} style={btn('#2D8F4E')}>
            🌱 運動は苦手・はじめて
          </a>
        </div>
      </Block>
      <KawabadoInvite placement="quick_quiz_result" lead="wildflowのレッスンは不定期開催です。「今週どこかで動きたい」なら、" />
    </section>
  );
}
