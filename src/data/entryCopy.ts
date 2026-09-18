import type { Entry } from '../utils/entry';
import type { QuickQuestion } from './quickQuizQuestions';

/**
 * 入口ごとの「言い回し」だけを差し替える（2026-09-18 ガラッと改善案）。
 *
 * ⚠️ 診断ロジックには触らない。質問の id・ability・reversed は quickQuizQuestions.ts のまま。
 *    ここで差し替えるのは text（見せる文）だけなので、5軸の配点・順位づけは変わらない。
 */

export interface EntryCopy {
  /** 診断の看板名（ヘッダーの小見出し・結果ページの小見出し） */
  quizName: string;
  /** 診断ページの見出し */
  quizHeading: string;
  /** 結果ページの見出し（「あなたが最も伸ばせる…」の位置） */
  resultHeading: string;
  /** 5軸の呼び方（「アビリティ」を内輪用語にしない） */
  axesWord: string;
  /** メール登録の見出しと理由 */
  leadTitle: string;
  leadBody: (label: string) => string;
  leadDone: (label: string) => string;
}

export const ENTRY_COPY: Record<Entry, EntryCopy> = {
  badminton: {
    quizName: 'バド体力チェック — 約1分',
    quizHeading: 'コートで先に疲れるのはどこ？10問で見つける',
    resultHeading: 'コートで先に音を上げるのは',
    axesWord: '5つの力',
    leadTitle: '📩 残りの動きを、毎週1本ずつ受け取る（任意）',
    leadBody: (label) => `「${label}」に効く床の動きは1つではありません。メールを入れておくと、その軸の動きを週1本、30秒の動画つきで送ります。練習前5分ルーティンの印刷用シート（A4）もすぐ届きます。`,
    leadDone: (label) => `「${label}」に効く動きを、週1本お送りします。まず印刷用シート（A4）のリンクを送ります。`,
  },
  beginner: {
    quizName: 'はじめての身体チェック — 約1分',
    quizHeading: 'あなたの体、いちばん伸びやすいのはどこ？',
    resultHeading: 'あなたの体で、いちばん伸びやすいのは',
    axesWord: '5つの力',
    leadTitle: '📩 続きの動きを、毎週1本ずつ受け取る（任意）',
    leadBody: (label) => `「${label}」を伸ばす床の動きを、週1本・30秒の動画つきで送ります。ひとりで続かない人向けの、いちばん軽い伴走です。`,
    leadDone: (label) => `「${label}」を伸ばす動きを、週1本お送りします。`,
  },
  general: {
    quizName: '簡易診断 — 約1分',
    quizHeading: 'あなたの体で、いちばん伸ばせる力はどれ？',
    resultHeading: 'あなたが最も伸ばせる力は',
    axesWord: '5つの力',
    leadTitle: '📩 この結果の続きを受け取る（任意）',
    leadBody: (label) => `メールアドレスを入れておくと、「${label}」を伸ばす床の動きを週1本・30秒の動画つきで送ります。入力しなくても結果はこのまま見られます。`,
    leadDone: (label) => `「${label}」を伸ばす動きを、週1本お送りします。`,
  },
};

/**
 * バド入口のときだけ質問文を差し替える。id と軸の対応は元のまま（qq01=筋力・正、qq02=筋力・逆 …）。
 * 「治る」等の効果表現は使わず、コートで起きる事実だけを聞く。
 */
const BADMINTON_QUESTION_TEXT: Record<string, string> = {
  qq01: 'スマッシュのあとの着地で、しっかり踏ん張れている',
  qq02: '低い構えを続けると、太ももが震えて腰が伸びてくる',
  qq03: '3ゲーム目でも、1ゲーム目と同じ高さで構えられる',
  qq04: 'ラリーが長くなると、途中で足が止まる',
  qq05: '相手の球に対して、一歩目が速いと言われる',
  qq06: 'フォアとバックの切り替えが、一拍遅れる',
  qq07: 'ハイバックやラウンド・ザ・ヘッドで、腕が自然に上まで上がる',
  qq08: '練習の翌日、肩や腰が重い',
  qq09: '打点に入る位置が、だいたい合っている',
  qq10: '片足で踏み込んだとき、体がぐらついて打点が安定しない',
};

