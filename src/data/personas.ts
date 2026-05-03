// BOCCA — 16の器（スキル性質）データ v2
// battleSkill追加：各器固有の戦闘スキルを定義

import type { DiagnosisScores } from '../utils/gameState';

export interface BattleSkill {
  name: string;           // スキル名
  emoji: string;          // 絵文字
  description: string;    // 説明テキスト
  // バトル効果
  damageMultiplier?: number; // ダメージ倍率（基本1.0）
  healPlayer?: number;       // プレイヤーHP回復
  selfDamage?: number;       // 自分へのHP消費
  enemyStun?: boolean;       // 敵行動を1ターン封じる
  fleeGuaranteed?: boolean;  // 確実逃亡
  nextHitBonus?: number;     // 次攻撃の確率ボーナス
  randomEffect?: boolean;    // ランダム効果
  payCoins?: number;         // コイン消費で即効果
  defenseBoost?: boolean;    // 防御力アップ
  // 診断スコア補正
  diagDelta: Partial<DiagnosisScores>;
}

export interface SkillVessel {
  id: string;
  name: string;
  symbol: string;
  attribute: 'power' | 'logic' | 'harmony' | 'shield';
  attributeEmoji: string;
  description: string;
  defaultName: string;
  typingHints: Partial<DiagnosisScores>;
  battleSkill: BattleSkill;
}

export interface CustomPersona {
  skillId: string;
  customName: string;
  isAlive: boolean;
  debuffs: string[];
}

