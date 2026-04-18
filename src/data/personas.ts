// BOCCA — 16の器（スキル性質）データ
// 4属性: 剛🔴 / 理🔵 / 和🟢 / 盾🟡
// 診断軸: E/I, S/N, T/F, J/P 各スコアへの寄与を定義

export interface SkillVessel {
  id: string;               // 内部ID
  name: string;             // 器の名称
  symbol: string;           // 絵文字シンボル
  attribute: 'power' | 'logic' | 'harmony' | 'shield'; // 4属性
  attributeEmoji: string;   // 属性絵文字
  description: string;      // 器の説明（ゲーム内テキスト）
  defaultName: string;      // 命名の例（初期値としてフォームに表示）
  typingHints: {            // この器を選ぶ人の傾向（初期選択時の診断）
    S?: number;             // +で S方向
    N?: number;             // +で N方向
    E?: number;             // +で E方向
    I?: number;             // +で I方向
    T?: number;             // +で T方向
    F?: number;             // +で F方向
    J?: number;             // +で J方向
    P?: number;             // +で P方向
  };
}

export interface CustomPersona {
  skillId: string;          // 対応するSkillVessel.id
  customName: string;       // プレイヤーが命名した名前
  isAlive: boolean;         // 生存状態
  debuffs: string[];        // 付与されているデバフ（'疲労'/'汚染'/'骨折'/'恐怖'/'重傷'/'瀕死'/'呪縛'/'永遠の苦痛'）
}

// 16の器
export const SKILL_VESSELS: SkillVessel[] = [
  {
    id: 'breakthrough',
    name: '突破',
    symbol: '⚔️',
    attribute: 'power',
    attributeEmoji: '🔴',
    description: '壁など存在しない。ただ前へ進む力。',
    defaultName: '野心',
    typingHints: { E: 1, T: 1 },
  },
  {
    id: 'guardian',
    name: '守護',
    symbol: '🛡️',
    attribute: 'shield',
    attributeEmoji: '🟡',
    description: '誰かを守ることで、自分の存在意義を見出す力。',
    defaultName: '家族',
    typingHints: { I: 1, F: 1, J: 1, S: 1 },
  },
  {
    id: 'analysis',
    name: '分析',
    symbol: '🔬',
    attribute: 'logic',
    attributeEmoji: '🔵',
    description: '全てを数値と構造に還元し、最適解を導き出す力。',
    defaultName: '理性',
    typingHints: { T: 1, N: 1, J: 1 },
  },
  {
    id: 'empathy',
    name: '共感',
    symbol: '🫀',
    attribute: 'harmony',
    attributeEmoji: '🟢',
    description: '他者の痛みをそのまま感じ取る力。それは才能か、呪いか。',
    defaultName: '友情',
    typingHints: { F: 1, I: 1 },
  },
  {
    id: 'charm',
    name: '魅惑',
    symbol: '🌹',
    attribute: 'harmony',
    attributeEmoji: '🟢',
    description: '言葉と存在で人を引き寄せ、思うままに動かす力。',
    defaultName: 'カリスマ',
    typingHints: { E: 1, F: 1, P: 1 },
  },
  {
    id: 'stealth',
    name: '隠密',
    symbol: '🌑',
    attribute: 'shield',
    attributeEmoji: '🟡',
    description: '気配を消し、影に溶け込む力。見られることへの恐怖の裏返し。',
    defaultName: '秘密',
    typingHints: { I: 1, T: 1, P: 1 },
  },
  {
    id: 'intuition',
    name: '直感',
    symbol: '⚡',
    attribute: 'power',
    attributeEmoji: '🔴',
    description: '論理を超えた直接的な知覚。答えが「分かる」という感覚。',
    defaultName: '本能',
    typingHints: { N: 1, P: 1 },
  },
  {
    id: 'creation',
    name: '創造',
    symbol: '✨',
    attribute: 'logic',
    attributeEmoji: '🔵',
    description: '無から何かを生み出す力。混沌の中に美と意味を見出す。',
    defaultName: '才能',
    typingHints: { N: 1, P: 1, F: 1 },
  },
  {
    id: 'authority',
    name: '権威',
    symbol: '👑',
    attribute: 'power',
    attributeEmoji: '🔴',
    description: '他者を従わせる圧倒的な力。恐れられることと愛されることは紙一重。',
    defaultName: '地位',
    typingHints: { E: 1, T: 1, J: 1 },
  },
  {
    id: 'calculation',
    name: '打算',
    symbol: '⚖️',
    attribute: 'logic',
    attributeEmoji: '🔵',
    description: '全ての行動の損得を計算し、利益を最大化する力。',
    defaultName: '財産',
    typingHints: { T: 1, J: 1, S: 1 },
  },
  {
    id: 'devotion',
    name: '献身',
    symbol: '🕯️',
    attribute: 'shield',
    attributeEmoji: '🟡',
    description: '自分を尽く捧げる力。美しい自己消耗の螺旋。',
    defaultName: '愛情',
    typingHints: { F: 1, J: 1, S: 1, I: 1 },
  },
  {
    id: 'madness',
    name: '狂気',
    symbol: '🌀',
    attribute: 'power',
    attributeEmoji: '🔴',
    description: '理性の檻を溶かし、常識の外側へ踏み出す力。',
    defaultName: '衝動',
    typingHints: { N: 1, P: 1, E: 1 },
  },
  {
    id: 'obsession',
    name: '執着',
    symbol: '🩸',
    attribute: 'harmony',
    attributeEmoji: '🟢',
    description: '手放せないものへの、狂おしいほどの固執。失うことへの最大の恐怖。',
    defaultName: '未練',
    typingHints: { F: 1, J: 1, I: 1 },
  },
  {
    id: 'endurance',
    name: '忍耐',
    symbol: '🗿',
    attribute: 'shield',
    attributeEmoji: '🟡',
    description: '全てを受け入れ、耐え続ける力。動かない岩は何も傷つけない。',
    defaultName: '尊厳',
    typingHints: { I: 1, S: 1, J: 1 },
  },
  {
    id: 'projection',
    name: '転嫁',
    symbol: '🎭',
    attribute: 'logic',
    attributeEmoji: '🔵',
    description: '自分の痛みや罪を他者へと押し付ける力。最も冷酷な生存本能。',
    defaultName: '正義',
    typingHints: { T: 1, E: 1, P: 1 },
  },
  {
    id: 'transcendence',
    name: '超越',
    symbol: '🌌',
    attribute: 'harmony',
    attributeEmoji: '🟢',
    description: '全てを超えた視点から世界を俯瞰する力。孤高の自由、あるいは孤独。',
    defaultName: '自由',
    typingHints: { N: 1, I: 1, P: 1 },
  },
];

// IDからSkillVesselを取得
export function getSkillById(id: string): SkillVessel | undefined {
  return SKILL_VESSELS.find(s => s.id === id);
}
