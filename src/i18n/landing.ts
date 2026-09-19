import type { Lang } from './lang';

/**
 * 新トップ（2026-09-19「爆発的に飛躍」版）の文言。ja / zh。
 * 効果の断定はしない。実績数値・受講者の声は入れない（素材が無いものは作らない）。
 */
export interface Move {
  key: 'wrist' | 'beast' | 'crab' | 'crab-reach' | 'underswitch' | 'beast-reach';
  en: string;
  name: string;
  tag: string;
  steps: string[];
  court: string;
  daily: string;
  /** 秒×回。ChallengeTimer が使う */
  dose: { sec: number; reps: number; label: string };
  axis: 'strength' | 'endurance' | 'speed' | 'flexibility' | 'coordination';
}

const ja = {
  hero: {
    eyebrow: 'ANIMAL FLOW — 川口・蕨',
    line1: '床に手をつく。',
    line2: 'それだけで、',
    line3: '体は目を覚ます。',
    lead: '道具ゼロ、床1枚、1日1分。四つん這いから始まる全身運動 Animal Flow を、バドミントンをする人にも、運動がはじめての人にも。',
    ctaBad: '🏸 バドミントンをしている', ctaBadSub: '膝・腰・肩の「詰まり」を床で見直す',
    ctaBeg: '🌱 運動は苦手・はじめて', ctaBegSub: 'まず1分、四つん這いで止まるだけ',
    tryNow: '▶ いま30秒、やってみる', scroll: 'スクロールして体験',
    langNote: '日本語 / 中文',
  },
  marquee: ['Static Beast', 'Crab Reach', 'Underswitch', 'Beast Reach', 'Traveling Crab', 'Scorpion Reach', 'Ape Reach', 'Wave Unload', 'Loaded Beast', 'Side Kickthrough'],
  promises: {
    title: '始めるのに、いらないもの。',
    items: [
      { big: '0', unit: '個', label: '道具', body: 'マシンもウェイトもマットもいらない。体育館の隅でも、自宅でも。' },
      { big: '1', unit: '枚', label: '床', body: '寝転がれるスペースがあれば、それが練習場所。' },
      { big: '1', unit: '分', label: '今日の最小単位', body: '四つん這いで10秒×3回。それで「今日やった」に数えていい。' },
      { big: '0', unit: '年', label: '運動経験', body: 'キツければやさしく、慣れたら強く。同じ動きを自分の強さで。' },
    ],
  },
  explorer: {
    eyebrow: 'EXPLORE THE MOVES',
    title: '動きを、触ってみる。',
    lead: '6つの基本の動き。タップすると、しょっちゃんがやって見せます。そのまま30秒、床でどうぞ。',
    courtLabel: '🏸 コートでは', dailyLabel: '🛋️ ふだんの体では',
    start: (n: string) => `▶ ${n} を30秒やってみる`,
    stepsLabel: 'やり方',
  },
  moves: [
    {
      key: 'wrist', en: 'Wrist Mobilizations', name: '手首くるくる', tag: '準備', axis: 'flexibility',
      steps: ['四つん這いで手を床につく。指先は前', '体重を前後・左右にゆっくり揺らす', '手の甲を床につけて逆方向にも'],
      court: 'グリップを握る前の前腕の準備。', daily: 'デスクワークとスマホで固まった手首をほどく。',
      dose: { sec: 30, reps: 1, label: '30秒' },
    },
    {
      key: 'beast', en: 'Static Beast', name: 'スタティック・ビースト', tag: 'スイッチ', axis: 'strength',
      steps: ['四つん這い。手は肩の真下、膝は腰の真下', '膝を床から2〜3cm浮かせ、指先で床を押す', '目線は下、お腹に軽く力。10秒'],
      court: '低い構えと着地で、膝ではなく股関節で床を押す。', daily: '止まるだけでお腹と背中が目を覚ます。いちばん効く1分。',
      dose: { sec: 10, reps: 3, label: '10秒 × 3' },
    },
    {
      key: 'crab', en: 'Static Crab', name: 'スタティック・クラブ', tag: 'スイッチ', axis: 'endurance',
      steps: ['仰向けで手と足をつき、お尻を2〜3cm浮かせる', '胸を天井に持ち上げ続ける', '腰だけで反らない。10秒'],
      court: 'ラリー後半に構えを支える「後ろ側」の筋を起こす。', daily: '猫背で眠っていた背中側のスイッチ。',
      dose: { sec: 10, reps: 3, label: '10秒 × 3' },
    },
    {
      key: 'crab-reach', en: 'Crab Reach', name: 'クラブ・リーチ', tag: '伸ばす', axis: 'flexibility',
      steps: ['クラブから片手を頭上後方へ伸ばす', '腰ではなく胸で開く。お尻は浮かせたまま', '目線は手の先。左右3回'],
      court: 'ハイバックの前に、腕ではなく胸から振れる可動域を。', daily: '1日中前傾だった胸を、いちばん大きく開く。',
      dose: { sec: 5, reps: 6, label: '左右 × 3' },
    },
    {
      key: 'underswitch', en: 'Underswitch', name: 'アンダースウィッチ', tag: 'つなげる', axis: 'speed',
      steps: ['ビーストから片足を反対の手の下にくぐらせる', 'そのままクラブへ向きを変える', '左右交互に、ゆっくり5回'],
      court: 'フォア⇄バックの切り替え。腰のひねり戻しのリズム。', daily: '「くるっと回る」が気持ちいい、いちばん遊べる動き。',
      dose: { sec: 6, reps: 5, label: '左右 × 5' },
    },
    {
      key: 'beast-reach', en: 'Beast Reach', name: 'ビースト・リーチ', tag: '流れる', axis: 'coordination',
      steps: ['ビーストから対角の手と足を同時に前へ', '残る3点で床を押し続ける', '骨盤を傾けない。左右5回'],
      court: '片足で踏み込んでもブレない体幹。打点が安定する。', daily: '脳と体を同時に使う。終わったあと頭がすっきりする理由。',
      dose: { sec: 6, reps: 5, label: '左右 × 5' },
    },
  ] as Move[],
  timer: {
    eyebrow: '30-SECOND CHALLENGE',
    title: '読むより、床。',
    lead: 'このページを閉じる前に、30秒だけ。スマホを床に置いて、しょっちゃんと同じ姿勢に。',
    pick: '動きを選ぶ', ready: 'スタート', go: 'GO', rest: '休憩', done: 'できた！', again: 'もう一度', stop: 'やめる',
    set: (i: number, n: number) => `${i} / ${n} セット`,
    doneBody: 'それが今日の分。明日もこの1分から。伸びしろを知りたければ、下の10問へ。',
    caution: '痛みがある部位は動かさないでください。治療ではなく、体の使い方の練習です。',
  },
  lanes: {
    eyebrow: 'WHO IS IT FOR',
    title: 'コートの人にも、床が初めての人にも。',
    bad: {
      title: '🏸 バドミントンをしている',
      body: 'スマッシュのあと膝が笑う。ラリー後半で構えが高くなる。ハイバックで肩が詰まる。コートで起きる「詰まり」10個を、床の動きに置き換えました。',
      bullets: ['5つの力 × コートの場面 対応表', '症状セルフチェック（保存なし）', '練習前5分ルーティン（A4印刷）'],
      cta: 'バド向けページへ →',
    },
    beg: {
      title: '🌱 運動は苦手・はじめて',
      body: 'ジムは続かない。体が硬い。走るのはしんどい。それでも「なんとなく動きたい」なら、床に手をついて動物みたいに動くところから。',
      bullets: ['まず1分：四つん這いで止まるだけ', '6つのステップ（動画枠つき）', '結果に合わせた「今日の1動作」'],
      cta: 'はじめての方向けページへ →',
    },
  },
  axes: {
    eyebrow: 'FIND YOUR EDGE',
    title: '5つの力のうち、いま一番伸ばしやすいのは？',
    lead: '筋力・持久力・スピード・柔軟性・調整力。10問・約1分・登録不要で、伸びしろの軸と「今日やる1動作」が出ます。',
    cta: '🐾 10問で診断する',
    note: 'バド向け・はじめて向けで、質問の言い回しが変わります',
    badQuiz: '🏸 バド体力チェック', begQuiz: '🌱 はじめての身体チェック',
  },
  story: {
    eyebrow: 'WHY WILDFLOW',
    quote: '上海で出会った「動物の動き」に、24万円を即決した。妻に連れられて行った謎の運動教室で、インストラクターの一言が頭の中で何かをつないだ。「これを日本に持ち帰らなければ」。',
    who: 'しょっちゃん',
    role: '日本語教師 × 野生身体研究家 ／ wildflow・kawabado（川口・蕨）',
    read: 'ストーリーを読む →', about: 'Animal Flow の歴史と魅力 →',
  },
  latest: { title: '最新記事', all: 'すべて見る →' },
  bottom: {
    title: 'あなたの野生、まだ眠っていませんか？',
    body: '10問・約1分で、5つの力のうち今いちばん伸ばせるところが分かります。結果の画面に、今日やる1動作まで。',
    cta: '🐾 10問で簡単診断（無料）', note: '10問 / 約1分 / 会員登録不要',
    lessons: '川口・蕨のレッスンを見る', kawabado: 'kawabado（バド活動）を見る ↗',
  },
};

