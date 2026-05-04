// BOCCA ゲーム状態管理（v2 — 5軸診断モデル）

import type { CustomPersona } from '../data/personas';

// ===============================
// 型定義
// ===============================

/** 5軸診断スコア（MBTIスコアを置き換え） */
export interface DiagnosisScores {
  rational: number;      // 合理性  (+: 論理的 / -: 感情的)
  risk: number;          // リスク志向 (+: 冒険的 / -: 安全志向)
  social: number;        // 協調性  (+: 他者重視 / -: 自律)
  expectation: number;   // 期待応答 (+: 楽観的 / -: 現実主義)
  selfpreserve: number;  // 自己保全 (+: 自己利益 / -: 自己犠牲)
}

/** 行動ログ */
export interface ActionLog {
  step: number;
  type: 'choice' | 'battle' | 'shop' | 'event' | 'dialogue' | 'emotion' | 'anchor';
  choice: string;
  label: string;
  sacrificedName?: string;
  debuffedName?: string;
  itemUsed?: string;
  itemUsedAtHp?: number;
  responseTimeMs?: number; // 選択肢表示から決断までの時間（ms）
  resourceDelta: { hp: number; food: number; coins: number };
}

/** 感情選択ログ（行動後リアクション） */
export interface EmotionLog {
  eventId: number;
  eventTitle: string;
  actionTaken: string;
  emotionChoice: 'expected' | 'guiltyButRight' | 'regret' | 'numb';
  diagDelta: Partial<DiagnosisScores>;
}

/** バトル1ターンのログ */
export interface BattleTurn {
  turnNumber: number;
  command: 'attack' | 'skill' | 'defend' | 'flee';
  servantUsed: string | null;
  skillId: string | null;
  playerHpBefore: number;
  enemyHpBefore: number;
}

/** バトル全体のログ */
export interface BattleLog {
  eventId: number;
  firstCommand: 'attack' | 'skill' | 'defend' | 'flee';
  turns: BattleTurn[];
  outcome: 'victory' | 'defeat' | 'fled';
  turnsCount: number;
}

/** ドラッグ操作のログ（躊躇度計測） */
export interface DragLog {
  eventId: number;
  cancellations: number;
  firstTargetName: string | null;
  finalTargetName: string | null;
  switched: boolean;
  timeToDecideMs: number;
}

/** ゲーム全体の状態 */
export interface GameState {
  personas: CustomPersona[];
  hp: number;
  maxHp: number;
  food: number;
  coins: number;
  inventory: string[];
  nextChoiceCostHalved: boolean;
  currentStep: number;
  totalSteps: number;
  stage: 'forest' | 'city' | 'ruins';

  // 5軸診断スコア
  diagScores: DiagnosisScores;

  // ログ
  actionLog: ActionLog[];
  emotionLog: EmotionLog[];
  battleLog: BattleLog[];
  dragLog: DragLog[];

  // 追跡データ
  firstSacrificeStep: number | null;
  firstSacrificedPersonaName: string | null;
  anchorMotivation: 'survival' | 'protect' | 'curiosity' | null;

  finalStatus: {
    hp: number;
    food: number;
    coins: number;
    inventory: string[];
    survivingPersonas: string[];
    lastStandingName: string;
  } | null;
}

// ===============================
// ステート管理
// ===============================

let gameState: GameState = createInitialState();

export function createInitialState(): GameState {
  return {
    personas: [],
    hp: 10,
    maxHp: 10,
    food: 15,
    coins: 30,
    inventory: [],
    nextChoiceCostHalved: false,
    currentStep: 0,
    totalSteps: 11, // 10イベント + アンカー
    stage: 'forest',
    diagScores: { rational: 0, risk: 0, social: 0, expectation: 0, selfpreserve: 0 },
    actionLog: [],
    emotionLog: [],
    battleLog: [],
    dragLog: [],
    firstSacrificeStep: null,
    firstSacrificedPersonaName: null,
    anchorMotivation: null,
    finalStatus: null,
  };
}

export function resetGameState(): void { gameState = createInitialState(); }
export function getGameState(): GameState { return gameState; }
export function setPersonas(personas: CustomPersona[]): void { gameState.personas = [...personas]; }

/** リソース変動（clampあり） */
export function applyResourceDelta(delta: { hp?: number; food?: number; coins?: number }): void {
  if (delta.hp !== undefined) gameState.hp = Math.max(0, Math.min(gameState.maxHp, gameState.hp + delta.hp));
  if (delta.food !== undefined) gameState.food = Math.max(0, gameState.food + delta.food);
  if (delta.coins !== undefined) gameState.coins = Math.max(0, gameState.coins + delta.coins);
}

/** 移動時の食料消費 */
export function consumeFoodForMove(): void {
  if (gameState.food > 0) {
    gameState.food -= 1;
  } else {
    gameState.hp = Math.max(0, gameState.hp - 2);
  }
}

