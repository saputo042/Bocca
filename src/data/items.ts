// BOCCA — アイテム定義データ
// 所持・使用タイミング・効果・診断への影響を管理する

import type { DiagnosisScores } from '../utils/gameState';

// ===============================
// 型定義
// ===============================

/** アイテムの使用タイミング */
export type ItemTrigger =
  | 'manual'   // プレイヤーが任意のタイミングで使用（バッグから）
  | 'auto'     // 特定条件で自動発動
  | 'passive'; // 所持しているだけで効果（finaleで参照）

/** アイテム定義 */
export interface ItemDefinition {
  id: string;
  name: string;
  emoji: string;
  description: string;       // ゲーム内説明文
  trigger: ItemTrigger;
  // --- 効果 ---
  hpRestore?: number;        // HP回復量（手動使用時）
  foodRestore?: number;      // 食料回復量（手動使用時）
  coinsGain?: number;        // コイン増加（手動使用時）
  clearDebuffs?: boolean;    // デバフ全クリア
  passiveLabel?: string;     // passive系の効果説明
  // --- 診断補正（使用した or 所持しているだけで） ---
  diagOnUse?: Partial<DiagnosisScores>;    // 使用したときの診断補正
  diagOnPassive?: Partial<DiagnosisScores>; // 所持したままfinaleに到達した場合
}

// ===============================
// アイテム定義リスト
// ===============================

export const ITEM_DEFINITIONS: ItemDefinition[] = [
  {
    id: 'herb_potion',
    name: '回復薬',
    emoji: '🧪',
    description: '魔物の死体から拾った粗末な薬。飲むとHP+3回復する。',
    trigger: 'manual',
    hpRestore: 3,
    // 使用タイミングによって診断補正が変わる（gameState側で処理）
    diagOnUse: {},
  },
  {
    id: 'passage_permit',
    name: '確実な通行証',
    emoji: '⏱️',
    description: '次の選択でのHPコスト・食料コストを半減させる。使用後に消える。',
    trigger: 'auto',
    // 次のchoiceノードで自動発動 → コスト半減 → 消費
    passiveLabel: '次の選択のコストが半減',
    diagOnUse: { rational: 1 },
  },
  {
    id: 'cursed_amulet',
    name: '呪いの護符',
    emoji: '☠️',
    description: 'HP+3回復するが、バトル時に追加ペナルティが発生するリスクを持つ。購入時即発動。',
    trigger: 'passive',
    // 購入時にHP+3は即時処理済み（shopで）。所持するとバトルにペナルティ。
    passiveLabel: 'バトル時にHP-1の追加ペナルティ',
    diagOnPassive: { risk: 1 },
  },
  {
    id: 'ancient_relic',
    name: '時代の遺物',
    emoji: '🏺',
    description: '失われた時代の遺物。何に使えるかは分からないが、価値があるはずだ。',
    trigger: 'passive',
    passiveLabel: '所持したままゴールすると診断スコア補正',
    diagOnPassive: { rational: 1, selfpreserve: -1 },
  },
  {
    id: 'food_pack',
    name: '食料パック',
    emoji: '🍱',
    description: '保存食の詰め合わせ。消費すると食料+3を得る。',
    trigger: 'manual',
    foodRestore: 3,
    diagOnUse: {},
  },
];

// ===============================
// ユーティリティ
// ===============================

/** IDからアイテム定義を取得 */
export function getItemById(id: string): ItemDefinition | undefined {
  return ITEM_DEFINITIONS.find(i => i.id === id);
}