const BEGINNER_QUESTION_TEXT: Record<string, string> = {
  qq01: '重い荷物を持つのは、わりと平気だ',
  qq02: '四つん這いで体を支えると、すぐ腕がプルプルする',
  qq03: '長く歩いても、あまり疲れない',
  qq04: '階段を少し上っただけで息が上がる',
  qq05: 'とっさの反応は速い方だ',
  qq06: '急いで動こうとすると、体が遅れてついてくる感じがある',
  qq07: '前屈で、手が床に届く',
  qq08: '肩や腰がいつもこっていて、体が硬いと思う',
  qq09: '初めて見た動きを、すぐ真似できる',
  qq10: '手と足を別々に動かすと、こんがらがる',
};

export function questionsForEntry(entry: Entry, base: QuickQuestion[]): QuickQuestion[] {
  const map = entry === 'badminton' ? BADMINTON_QUESTION_TEXT : entry === 'beginner' ? BEGINNER_QUESTION_TEXT : null;
  if (!map) return base;
  return base.map(q => (map[q.id] ? { ...q, text: map[q.id] } : q));
}

/** 結果ページ「今日やる1動作」。軸ごとに1つだけ。動画は撮影後に URL を入れる（空なら準備中表示） */
export interface TodayMove {
  name: string;
  jp: string;
  how: string[];
  /** YouTube / Vimeo の URL または ID。空文字なら「動画準備中」 */
  video: string;
  /** /badminton・/beginner の該当箇所 */
  more: Record<Entry, string>;
}

export const TODAY_MOVE: Record<QuickQuestion['ability'], TodayMove> = {
  strength: {
    name: 'Static Beast', jp: 'スタティック・ビースト',
    how: ['四つん這い。手は肩の真下、膝は腰の真下', '膝を床から2〜3cm浮かせ、指先で床を押す', '目線は下、お腹に軽く力。10秒 × 3回'],
    video: '',
    more: { badminton: '/badminton#symptoms', beginner: '/beginner#t2', general: '/animalflow.html#t2' },
  },
  endurance: {
    name: 'Static Crab', jp: 'スタティック・クラブ',
    how: ['仰向けで手と足をつき、お尻を床から2〜3cm浮かせる', '胸を天井に持ち上げ続ける。腰だけで反らない', '目線は少し上。10秒 × 3回'],
    video: '',
    more: { badminton: '/badminton#symptoms', beginner: '/beginner#t4', general: '/animalflow.html#t4' },
  },
  speed: {
    name: 'Underswitch', jp: 'アンダースウィッチ',
    how: ['四つん這い（ビースト）から、片足を反対の手の下にくぐらせる', 'そのまま仰向けの四足（クラブ）へ向きを変える', '左右交互に、ゆっくり5回ずつ'],
    video: '',
    more: { badminton: '/badminton#symptoms', beginner: '/beginner#t5', general: '/animalflow.html#t5' },
  },
  flexibility: {
    name: 'Crab Reach', jp: 'クラブ・リーチ',
    how: ['仰向けの四足（クラブ）から、片手を頭上後方へ伸ばす', '腰ではなく胸で開く。お尻は持ち上げたまま', '目線は伸ばした手の先。左右 × 3回'],
    video: '',
    more: { badminton: '/badminton#symptoms', beginner: '/beginner#t3', general: '/animalflow.html#t3' },
  },
  coordination: {
    name: 'Beast Reach', jp: 'ビースト・リーチ',
    how: ['四つん這い（ビースト）から、対角の手と足を同時に前へ伸ばす', '残る3点で床を押し続け、骨盤を傾けない', '左右 × 5回、ゆっくり'],
    video: '',
    more: { badminton: '/badminton#symptoms', beginner: '/beginner#t6', general: '/animalflow.html#t6' },
  },
};
