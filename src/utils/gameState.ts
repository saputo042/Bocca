// BOCCA ゲーム状態管理ユーティリティ（完全拡張版）

import type { CustomPersona } from '../data/personas';

// ===============================
// 型定義
// ===============================

// MBTIスコアカウンター
export interface MBTIScores {
  E: number; // 外向
  I: number; // 内向
  S: number; // 感覚
  N: number; // 直観
  T: number; // 思考
  F: number; // 感情
  J: number; // 判断
  P: number; // 知覚
}

// ゲーム内行動ログ
export interface ActionLog {
  step: number;            // ステップ番号
  type: 'choice' | 'battle' | 'shop' | 'event' | 'dialogue';
  choice: string;          // 選んだ選択肢ID
  label: string;           // 選択肢のラベル（人間が読める形）
  sacrificedName?: string; // 犠牲にした従者のカスタム名（B選択時）
  debuffedName?: string;   // デバフを受けた従者のカスタム名（A選択時）
  resourceDelta: {         // このアクションによるリソース変動
    hp: number;
    food: number;
    coins: number;
  };
}

// ゲーム全体の状態
export interface GameState {
  // 従者（カスタム命名済み）
  personas: CustomPersona[];

  // リソース
  hp: number;
  maxHp: number;
  food: number;
  coins: number;

  // 進行
  currentStep: number;     // 現在のステップ（0始まり）
  totalSteps: number;      // 総ステップ数
  stage: 'forest' | 'city' | 'ruins'; // 現在のステージ

  // 診断ポイント（等価重み付け）
  mbti: MBTIScores;

  // 行動ログ（診断の根拠）
  actionLog: ActionLog[];

  // 最初にBを選んだタイミング（Breaking Point）
  firstSacrificeStep: number | null;
  firstSacrificedPersonaName: string | null;

  // アンカー（遺跡ステージで「動機は何か？」と聞いた時の答え）
  anchorMotivation: 'survival' | 'protect' | 'curiosity' | null;

  // クリア時の最終ステータス（ゲーム終了時にスナップショット）
  finalStatus: {
    hp: number;
    food: number;
    coins: number;
    survivingPersonas: string[]; // 生き残った従者のカスタム名
    lastStandingName: string;    // 最後まで残った（or 最後に犠牲にされた）従者名
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
    food: 6,
    coins: 30,
    currentStep: 0,
    totalSteps: 26,
    stage: 'forest',
    mbti: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
    actionLog: [],
    firstSacrificeStep: null,
    firstSacrificedPersonaName: null,
    anchorMotivation: null,
    finalStatus: null,
  };
}

export function resetGameState(): void {
  gameState = createInitialState();
}

export function getGameState(): GameState {
  return gameState;
}

// 従者のセット
export function setPersonas(personas: CustomPersona[]): void {
  gameState.personas = [...personas];
}

// リソースの変動（clampあり）
export function applyResourceDelta(delta: { hp?: number; food?: number; coins?: number }): void {
  if (delta.hp !== undefined) {
    gameState.hp = Math.max(0, Math.min(gameState.maxHp, gameState.hp + delta.hp));
  }
  if (delta.food !== undefined) {
    gameState.food = Math.max(0, gameState.food + delta.food);
  }
  if (delta.coins !== undefined) {
    gameState.coins = Math.max(0, gameState.coins + delta.coins);
  }
}

// 移動時の食料消費（1ステップ進むたびに呼ぶ）
export function consumeFoodForMove(): void {
  if (gameState.food > 0) {
    gameState.food -= 1;
  } else {
    // 食料ゼロ → HPに大ダメージ
    gameState.hp = Math.max(0, gameState.hp - 3);
  }
}

// MBTIポイントを加算
export function addMBTIPoints(scores: Partial<MBTIScores>): void {
  for (const key of Object.keys(scores) as (keyof MBTIScores)[]) {
    if (scores[key] !== undefined) {
      gameState.mbti[key] += scores[key]!;
    }
  }
}

// 行動ログを追加
export function recordAction(log: ActionLog): void {
  gameState.actionLog.push(log);
}

// 従者を犠牲（ロスト）処理
export function sacrificePersona(customName: string, step: number): void {
  const persona = gameState.personas.find(p => p.customName === customName);
  if (persona) {
    persona.isAlive = false;
  }
  // Breaking Pointの記録（初回のみ）
  if (gameState.firstSacrificeStep === null) {
    gameState.firstSacrificeStep = step;
    gameState.firstSacrificedPersonaName = customName;
  }
}

// 従者にデバフ付与
export function applyDebuff(customName: string, debuff: string): void {
  const persona = gameState.personas.find(p => p.customName === customName);
  if (persona) {
    if (!persona.debuffs.includes(debuff)) {
      persona.debuffs.push(debuff);
    }
  }
}

// デバフを回復
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

// ステップ進行
export function advanceStep(): void {
  gameState.currentStep++;
  // ステージ遷移
  if (gameState.currentStep >= 17) {
    gameState.stage = 'ruins';
  } else if (gameState.currentStep >= 8) {
    gameState.stage = 'city';
  }
}

// アンカー（動機）の記録
export function setAnchorMotivation(motivation: 'survival' | 'protect' | 'curiosity'): void {
  gameState.anchorMotivation = motivation;
}

// ゲーム終了時のスナップショット
export function snapshotFinalStatus(): void {
  const alive = gameState.personas.filter(p => p.isAlive);
  const last = alive.length > 0 ? alive[alive.length - 1].customName : '（全員失った）';
  gameState.finalStatus = {
    hp: gameState.hp,
    food: gameState.food,
    coins: gameState.coins,
    survivingPersonas: alive.map(p => p.customName),
    lastStandingName: last,
  };
}

// ===============================
// シーン管理
// ===============================
export type Scene = 'title' | 'entrance' | 'maze' | 'finale';

let currentScene: Scene = 'title';
let sceneChangeCallback: ((scene: Scene) => void) | null = null;

export function getCurrentScene(): Scene {
  return currentScene;
}

export function setSceneChangeCallback(cb: (scene: Scene) => void): void {
  sceneChangeCallback = cb;
}

export function navigateTo(scene: Scene): void {
  currentScene = scene;
  if (sceneChangeCallback) {
    sceneChangeCallback(scene);
  }
}

// ===============================
// アニメーションユーティリティ
// ===============================
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function fadeIn(element: HTMLElement, duration: number = 500): Promise<void> {
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

export function fadeOut(element: HTMLElement, duration: number = 500): Promise<void> {
  return new Promise(resolve => {
    element.style.transition = `opacity ${duration}ms ease`;
    element.style.opacity = '0';
    setTimeout(resolve, duration);
  });
}

// テキストのタイプライター効果
export async function typewriter(
  element: HTMLElement,
  text: string,
  speed: number = 50
): Promise<void> {
  element.textContent = '';
  for (const char of text) {
    element.textContent += char;
    await sleep(speed);
  }
}

// パーティクルエフェクト生成
export function createParticles(container: HTMLElement, count: number = 30): void {
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.cssText = `
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      width: ${Math.random() * 4 + 1}px;
      height: ${Math.random() * 4 + 1}px;
      animation-delay: ${Math.random() * 3}s;
      animation-duration: ${Math.random() * 3 + 2}s;
      background: ${Math.random() > 0.5 ? 'rgba(201, 162, 39, 0.6)' : 'rgba(139, 92, 246, 0.4)'};
    `;
    container.appendChild(particle);
  }
}