export type Landing = typeof ja;

const zh: Landing = {
  hero: {
    eyebrow: 'ANIMAL FLOW — 川口・蕨',
    line1: '手撑地板。',
    line2: '仅此而已，',
    line3: '身体就醒了。',
    lead: '零器械、一块地板、每天1分钟。从四足支撑开始的全身运动 Animal Flow，给打羽毛球的你，也给刚开始运动的你。',
    ctaBad: '🏸 我打羽毛球', ctaBadSub: '在地板上重新审视膝盖・腰・肩的「卡点」',
    ctaBeg: '🌱 不擅长运动・零基础', ctaBegSub: '先1分钟，四足支撑静止就好',
    tryNow: '▶ 现在做30秒', scroll: '向下滚动体验',
    langNote: '日本語 / 中文',
  },
  marquee: ja.marquee,
  promises: {
    title: '开始，不需要这些。',
    items: [
      { big: '0', unit: '件', label: '器械', body: '不需要机器、哑铃、垫子。体育馆角落或家里都行。' },
      { big: '1', unit: '块', label: '地板', body: '有能躺下的空间，那就是训练场。' },
      { big: '1', unit: '分钟', label: '今天的最小单位', body: '四足支撑10秒×3次。这就可以算「今天练了」。' },
      { big: '0', unit: '年', label: '运动经验', body: '累了就放轻，熟了就加强。同样的动作按自己的强度。' },
    ],
  },
  explorer: {
    eyebrow: 'EXPLORE THE MOVES',
    title: '动作，摸一摸。',
    lead: '6个基本动作。点一下，翔酱做给你看。然后在地板上做30秒。',
    courtLabel: '🏸 在球场上', dailyLabel: '🛋️ 平时的身体',
    start: (n: string) => `▶ 做30秒 ${n}`,
    stepsLabel: '做法',
  },
  moves: [
    { key: 'wrist', en: 'Wrist Mobilizations', name: '手腕热身', tag: '准备', axis: 'flexibility',
      steps: ['四足支撑，手撑地，指尖朝前', '体重前后・左右慢慢晃', '手背贴地反方向也晃'],
      court: '握拍前的前臂准备。', daily: '松开办公和手机弄僵的手腕。', dose: { sec: 30, reps: 1, label: '30秒' } },
    { key: 'beast', en: 'Static Beast', name: '静态野兽式', tag: '开关', axis: 'strength',
      steps: ['四足支撑。手在肩正下方，膝在髋正下方', '膝盖离地2〜3cm，指尖压地', '视线向下，腹部轻收。10秒'],
      court: '低重心和落地时，用髋而不是膝盖压地。', daily: '只是静止，腹部和背部就醒了。最有效的1分钟。', dose: { sec: 10, reps: 3, label: '10秒 × 3' } },
    { key: 'crab', en: 'Static Crab', name: '静态螃蟹式', tag: '开关', axis: 'endurance',
      steps: ['仰面手脚撑地，臀部抬起2〜3cm', '胸口持续向天花板顶', '不要只用腰反弓。10秒'],
      court: '唤醒多拍后半段支撑姿势的「后侧」肌群。', daily: '驼背里沉睡的背侧开关。', dose: { sec: 10, reps: 3, label: '10秒 × 3' } },
    { key: 'crab-reach', en: 'Crab Reach', name: '螃蟹伸展', tag: '伸展', axis: 'flexibility',
      steps: ['从螃蟹式一只手伸向头顶后方', '用胸打开不是用腰。臀部保持抬起', '视线看手。左右3次'],
      court: '反手高远球之前，做出用胸而不是手臂挥的活动度。', daily: '把前倾了一整天的胸，最大幅度打开。', dose: { sec: 5, reps: 6, label: '左右 × 3' } },
    { key: 'underswitch', en: 'Underswitch', name: '下穿转换', tag: '连接', axis: 'speed',
      steps: ['从野兽式一条腿穿过对侧手下方', '顺势转成螃蟹式', '左右交替，慢慢5次'],
      court: '正反手切换。腰回转的节奏。', daily: '「转一圈」很爽，最好玩的动作。', dose: { sec: 6, reps: 5, label: '左右 × 5' } },
    { key: 'beast-reach', en: 'Beast Reach', name: '野兽伸展', tag: '流动', axis: 'coordination',
      steps: ['从野兽式对角手脚同时向前', '剩下3点持续压地', '骨盆不倾斜。左右5次'],
      court: '单脚跨步也不晃的核心。击球点稳定。', daily: '脑和身体同时用。做完头脑清爽的原因。', dose: { sec: 6, reps: 5, label: '左右 × 5' } },
  ],
  timer: {
    eyebrow: '30-SECOND CHALLENGE',
    title: '与其读，不如上地板。',
    lead: '关掉这一页之前，只要30秒。把手机放地上，做和翔酱一样的姿势。',
    pick: '选动作', ready: '开始', go: 'GO', rest: '休息', done: '做到了！', again: '再来一次', stop: '停止',
    set: (i: number, n: number) => `第 ${i} / ${n} 组`,
    doneBody: '这就是今天的份。明天也从这1分钟开始。想知道提升空间，做下面的10题。',
    caution: '有疼痛的部位不要动。这不是治疗，而是身体用法的练习。',
  },
  lanes: {
    eyebrow: 'WHO IS IT FOR',
    title: '给球场上的人，也给第一次上地板的人。',
    bad: {
      title: '🏸 我打羽毛球',
      body: '扣杀后膝盖发软。多拍后半段准备姿势变高。反手高远球时肩膀卡住。把球场上的10个「卡点」换成了地板动作。',
      bullets: ['5项能力 × 球场场景对照表', '卡点自测（不保存）', '练前5分钟例行动作（A4打印）'],
      cta: '去羽毛球专区 →',
    },
    beg: {
      title: '🌱 不擅长运动・零基础',
      body: '健身房坚持不了。身体硬。跑步太累。即便如此如果「总想动一动」，就从手撑地板像动物一样动开始。',
      bullets: ['先1分钟：四足支撑静止就好', '6个步骤（附视频位）', '按结果给出的「今天的1个动作」'],
      cta: '去零基础入门页 →',
    },
  },
  axes: {
    eyebrow: 'FIND YOUR EDGE',
    title: '5项能力里，现在最容易提升的是哪一项？',
    lead: '力量・耐力・速度・柔韧・协调。10题・约1分钟・无需注册，给出提升空间和「今天做的1个动作」。',
    cta: '🐾 做10题测试',
    note: '羽毛球方向・零基础方向的问题措辞不同',
    badQuiz: '🏸 羽毛球体能检查', begQuiz: '🌱 零基础身体检查',
  },
  story: {
    eyebrow: 'WHY WILDFLOW',
    quote: '在上海遇见「动物的动作」，当场投入了24万日元。被妻子带去的神秘运动教室里，教练的一句话在脑子里接通了什么。「必须把它带回日本」。',
    who: '翔酱',
    role: '日语教师 × 野性身体研究者 ／ wildflow・kawabado（川口・蕨）',
    read: '读故事 →', about: 'Animal Flow 的历史与魅力 →',
  },
  latest: { title: '最新文章', all: '查看全部 →' },
  bottom: {
    title: '你的野性，还在沉睡吗？',
    body: '10题・约1分钟，就能知道5项能力里现在最能提升的那一项。结果页面直接给出今天做的1个动作。',
    cta: '🐾 10题快速测试（免费）', note: '10题 / 约1分钟 / 无需注册',
    lessons: '查看川口・蕨的课程', kawabado: '查看 kawabado（羽毛球活动）↗',
  },
};

export const LANDING: Record<Lang, Landing> = { ja, zh };
