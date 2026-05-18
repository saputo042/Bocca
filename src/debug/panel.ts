// デバッグパネル

import {
  getState, setServants, setBigFive, navigateTo, advanceStage, changeHp,
} from '../utils/gameState';
import { QUESTIONS, calculateScores } from '../data/bigfive';
import { selectServants, ALL_SERVANTS } from '../data/tarot';
import { STAGES } from '../data/stages';

function isDebugMode(): boolean {
  return location.search.includes('debug=1') || location.hash.includes('debug');
}

export function initDebugPanel(): void {
  if (!isDebugMode()) return;

  const panel = document.createElement('div');
  panel.className = 'debug-panel';
  panel.id = 'debug-panel';
  panel.innerHTML = `
    <div class="debug-panel-header">
      <span>&#x1F527; Debug Panel</span>
      <button class="debug-toggle" id="debug-toggle">&#x25BC;</button>
    </div>
    <div class="debug-panel-body" id="debug-panel-body">
      <button class="debug-btn" id="dbg-rand">ランダム診断でスキップ</button>
      <button class="debug-btn" id="dbg-all3">全問3でスキップ</button>
      <div class="debug-jump-row">
        <label class="debug-label">ステージジャンプ:</label>
        <select class="debug-select" id="dbg-stage-select">
          ${STAGES.map(s => `<option value="${s.id}">ST-${String(s.id).padStart(2,'0')} ${s.name}</option>`).join('')}
        </select>
        <button class="debug-btn debug-btn-go" id="dbg-jump">GO</button>
      </div>
      <div class="debug-info" id="debug-info"></div>
    </div>
  `;

  document.body.appendChild(panel);

  // Toggle
  document.getElementById('debug-toggle')?.addEventListener('click', () => {
    const body = document.getElementById('debug-panel-body');
    const toggle = document.getElementById('debug-toggle');
    if (!body || !toggle) return;
    const collapsed = body.style.display === 'none';
    body.style.display = collapsed ? 'block' : 'none';
    toggle.textContent = collapsed ? '▼' : '▲';
  });

  // Random diagnosis skip
  document.getElementById('dbg-rand')?.addEventListener('click', () => {
    const randomAnswers = QUESTIONS.map(() => Math.floor(Math.random() * 5) + 1);
    applyDiagAndGoST01(randomAnswers);
  });

  // All-3 skip
  document.getElementById('dbg-all3')?.addEventListener('click', () => {
    const allThree = QUESTIONS.map(() => 3);
    applyDiagAndGoST01(allThree);
  });

  // Stage jump
  document.getElementById('dbg-jump')?.addEventListener('click', () => {
    const select = document.getElementById('dbg-stage-select') as HTMLSelectElement;
    const targetStage = parseInt(select.value, 10);
    jumpToStage(targetStage);
  });

  // Periodic state info update
  setInterval(updateDebugInfo, 2000);
}

function applyDiagAndGoST01(answers: number[]): void {
  const scores = calculateScores(answers);
  setBigFive(scores);
  const servants = selectServants(scores);
  setServants(servants);
  const state = getState();
  state.currentStage = 1;
  navigateTo('stage');
}

function jumpToStage(targetStage: number): void {
  const state = getState();

  // Give full debug setup if servants not set
  if (state.servants.length === 0) {
    const defaultScores = { O: 0.5, C: 0.5, E: 0.5, A: 0.5, N: 0.5 };
    setBigFive(defaultScores);
    const servants = ALL_SERVANTS.slice(0, 8).map(s => ({
      ...s, alive: true,
      resonance: defaultScores.O * s.weights.O + defaultScores.C * s.weights.C +
                 defaultScores.E * s.weights.E + defaultScores.A * s.weights.A +
                 defaultScores.N * s.weights.N,
    }));
    setServants(servants);
  }

  state.hp = 100;
  state.hasPotion = true;
  state.hasSword = true;
  state.hasKey = true;
  state.gameOver = false;
  state.bossDefeated = false;
  state.currentStage = 1;

  // Advance to target stage
  while (state.currentStage < targetStage) {
    advanceStage();
  }

  // Use changeHp to reset to 100 (might need to force it)
  state.hp = 100;

  navigateTo('stage');
}

function updateDebugInfo(): void {
  const el = document.getElementById('debug-info');
  if (!el) return;
  const state = getState();
  el.innerHTML = `
    <small>
      ST: ${state.currentStage} | HP: ${state.hp}/${state.maxHp}<br>
      Alive: ${state.aliveServants.length} | Sacrificed: ${state.sacrificeCount}<br>
      Potion: ${state.hasPotion} | Sword: ${state.hasSword} | Key: ${state.hasKey}
    </small>
  `;
}

// Also expose a helper to enable debug mode from console
if (isDebugMode()) {
  (window as Window & typeof globalThis & { buccaDebug: unknown }).buccaDebug = {
    getState,
    changeHp,
    jumpToStage,
  };
}