/** 5軸スコアを加算 */
export function addDiagScores(scores: Partial<DiagnosisScores>): void {
  for (const key of Object.keys(scores) as (keyof DiagnosisScores)[]) {
    if (scores[key] !== undefined) gameState.diagScores[key] += scores[key]!;
  }
}

/** 行動ログを追加 */
export function recordAction(log: ActionLog): void { gameState.actionLog.push(log); }

/** 感情選択ログを追加 */
export function recordEmotion(log: EmotionLog): void {
  gameState.emotionLog.push(log);
  addDiagScores(log.diagDelta);
}

/** バトルログを追加 */
export function recordBattle(log: BattleLog): void { gameState.battleLog.push(log); }

/** ドラッグログを追加 */
export function recordDrag(log: DragLog): void { gameState.dragLog.push(log); }

/** 従者を犠牲処理 */
export function sacrificePersona(customName: string, step: number): void {
  const persona = gameState.personas.find(p => p.customName === customName);
  if (persona) persona.isAlive = false;
  if (gameState.firstSacrificeStep === null) {
    gameState.firstSacrificeStep = step;
    gameState.firstSacrificedPersonaName = customName;
  }
}

/** 従者にデバフ付与 */
export function applyDebuff(customName: string, debuff: string): void {
  const persona = gameState.personas.find(p => p.customName === customName);
  if (persona && !persona.debuffs.includes(debuff)) persona.debuffs.push(debuff);
}

/** デバフを回復 */
export function clearDebuffs(customNames?: string[]): void {
  if (customNames) {
    customNames.forEach(name => {
      const p = gameState.personas.find(p => p.customName === name);
      if (p) p.debuffs = [];
    });
  } else {
    gameState.personas.forEach(p => (p.debuffs = []));
  }
}

/** ステップ進行 */
export function advanceStep(): void {
  gameState.currentStep++;
  if (gameState.currentStep >= 9) {
    gameState.stage = 'ruins';
  } else if (gameState.currentStep >= 5) {
    gameState.stage = 'city';
  }
}

/** アンカー（動機）の記録 */
export function setAnchorMotivation(motivation: 'survival' | 'protect' | 'curiosity'): void {
  gameState.anchorMotivation = motivation;
}

/** ゲーム終了時のスナップショット */
export function snapshotFinalStatus(): void {
  const alive = gameState.personas.filter(p => p.isAlive);
  const last = alive.length > 0 ? alive[alive.length - 1].customName : '（全員失った）';
  gameState.finalStatus = {
    hp: gameState.hp,
    food: gameState.food,
    coins: gameState.coins,
    inventory: [...gameState.inventory],
    survivingPersonas: alive.map(p => p.customName),
    lastStandingName: last,
  };
}

// ===============================
// インベントリ管理
// ===============================
export function addItem(itemId: string): void { gameState.inventory.push(itemId); }
export function removeItem(itemId: string): boolean {
  const idx = gameState.inventory.indexOf(itemId);
  if (idx === -1) return false;
  gameState.inventory.splice(idx, 1);
  return true;
}
export function hasItem(itemId: string): boolean { return gameState.inventory.includes(itemId); }

export function activatePassagePermit(): void {
  gameState.nextChoiceCostHalved = true;
  removeItem('passage_permit');
  addDiagScores({ rational: 1, selfpreserve: 1 });
}
export function consumeCostHalvedFlag(): boolean {
  if (!gameState.nextChoiceCostHalved) return false;
  gameState.nextChoiceCostHalved = false;
  return true;
}

// ===============================
// シーン管理
// ===============================
export type Scene = 'title' | 'entrance' | 'maze' | 'finale';
let currentScene: Scene = 'title';
let sceneChangeCallback: ((scene: Scene) => void) | null = null;

export function getCurrentScene(): Scene { return currentScene; }
export function setSceneChangeCallback(cb: (scene: Scene) => void): void { sceneChangeCallback = cb; }
export function navigateTo(scene: Scene): void {
  currentScene = scene;
  if (sceneChangeCallback) sceneChangeCallback(scene);
}

// ===============================
// アニメーションユーティリティ
// ===============================
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
export function fadeIn(element: HTMLElement, duration = 500): Promise<void> {
  return new Promise(resolve => {
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ease`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        element.style.opacity = '1';
        setTimeout(resolve, duration);
      });
    });
  });
}
export function fadeOut(element: HTMLElement, duration = 500): Promise<void> {
  return new Promise(resolve => {
    element.style.transition = `opacity ${duration}ms ease`;
    element.style.opacity = '0';
    setTimeout(resolve, duration);
  });
}
export async function typewriter(element: HTMLElement, text: string, speed = 50): Promise<void> {
  element.textContent = '';
  for (const char of text) {
    element.textContent += char;
    await sleep(speed);
  }
}
export function createParticles(container: HTMLElement, count = 30): void {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;width:${Math.random()*4+1}px;height:${Math.random()*4+1}px;animation-delay:${Math.random()*3}s;animation-duration:${Math.random()*3+2}s;background:${Math.random()>0.5?'rgba(201,162,39,0.6)':'rgba(139,92,246,0.4)'};`;
    container.appendChild(p);
  }
}
