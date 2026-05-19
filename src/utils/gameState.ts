// Bucca ゲーム状態管理

import type { BigFiveScores } from '../data/bigfive';
import type { TarotServant } from '../data/tarot';
import { GAME_CONFIG } from '../data/gameConfig';

// ===============================
// 型定義
// ===============================

export type Scene = 'title' | 'diagnosis' | 'servantReveal' | 'stage' | 'finale';

export interface StageResult {
  stageId: number;
  stageName: string;
  outcome: 'success' | 'sacrifice' | 'fail' | 'skip' | 'item';
  sacrificedServantName?: string;
  choice?: string;
  hpDelta: number;
}

export interface GameState {
  bigFive: BigFiveScores;
  servants: TarotServant[];
  aliveServants: TarotServant[];
  servantPool: TarotServant[];
  nextServantIndex: number;
  hp: number;
  maxHp: number;
  gold: number;
  currentStage: number;
  gameOver: boolean;
  bossDefeated: boolean;
  hasPotion: boolean;
  hasSword: boolean;
  hasKey: boolean;
  hasFood: boolean;
  firstSacrificedId: number | null;
  sacrificeCount: number;
  orphanChoice: string | null;
  st08TrustAfterBetrayal: boolean | null;
  stageLog: StageResult[];
}

// ===============================
// ステート管理
// ===============================

let _state: GameState = createInitial();

function createInitial(): GameState {
  return {
    bigFive: { O: 0, C: 0, E: 0, A: 0, N: 0 },
    servants: [],
    aliveServants: [],
    servantPool: [],
    nextServantIndex: 0,
    hp: GAME_CONFIG.initialHp,
    maxHp: GAME_CONFIG.initialHp,
    gold: GAME_CONFIG.initialGold,
    currentStage: 1,
    gameOver: false,
    bossDefeated: false,
    hasPotion: false,
    hasSword: false,
    hasKey: false,
    hasFood: false,
    firstSacrificedId: null,
    sacrificeCount: 0,
    orphanChoice: null,
    st08TrustAfterBetrayal: null,
    stageLog: [],
  };
}

export function addGold(amount: number): void {
  _state.gold = Math.max(0, _state.gold + amount);
}

export function getState(): GameState { return _state; }
export function resetState(): void { _state = createInitial(); }

// Aliases for scenes that use old names
export function getGameState(): GameState { return _state; }
export function resetGameState(): void { _state = createInitial(); }

export function changeHp(delta: number): void {
  _state.hp = Math.max(0, Math.min(_state.maxHp, _state.hp + delta));
  if (_state.hp <= 0) _state.gameOver = true;
}

// Alias for old code
export function applyHpChange(delta: number): void {
  changeHp(delta);
}

export function sacrificeServant(servantId: number): TarotServant | null {
  const idx = _state.aliveServants.findIndex(s => s.id === servantId);
  if (idx === -1) return null;
  const [s] = _state.aliveServants.splice(idx, 1);
  // Also update servants array
  const sIdx = _state.servants.findIndex(sv => sv.id === servantId);
  if (sIdx !== -1) _state.servants[sIdx].alive = false;
  if (_state.firstSacrificedId === null) _state.firstSacrificedId = servantId;
  _state.sacrificeCount++;
  return s;
}

export function addStageLog(result: StageResult): void {
  _state.stageLog.push(result);
}

export function recordStageResult(result: StageResult): void {
  _state.stageLog.push(result);
}

export function setServants(servants: TarotServant[]): void {
  _state.servants = servants.map(s => ({ ...s, alive: true }));
  _state.aliveServants = servants.map(s => ({ ...s, alive: true }));
}

export function initServantPool(servants: TarotServant[]): void {
  _state.servantPool = servants.map(s => ({ ...s, alive: true }));
  _state.nextServantIndex = 0;
  _state.servants = [];
  _state.aliveServants = [];
}

export function acquireNextServant(): TarotServant | null {
  if (_state.nextServantIndex >= _state.servantPool.length) return null;
  const servant = { ..._state.servantPool[_state.nextServantIndex], alive: true };
  _state.nextServantIndex++;
  _state.servants.push(servant);
  _state.aliveServants.push(servant);
  return servant;
}

export function setBigFive(scores: BigFiveScores): void {
  _state.bigFive = scores;
}

export function advanceStage(): void {
  if (_state.currentStage < 9) {
    _state.currentStage++;
  }
}

// ===============================
// シーン管理
// ===============================

let currentScene: Scene = 'title';
let sceneChangeCallback: ((scene: Scene) => void) | null = null;

export function getCurrentScene(): Scene { return currentScene; }

export function setSceneChangeCallback(cb: (scene: Scene) => void): void {
  sceneChangeCallback = cb;
}

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
    p.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;width:${Math.random() * 4 + 1}px;height:${Math.random() * 4 + 1}px;animation-delay:${Math.random() * 3}s;animation-duration:${Math.random() * 3 + 2}s;background:${Math.random() > 0.5 ? 'rgba(201,162,39,0.6)' : 'rgba(139,92,246,0.4)'};`;
    container.appendChild(p);
  }
}
