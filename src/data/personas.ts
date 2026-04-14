// BOCCAゲーム 12体のペルソナデータ

export interface Persona {
  id: string;
  name: string;
  subtitle: string;        // サブタイトル（象徴）
  symbol: string;          // 絵文字シンボル
  description: string;     // 短い説明文
  positive: string;        // 光の側面
  negative: string;        // 影の側面
  archetype: string;       // 心理アーキタイプ
  color: string;           // テーマカラー
  bgGradient: string;      // カードグラデーション
}

export const PERSONAS: Persona[] = [
  {
    id: 'sovereign',
    name: '支配者',
    subtitle: '王冠を被った亡霊',
    symbol: '👑',
    description: 'かつて全てを手にしていた。今もそれが当然だと信じている。',
    positive: '統率力・決断力・カリスマ',
    negative: '傲慢・支配欲・孤独への恐怖',
    archetype: 'The Ruler',
    color: '#C9A227',
    bgGradient: 'linear-gradient(135deg, #1a0a00 0%, #3d2200 50%, #1a0a00 100%)',
  },
  {
    id: 'wanderer',
    name: '放浪者',
    subtitle: '地図を持たない旅人',
    symbol: '🌫️',
    description: 'どこへでも行けると言い聞かせながら、どこへも帰れないことを知っている。',
    positive: '自由・適応力・好奇心',
    negative: '逃避・コミットメント恐怖・根無し草',
    archetype: 'The Explorer',
    color: '#7B9E87',
    bgGradient: 'linear-gradient(135deg, #001a0d 0%, #003322 50%, #001a0d 100%)',
  },
  {
    id: 'oracle',
    name: '預言者',
    subtitle: '見えすぎる眼を持つ者',
    symbol: '👁️',
    description: '全てが見える。だから全てが怖い。',
    positive: '洞察力・直感・真実追求',
    negative: '過度な批判・不信・孤立',
    archetype: 'The Sage',
    color: '#8B5CF6',
    bgGradient: 'linear-gradient(135deg, #0d0023 0%, #1a0040 50%, #0d0023 100%)',
  },
  {
    id: 'martyr',
    name: '殉教者',
    subtitle: '傷を勲章にする者',
    symbol: '🩸',
    description: '与え続けることで、己の価値を証明しようとしている。',
    positive: '献身・共感・無私',
    negative: '自己犠牲・被害者意識・依存関係',
    archetype: 'The Caregiver',
    color: '#DC2626',
    bgGradient: 'linear-gradient(135deg, #1a0000 0%, #3d0000 50%, #1a0000 100%)',
  },
  {
    id: 'trickster',
    name: '道化師',
    subtitle: '笑いで痛みを隠す者',
    symbol: '🃏',
    description: '笑わせることで、自分が笑われるのを先手を打っている。',
    positive: '創造性・ユーモア・柔軟性',
    negative: '責任回避・自己卑下・深さの欠如',
    archetype: 'The Jester',
    color: '#F59E0B',
    bgGradient: 'linear-gradient(135deg, #1a1000 0%, #3d2800 50%, #1a1000 100%)',
  },
  {
    id: 'phantom',
    name: '幻影',
    subtitle: '存在を消すことに長けた者',
    symbol: '🌑',
    description: '誰にも気づかれないことを望みながら、誰かに見つけてほしいと泣いている。',
    positive: '観察力・繊細さ・深い思考',
    negative: '自己消去・回避・表現恐怖',
    archetype: 'The Shadow',
    color: '#6B7280',
    bgGradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
  },
  {
    id: 'destroyer',
    name: '破壊者',
    subtitle: '燃やした後に泣く者',
    symbol: '🔥',
    description: '壊すことしか知らなかった。でも本当は、もっとうまく愛したかった。',
    positive: '変革力・正直さ・純粋さ',
    negative: '衝動性・破壊衝動・後悔の連鎖',
    archetype: 'The Destroyer',
    color: '#EF4444',
    bgGradient: 'linear-gradient(135deg, #1a0500 0%, #3d0a00 50%, #1a0500 100%)',
  },
  {
    id: 'architect',
    name: '設計者',
    subtitle: '完璧な檻を建てた者',
    symbol: '⚙️',
    description: '全てを計画した。ただし、感情を設計図に入れ忘れた。',
    positive: '論理・計画性・信頼性',
    negative: '感情の抑圧・完璧主義・支配欲',
    archetype: 'The Ruler/Creator',
    color: '#3B82F6',
    bgGradient: 'linear-gradient(135deg, #000d1a 0%, #001a33 50%, #000d1a 100%)',
  },
  {
    id: 'child',
    name: '永遠の子供',
    subtitle: '成長を拒んだ者',
    symbol: '🌸',
    description: 'あの頃のまま止まっている。傷ついたあの瞬間から動けないでいる。',
    positive: '純粋さ・感受性・想像力',
    negative: '依存・現実逃避・脆弱性の過剰',
    archetype: 'The Innocent',
    color: '#F472B6',
    bgGradient: 'linear-gradient(135deg, #1a0010 0%, #33001f 50%, #1a0010 100%)',
  },
  {
    id: 'guardian',
    name: '番人',
    subtitle: '門を守り、自分を閉じ込めた者',
    symbol: '🗡️',
    description: '誰も傷つけないために、硬くなった。でも誰も触れられなくなった。',
    positive: '忠誠心・責任感・保護本能',
    negative: '過度な防御・感情の封鎖・孤独',
    archetype: 'The Guardian',
    color: '#10B981',
    bgGradient: 'linear-gradient(135deg, #001a10 0%, #003322 50%, #001a10 100%)',
  },
  {
    id: 'lover',
    name: '恋慕者',
    subtitle: '愛しすぎて溺れた者',
    symbol: '💔',
    description: '全てを愛した。愛することで、全てを失った。',
    positive: '情熱・共鳴・美への感受性',
    negative: '執着・嫉妬・自己喪失',
    archetype: 'The Lover',
    color: '#BE185D',
    bgGradient: 'linear-gradient(135deg, #1a0015 0%, #3d002b 50%, #1a0015 100%)',
  },
  {
    id: 'alchemist',
    name: '錬金術師',
    subtitle: '変容を求めて迷い続ける者',
    symbol: '⚗️',
    description: '全てを変えられると信じた。変えるべきは自分だったことに気づかなかった。',
    positive: '変容力・創造性・探求心',
    negative: '現実逃避・不満・永遠の未完成',
    archetype: 'The Magician',
    color: '#7C3AED',
    bgGradient: 'linear-gradient(135deg, #0d001a 0%, #1a0033 50%, #0d001a 100%)',
  },
];

// ペルソナIDからペルソナを取得
export function getPersonaById(id: string): Persona | undefined {
  return PERSONAS.find(p => p.id === id);
}
