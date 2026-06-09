export type Ability = 'strength' | 'endurance' | 'speed' | 'flexibility' | 'coordination';

export interface Question {
  id: string;
  text: string;
  ability: Ability;
  reversed: boolean;
}

export const questions: Question[] = [
  // 【筋力 Strength】12問
  { id: 'q01', text: '重い荷物を運ぶとき、率先して持つ方だ', ability: 'strength', reversed: false },
  { id: 'q02', text: '腕立て伏せや懸垂など、自分の体重を支える動きは得意だ', ability: 'strength', reversed: false },
  { id: 'q03', text: '力仕事を頼まれると、体力的に不安を感じる', ability: 'strength', reversed: true },
  { id: 'q04', text: '踏ん張りが必要な場面で、体が安定していると感じる', ability: 'strength', reversed: false },
  { id: 'q05', text: '重いものを押したり引いたりするとき、力負けしない自信がある', ability: 'strength', reversed: false },
  { id: 'q06', text: '体幹が弱いと感じる場面がよくある', ability: 'strength', reversed: true },
  { id: 'q07', text: '筋肉に力を入れたとき、しっかり固まる感覚がある', ability: 'strength', reversed: false },
  { id: 'q08', text: 'スクワットや壁押しなど、踏ん張る動きをすると膝や腰が先に疲れる', ability: 'strength', reversed: true },
  { id: 'q09', text: '何かを支えたり固定したりする役割が、自然と自分に回ってくる', ability: 'strength', reversed: false },
  { id: 'q10', text: '腕や脚に力を入れても、すぐプルプルしてしまう', ability: 'strength', reversed: true },
  { id: 'q11', text: '友人から「力持ちだね」と言われたことがある', ability: 'strength', reversed: false },
  { id: 'q12', text: '体幹トレーニングをすると、他の人より耐える時間が長い方だ', ability: 'strength', reversed: false },

  // 【持久力 Endurance】12問
  { id: 'q13', text: '長時間歩いたり動き続けたりしても、あまり疲れを感じない', ability: 'endurance', reversed: false },
  { id: 'q14', text: 'マラソンや登山など、長時間かけて行う運動が得意だ', ability: 'endurance', reversed: false },
  { id: 'q15', text: '少し動いただけで息が上がってしまう', ability: 'endurance', reversed: true },
  { id: 'q16', text: '運動の後半になっても、ペースを落とさずに動き続けられる', ability: 'endurance', reversed: false },
  { id: 'q17', text: '一度動き始めると、長時間でも集中力が途切れない', ability: 'endurance', reversed: false },
  { id: 'q18', text: 'スタミナが続かず、途中でペースダウンしてしまうことが多い', ability: 'endurance', reversed: true },
  { id: 'q19', text: '旅行先で1日中歩き回っても、翌日元気に動ける方だ', ability: 'endurance', reversed: false },
  { id: 'q20', text: '運動中に「もう限界」と感じるのが、他の人より早いと思う', ability: 'endurance', reversed: true },
  { id: 'q21', text: '疲れていても「もう少し続けよう」と思える粘り強さがある', ability: 'endurance', reversed: false },
  { id: 'q22', text: '同じ動きを繰り返し続けることが苦にならない', ability: 'endurance', reversed: false },
  { id: 'q23', text: '長時間の練習や作業の後半になると、集中力と体力が急激に落ちる', ability: 'endurance', reversed: true },
  { id: 'q24', text: '体力勝負になると、最終的に自分が残る方だと思う', ability: 'endurance', reversed: false },

  // 【スピード Speed】12問
  { id: 'q25', text: '何かが飛んできたとき、反射的に避けられる方だ', ability: 'speed', reversed: false },
  { id: 'q26', text: 'スポーツや運動で、素早い動き出しが得意だ', ability: 'speed', reversed: false },
  { id: 'q27', text: '動き始めるまでに時間がかかる方だ', ability: 'speed', reversed: true },
  { id: 'q28', text: '短距離走やダッシュは、同年代と比べて速い方だと思う', ability: 'speed', reversed: false },
  { id: 'q29', text: '急な方向転換や切り返しの動きが、体に染みついている感覚がある', ability: 'speed', reversed: false },
  { id: 'q30', text: '素早く動こうとすると、体がついてこない感じがする', ability: 'speed', reversed: true },
  { id: 'q31', text: 'リズムに合わせて素早くステップを踏むような動きが得意だ', ability: 'speed', reversed: false },
  { id: 'q32', text: '瞬間的な判断と動作が必要な場面で、出遅れることが多い', ability: 'speed', reversed: true },
  { id: 'q33', text: '「反応が速いね」と言われたことがある', ability: 'speed', reversed: false },
  { id: 'q34', text: '動作の切り替えが速く、次の動きにすぐ移れる', ability: 'speed', reversed: false },
  { id: 'q35', text: '速く動こうとすると、フォームが崩れてしまう', ability: 'speed', reversed: true },
  { id: 'q36', text: '短時間で爆発的に力を出す動きが得意だ', ability: 'speed', reversed: false },

  // 【柔軟性 Flexibility】12問
  { id: 'q37', text: '前屈したとき、手が床に届く', ability: 'flexibility', reversed: false },
  { id: 'q38', text: '股関節が柔らかく、開脚や深いスクワットが楽にできる', ability: 'flexibility', reversed: false },
  { id: 'q39', text: '肩や首が常にこっていて、可動域が狭いと感じる', ability: 'flexibility', reversed: true },
  { id: 'q40', text: '背骨をしなやかに動かせる感覚がある', ability: 'flexibility', reversed: false },
  { id: 'q41', text: 'ストレッチをすると、他の人より体が柔らかいと感じる', ability: 'flexibility', reversed: false },
  { id: 'q42', text: '深くしゃがむと、かかとが浮いてしまう', ability: 'flexibility', reversed: true },
  { id: 'q43', text: '朝起きたとき、体のこわばりがすぐにほぐれる', ability: 'flexibility', reversed: false },
  { id: 'q44', text: '体が硬くて、思うような姿勢が取れないことがある', ability: 'flexibility', reversed: true },
  { id: 'q45', text: 'ヨガやストレッチで、インストラクターに「柔らかいですね」と言われたことがある', ability: 'flexibility', reversed: false },
  { id: 'q46', text: '長時間同じ姿勢でいると、体が固まって動かしにくくなる', ability: 'flexibility', reversed: true },
  { id: 'q47', text: '手首や足首など、細かい関節も自由に動かせる感覚がある', ability: 'flexibility', reversed: false },
  { id: 'q48', text: '体をひねったり反らしたりする動きに、抵抗感がない', ability: 'flexibility', reversed: false },

  // 【調整力 Coordination】12問
  { id: 'q49', text: '初めて見たダンスやエクササイズを、すぐに真似できる方だ', ability: 'coordination', reversed: false },
  { id: 'q50', text: '右手と左手で別々の動きを同時にするのが、比較的得意だ', ability: 'coordination', reversed: false },
  { id: 'q51', text: '手と足を別々に動かすような複雑な動きになると、混乱してしまう', ability: 'coordination', reversed: true },
  { id: 'q52', text: 'バランスボードや片足立ちなど、バランスを保つ動きが得意だ', ability: 'coordination', reversed: false },
  { id: 'q53', text: 'リズムに乗って全身を動かすことが自然にできる', ability: 'coordination', reversed: false },
  { id: 'q54', text: '運動中に手足がバラバラになってしまうことがよくある', ability: 'coordination', reversed: true },
  { id: 'q55', text: '新しいスポーツや運動を始めると、コツをつかむのが早い方だ', ability: 'coordination', reversed: false },
  { id: 'q56', text: '体の各部位を連動させて動かすことが苦手だと感じる', ability: 'coordination', reversed: true },
  { id: 'q57', text: '目で見た動きを体で再現するのが得意だ', ability: 'coordination', reversed: false },
  { id: 'q58', text: '複数の動作を組み合わせたとき、全体的にスムーズに動ける', ability: 'coordination', reversed: false },
  { id: 'q59', text: 'リズムに乗って体を動かすのが苦手で、拍子がずれてしまう', ability: 'coordination', reversed: true },
  { id: 'q60', text: '体の重心移動を意識しながら動くことができる', ability: 'coordination', reversed: false },
];
