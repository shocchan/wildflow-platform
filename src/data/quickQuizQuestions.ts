export interface QuickQuestion {
  id: string;
  text: string;
  ability: 'strength' | 'endurance' | 'speed' | 'flexibility' | 'coordination';
  reversed: boolean;
}

export const quickQuestions: QuickQuestion[] = [
  {
    id: 'qq01',
    text: '重い荷物を運ぶとき、率先して持つ方だ',
    ability: 'strength',
    reversed: false,
  },
  {
    id: 'qq02',
    text: '腕立て伏せや体を支える動きをすると、すぐプルプルしてしまう',
    ability: 'strength',
    reversed: true,
  },
  {
    id: 'qq03',
    text: '長時間動き続けても、あまり疲れを感じない方だ',
    ability: 'endurance',
    reversed: false,
  },
  {
    id: 'qq04',
    text: '少し動いただけで息が上がってしまう',
    ability: 'endurance',
    reversed: true,
  },
  {
    id: 'qq05',
    text: '反応が速いと言われたことがある',
    ability: 'speed',
    reversed: false,
  },
  {
    id: 'qq06',
    text: '素早く動こうとすると、体がついてこない感じがする',
    ability: 'speed',
    reversed: true,
  },
  {
    id: 'qq07',
    text: '前屈したとき、手が床に届く',
    ability: 'flexibility',
    reversed: false,
  },
  {
    id: 'qq08',
    text: '肩や腰がいつもこっていて、体が硬いと感じる',
    ability: 'flexibility',
    reversed: true,
  },
  {
    id: 'qq09',
    text: '初めて見たダンスや動きを、すぐに真似できる方だ',
    ability: 'coordination',
    reversed: false,
  },
  {
    id: 'qq10',
    text: '手足がバラバラになってしまい、複雑な動きが苦手だ',
    ability: 'coordination',
    reversed: true,
  },
];
