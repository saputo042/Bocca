// BOCCA ゲーム状態管理ユーティリティ

import type { GameState, SacrificeRecord } from '../data/diagnosis';

// ゲーム状態のシングルトン
let gameState: GameState = createInitialState();

export function createInitialState(): GameState {
  return {
    selectedPersonas: [],
    sacrificeHistory: [],
    lastStanding: '',
    totalTurns: 0,
    fearScore: 0,
    selfScore: 0,
    sacrificeSpeed: [],
  };
}

export function resetGameState(): void {
  gameState = createInitialState();
}

export function getGameState(): GameState {
  return gameState;
}

export function setSelectedPersonas(ids: string[]): void {
  gameState.selectedPersonas = [...ids];
}

export function recordSacrifice(record: SacrificeRecord): void {
  gameState.sacrificeHistory.push(record);
  gameState.sacrificeSpeed.push(record.decisionTimeMs);
  gameState.totalTurns++;

  // 恐怖スコアの更新（選択が遅いほど恐怖スコアが上がる）
  const timeScore = Math.min(100, (record.decisionTimeMs / 15000) * 100);
  gameState.fearScore = Math.round((gameState.fearScore + timeScore) / 2);

  // 自己中心スコアの更新（特定のペルソナを守るパターンで変動）
  if (record.decisionTimeMs < 3000) {
    gameState.selfScore = Math.min(100, gameState.selfScore + 10);
  }
}

export function setLastStanding(id: string): void {
  gameState.lastStanding = id;
}

// シーン管理
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

// アニメーションユーティリティ
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