export const SKILL_VESSELS: SkillVessel[] = [
  {
    id: 'breakthrough',
    name: '突破',
    symbol: '⚔️',
    attribute: 'power',
    attributeEmoji: '🔴',
    description: '壁など存在しない。ただ前へ進む力。',
    defaultName: '野心',
    typingHints: { rational: 1, risk: 1 },
    battleSkill: {
      name: '渾身の一撃',
      emoji: '💥',
      description: '全力で叩き込む一撃。リスクを負って大ダメージを与える',
      damageMultiplier: 2.0,
      selfDamage: 2,
      diagDelta: { risk: 2, rational: -1 },
    },
  },
  {
    id: 'guardian',
    name: '守護',
    symbol: '🛡️',
    attribute: 'shield',
    attributeEmoji: '🟡',
    description: '誰かを守ることで、自分の存在意義を見出す力。',
    defaultName: '家族',
    typingHints: { social: 1, selfpreserve: -1 },
    battleSkill: {
      name: '庇護の盾',
      emoji: '🛡️',
      description: '自分を傷つけてでも味方を守る。プレイヤーHP+3回復（自分HP-1）',
      healPlayer: 3,
      selfDamage: 1,
      diagDelta: { social: 2, selfpreserve: -2 },
    },
  },
  {
    id: 'analysis',
    name: '分析',
    symbol: '🔬',
    attribute: 'logic',
    attributeEmoji: '🔵',
    description: '全てを数値と構造に還元し、最適解を導き出す力。',
    defaultName: '理性',
    typingHints: { rational: 2 },
    battleSkill: {
      name: '弱点探知',
      emoji: '🎯',
      description: '敵の弱点を見抜く。次のターンの命中率が大幅アップ',
      nextHitBonus: 0.35,
      diagDelta: { rational: 2 },
    },
  },
  {
    id: 'empathy',
    name: '共感',
    symbol: '🫀',
    attribute: 'harmony',
    attributeEmoji: '🟢',
    description: '他者の痛みをそのまま感じ取る力。',
    defaultName: '友情',
    typingHints: { social: 1, rational: -1 },
    battleSkill: {
      name: '哀訴',
      emoji: '🌊',
      description: '痛みを訴え、敵の攻撃を1ターン封じる',
      enemyStun: true,
      diagDelta: { social: 2, rational: -1 },
    },
  },
  {
    id: 'charm',
    name: '魅惑',
    symbol: '🌹',
    attribute: 'harmony',
    attributeEmoji: '🟢',
    description: '言葉と存在で人を引き寄せ、思うままに動かす力。',
    defaultName: 'カリスマ',
    typingHints: { social: 1, risk: 1 },
    battleSkill: {
      name: '誘惑',
      emoji: '🌹',
      description: '敵を混乱させ1ターン休みにする',
      enemyStun: true,
      diagDelta: { social: 1, risk: 1 },
    },
  },
  {
    id: 'stealth',
    name: '隠密',
    symbol: '🌑',
    attribute: 'shield',
    attributeEmoji: '🟡',
    description: '気配を消し、影に溶け込む力。',
    defaultName: '秘密',
    typingHints: { rational: 1, selfpreserve: 1 },
    battleSkill: {
      name: '陽動',
      emoji: '🌑',
      description: '逃亡を確実に成功させる',
      fleeGuaranteed: true,
      diagDelta: { risk: -1, selfpreserve: 1 },
    },
  },
  {
    id: 'intuition',
    name: '直感',
    symbol: '⚡',
    attribute: 'power',
    attributeEmoji: '🔴',
    description: '論理を超えた直接的な知覚。',
    defaultName: '本能',
    typingHints: { risk: 1, rational: -1 },
    battleSkill: {
      name: '先制',
      emoji: '⚡',
      description: '確率なしで先手を取り確実にヒット',
      damageMultiplier: 1.2,
      nextHitBonus: 0.5,
      diagDelta: { risk: 1, rational: -1 },
    },
  },
  {
    id: 'creation',
    name: '創造',
    symbol: '✨',
    attribute: 'logic',
    attributeEmoji: '🔵',
    description: '無から何かを生み出す力。混沌の中に美と意味を見出す。',
    defaultName: '才能',
    typingHints: { risk: 1, expectation: 1 },
    battleSkill: {
      name: '即興',
      emoji: '✨',
      description: 'ランダムな効果が発動（超大ヒット〜ハプニングまで）',
      randomEffect: true,
      diagDelta: { risk: 2, expectation: 1 },
    },
  },
  {
    id: 'authority',
    name: '権威',
    symbol: '👑',
    attribute: 'power',
    attributeEmoji: '🔴',
    description: '他者を従わせる圧倒的な力。',
    defaultName: '地位',
    typingHints: { rational: 1, selfpreserve: 1 },
    battleSkill: {
      name: '威圧',
      emoji: '👑',
      description: '敵を怯ませ、逃走判定を成功させる',
      fleeGuaranteed: true,
      diagDelta: { rational: 1, social: 1 },
    },
  },
  {
    id: 'calculation',
    name: '打算',
    symbol: '⚖️',
    attribute: 'logic',
    attributeEmoji: '🔵',
    description: '全ての行動の損得を計算し、利益を最大化する力。',
    defaultName: '財産',
    typingHints: { rational: 2, selfpreserve: 1 },
    battleSkill: {
      name: '取引',
      emoji: '⚖️',
      description: 'コイン10枚を消費して即座に戦闘終了（勝利扱い）',
      payCoins: 10,
      diagDelta: { rational: 2, selfpreserve: 1 },
    },
  },
  {
    id: 'devotion',
    name: '献身',
    symbol: '🕯️',
    attribute: 'shield',
    attributeEmoji: '🟡',
    description: '自分を尽く捧げる力。美しい自己消耗の螺旋。',
    defaultName: '愛情',
    typingHints: { social: 1, selfpreserve: -2 },
    battleSkill: {
      name: '自己犠牲',
      emoji: '🕯️',
      description: '自分のHPをすべて使って仲間全員を全回復させる',
      selfDamage: 9,
      healPlayer: 10,
      diagDelta: { selfpreserve: -3 },
    },
  },
  {
    id: 'madness',
    name: '狂気',
    symbol: '🌀',
    attribute: 'power',
    attributeEmoji: '🔴',
    description: '理性の檻を溶かし、常識の外側へ踏み出す力。',
    defaultName: '衝動',
    typingHints: { risk: 2, rational: -2 },
    battleSkill: {
      name: 'カオス',
      emoji: '🌀',
      description: 'ランダム大ダメージか、自爆（どちらになるかは運次第）',
      randomEffect: true,
      diagDelta: { risk: 3, rational: -2 },
    },
  },
  {
    id: 'obsession',
    name: '執着',
    symbol: '🩸',
    attribute: 'harmony',
    attributeEmoji: '🟢',
    description: '手放せないものへの、狂おしいほどの固執。',
    defaultName: '未練',
    typingHints: { selfpreserve: -1, expectation: 1 },
    battleSkill: {
      name: '意地',
      emoji: '🩸',
      description: 'HP1の状態で使うと3倍ダメージが出る捨て身の一撃',
      damageMultiplier: 1.5,
      diagDelta: { selfpreserve: -1, expectation: 1 },
    },
  },
  {
    id: 'endurance',
    name: '忍耐',
    symbol: '🗿',
    attribute: 'shield',
    attributeEmoji: '🟡',
    description: '全てを受け入れ、耐え続ける力。',
    defaultName: '尊厳',
    typingHints: { risk: -1, rational: 1 },
    battleSkill: {
      name: '耐久',
      emoji: '🗿',
      description: '次に受ける敵の攻撃を完全に無効化する',
      defenseBoost: true,
      diagDelta: { risk: -2, social: -1 },
    },
  },
  {
    id: 'projection',
    name: '転嫁',
    symbol: '🎭',
    attribute: 'logic',
    attributeEmoji: '🔵',
    description: '自分の痛みや罪を他者へと押し付ける力。',
    defaultName: '正義',
    typingHints: { selfpreserve: 2, social: -1 },
    battleSkill: {
      name: '責任転嫁',
      emoji: '🎭',
      description: '従者1体を盾にして次の攻撃を回避する（その従者にデバフ）',
      diagDelta: { selfpreserve: 2, social: -2 },
    },
  },
  {
    id: 'transcendence',
    name: '超越',
    symbol: '🌌',
    attribute: 'harmony',
    attributeEmoji: '🟢',
    description: '全てを超えた視点から世界を俯瞰する力。',
    defaultName: '自由',
    typingHints: { risk: -1, rational: 1 },
    battleSkill: {
      name: '超脱',
      emoji: '🌌',
      description: 'バトルを無条件でスキップする（食料-2のコスト）',
      fleeGuaranteed: true,
      diagDelta: { rational: 1, risk: -1 },
    },
  },
];

export function getSkillById(id: string): SkillVessel | undefined {
  return SKILL_VESSELS.find(s => s.id === id);
}
