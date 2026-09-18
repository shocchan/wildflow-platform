import type { Entry } from '../utils/entry';
import type { Lang } from '../i18n/lang';
import type { QuickQuestion } from './quickQuizQuestions';

/**
 * 入口（バド／はじめて／その他）× 言語（ja／zh）ごとの「言い回し」（2026-09-18/19）。
 *
 * ⚠️ 診断ロジックには触らない。質問の id・ability・reversed は quickQuizQuestions.ts のまま。
 *    ここで差し替えるのは text（見せる文）だけなので、5軸の配点・順位づけは変わらない。
 */

export interface EntryCopy {
  quizName: string;
  quizHeading: string;
  resultHeading: string;
  axesWord: string;
  leadTitle: string;
  leadBody: (label: string) => string;
  leadDone: (label: string) => string;
}

const JA: Record<Entry, EntryCopy> = {
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

const ZH: Record<Entry, EntryCopy> = {
  badminton: {
    quizName: '羽毛球体能检查 — 约1分钟',
    quizHeading: '在球场上最先累的是哪里？10道题找出来',
    resultHeading: '在球场上最先撑不住的是',
    axesWord: '5项能力',
    leadTitle: '📩 每周接收1个后续动作（可选）',
    leadBody: (label) => `对「${label}」有效的地板动作不止一个。留下邮箱，每周发1个该项能力的动作，附30秒视频。练前5分钟A4打印版也会马上发给你。`,
    leadDone: (label) => `每周会发1个对「${label}」有效的动作。先发A4打印版的链接。`,
  },
  beginner: {
    quizName: '零基础身体检查 — 约1分钟',
    quizHeading: '你的身体，最容易进步的是哪里？',
    resultHeading: '你的身体里，最容易进步的是',
    axesWord: '5项能力',
    leadTitle: '📩 每周接收1个后续动作（可选）',
    leadBody: (label) => `每周发1个提升「${label}」的地板动作，附30秒视频。给一个人坚持不下去的人，最轻量的陪伴。`,
    leadDone: (label) => `每周会发1个提升「${label}」的动作。`,
  },
  general: {
    quizName: '快速测试 — 约1分钟',
    quizHeading: '你的身体里，最能提升的是哪一项？',
    resultHeading: '你最能提升的能力是',
    axesWord: '5项能力',
    leadTitle: '📩 接收这个结果的后续（可选）',
    leadBody: (label) => `留下邮箱，每周发1个提升「${label}」的地板动作，附30秒视频。不填也可以直接看结果。`,
    leadDone: (label) => `每周会发1个提升「${label}」的动作。`,
  },
};

export const ENTRY_COPY: Record<Lang, Record<Entry, EntryCopy>> = { ja: JA, zh: ZH };

/** 質問文の差し替え表。id と軸の対応は元のまま（qq01=筋力・正、qq02=筋力・逆 …） */
const Q: Record<Lang, Partial<Record<Entry, Record<string, string>>>> = {
  ja: {
    badminton: {
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
    },
    beginner: {
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
    },
  },
  zh: {
    badminton: {
      qq01: '扣杀后的落地，能稳稳站住',
      qq02: '保持低重心准备姿势时，大腿发抖、腰慢慢直起来',
      qq03: '第3局也能保持和第1局一样低的准备姿势',
      qq04: '多拍拉长以后，腿会在中途停下来',
      qq05: '别人说我对来球的第一步很快',
      qq06: '正手和反手的切换，会慢半拍',
      qq07: '反手高远球或绕头击球时，手臂能自然举到最高',
      qq08: '练习第二天，肩膀或腰很沉',
      qq09: '进入击球点的位置，基本是对的',
      qq10: '单脚跨步时身体晃，击球点不稳',
    },
    beginner: {
      qq01: '提重物对我来说还算轻松',
      qq02: '四足支撑时，手臂很快就发抖',
      qq03: '走很久也不太累',
      qq04: '爬一点楼梯就喘',
      qq05: '我的临场反应算快的',
      qq06: '想快速动的时候，感觉身体跟不上',
      qq07: '前屈时，手能碰到地板',
      qq08: '肩膀和腰总是僵，觉得自己身体很硬',
      qq09: '第一次看到的动作，能马上模仿',
      qq10: '手和脚分开动的时候，会乱',
    },
    general: {
      qq01: '搬重物时，我通常是主动去搬的那个',
      qq02: '做俯卧撑或支撑身体的动作时，很快就发抖',
      qq03: '长时间活动也不太觉得累',
      qq04: '稍微动一下就喘',
      qq05: '别人说过我反应快',
      qq06: '想快速动的时候，感觉身体跟不上',
      qq07: '前屈时，手能碰到地板',
      qq08: '肩膀和腰总是僵，觉得自己身体很硬',
      qq09: '第一次看到的舞蹈或动作，能马上模仿',
      qq10: '手脚容易乱，不擅长复杂动作',
    },
  },
};

export function questionsForEntry(entry: Entry, base: QuickQuestion[], lang: Lang = 'ja'): QuickQuestion[] {
  const map = Q[lang][entry];
  if (!map) return base;
  return base.map(q => (map[q.id] ? { ...q, text: map[q.id] } : q));
}

/** 結果ページ「今日やる1動作」。軸ごとに1つだけ。動画は撮影後に URL を入れる（空なら準備中表示） */
export interface TodayMove {
  name: string;
  jp: Record<Lang, string>;
  how: Record<Lang, string[]>;
  /** YouTube / Vimeo の URL または ID。空文字なら「動画準備中」 */
  video: string;
  /** public/img/shocchan/<image>.webp（ChatGPT生成のしょっちゃんイラスト） */
  image: string;
  /** /badminton・/beginner の該当箇所 */
  more: Record<Entry, string>;
}

export const TODAY_MOVE: Record<QuickQuestion['ability'], TodayMove> = {
  strength: {
    name: 'Static Beast', jp: { ja: 'スタティック・ビースト', zh: '静态野兽式' },
    how: {
      ja: ['四つん這い。手は肩の真下、膝は腰の真下', '膝を床から2〜3cm浮かせ、指先で床を押す', '目線は下、お腹に軽く力。10秒 × 3回'],
      zh: ['四足支撑。手在肩正下方，膝在髋正下方', '膝盖离地2〜3cm，指尖用力压地', '视线向下，腹部轻轻收紧。10秒 × 3次'],
    },
    video: '', image: 'beast',
    more: { badminton: '/badminton#symptoms', beginner: '/beginner#t2', general: '/animalflow.html#t2' },
  },
  endurance: {
    name: 'Static Crab', jp: { ja: 'スタティック・クラブ', zh: '静态螃蟹式' },
    how: {
      ja: ['仰向けで手と足をつき、お尻を床から2〜3cm浮かせる', '胸を天井に持ち上げ続ける。腰だけで反らない', '目線は少し上。10秒 × 3回'],
      zh: ['仰面，手脚撑地，臀部离地2〜3cm', '胸口持续向天花板顶。不要只用腰去反弓', '视线略向上。10秒 × 3次'],
    },
    video: '', image: 'crab',
    more: { badminton: '/badminton#symptoms', beginner: '/beginner#t4', general: '/animalflow.html#t4' },
  },
  speed: {
    name: 'Underswitch', jp: { ja: 'アンダースウィッチ', zh: '下穿转换' },
    how: {
      ja: ['四つん這い（ビースト）から、片足を反対の手の下にくぐらせる', 'そのまま仰向けの四足（クラブ）へ向きを変える', '左右交互に、ゆっくり5回ずつ'],
      zh: ['从四足支撑（野兽式）开始，一条腿从对侧手的下方穿过', '顺势转成仰面四足（螃蟹式）', '左右交替，慢慢各做5次'],
    },
    video: '', image: 'underswitch',
    more: { badminton: '/badminton#symptoms', beginner: '/beginner#t5', general: '/animalflow.html#t5' },
  },
  flexibility: {
    name: 'Crab Reach', jp: { ja: 'クラブ・リーチ', zh: '螃蟹伸展' },
    how: {
      ja: ['仰向けの四足（クラブ）から、片手を頭上後方へ伸ばす', '腰ではなく胸で開く。お尻は持ち上げたまま', '目線は伸ばした手の先。左右 × 3回'],
      zh: ['从仰面四足（螃蟹式）开始，一只手向头顶后方伸展', '用胸打开，不是用腰。臀部保持抬起', '视线看伸出的手。左右 × 3次'],
    },
    video: '', image: 'crab-reach',
    more: { badminton: '/badminton#symptoms', beginner: '/beginner#t3', general: '/animalflow.html#t3' },
  },
  coordination: {
    name: 'Beast Reach', jp: { ja: 'ビースト・リーチ', zh: '野兽伸展' },
    how: {
      ja: ['四つん這い（ビースト）から、対角の手と足を同時に前へ伸ばす', '残る3点で床を押し続け、骨盤を傾けない', '左右 × 5回、ゆっくり'],
      zh: ['从四足支撑（野兽式）开始，对角的手和脚同时向前伸', '剩下的支点持续压地，骨盆不要倾斜', '左右 × 5次，慢慢做'],
    },
    video: '', image: 'beast-reach',
    more: { badminton: '/badminton#symptoms', beginner: '/beginner#t6', general: '/animalflow.html#t6' },
  },
};
