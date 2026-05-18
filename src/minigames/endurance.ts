// ST-01 耐久ミニゲーム（長押し）

import { changeHp, getState } from '../utils/gameState';
import { LEVER_CONFIG } from '../data/levers';

export function runEndurance(container: HTMLElement): Promise<'success' | 'fail'> {
  return new Promise(resolve => {
    const cfg = LEVER_CONFIG.endurance.st01;
    const state = getState();

    container.innerHTML = `
      <div class="minigame-overlay" id="endurance-overlay">
        <div class="endurance-thorn-left" id="thorn-left"></div>
        <div class="endurance-thorn-right" id="thorn-right"></div>
        <div class="endurance-center">
          <div class="progress-bar-container">
            <div class="progress-bar-fill" id="endurance-progress" style="width:0%"></div>
          </div>
          <p class="endurance-label">耐久: <span id="endurance-pct">0</span>%</p>
          <div class="hp-bar-container" style="margin-bottom:1rem">
            <div class="hp-bar-fill" id="endurance-hp" style="width:${state.hp}%"></div>
          </div>
          <p class="endurance-hp-label">HP: <span id="endurance-hp-val">${state.hp}</span> / ${state.maxHp}</p>
          <button class="btn-hold-large" id="btn-endurance-hold"
            style="touch-action:none;user-select:none;">
            押し続けろ
          </button>
          <p class="endurance-hint">離すと茨が加速する</p>
        </div>
      </div>
    `;

    let isHolding = false;
    let holdMs = 0;
    let thornPos = 0;
    let gameActive = true;
    let holdTickId: ReturnType<typeof setInterval> | null = null;

    const totalMs = cfg.totalDurationMs;
    const penaltyPerSec = cfg.penaltyHpPerSec;

    function updateThornVisual(): void {
      const left = document.getElementById('thorn-left');
      const right = document.getElementById('thorn-right');
      if (left) left.style.transform = `translateX(${thornPos - 100}%)`;
      if (right) right.style.transform = `translateX(${100 - thornPos}%)`;
    }

    function updateHpDisplay(): void {
      const hpBar = document.getElementById('endurance-hp');
      const hpVal = document.getElementById('endurance-hp-val');
      if (hpBar) hpBar.style.width = `${Math.max(0, (state.hp / state.maxHp) * 100)}%`;
      if (hpVal) hpVal.textContent = String(state.hp);
    }

    function flashRed(): void {
      const overlay = document.getElementById('endurance-overlay');
      if (!overlay) return;
      overlay.style.background = 'rgba(120,0,0,0.4)';
      setTimeout(() => { if (overlay) overlay.style.background = ''; }, 180);
    }

    // Thorn approach tick (200ms)
    const thornInterval = setInterval(() => {
      if (!gameActive) return;
      thornPos = isHolding
        ? Math.min(100, thornPos + 0.8)
        : Math.min(100, thornPos + 5);
      updateThornVisual();

      if (!isHolding && thornPos >= 50) {
        changeHp(-Math.ceil(penaltyPerSec * 0.2));
        updateHpDisplay();
        flashRed();
        if (state.hp <= 0) {
          gameActive = false;
          clearInterval(thornInterval);
          if (holdTickId) clearInterval(holdTickId);
          cleanup();
          resolve('fail');
        }
      }
    }, 200);

    function startHolding(): void {
      if (!gameActive || isHolding) return;
      isHolding = true;
      const btn = document.getElementById('btn-endurance-hold');
      if (btn) btn.classList.add('active');

      holdTickId = setInterval(() => {
        if (!gameActive || !isHolding) {
          if (holdTickId) { clearInterval(holdTickId); holdTickId = null; }
          return;
        }
        holdMs += 100;
        const pct = Math.min(100, Math.round((holdMs / totalMs) * 100));
        const bar = document.getElementById('endurance-progress');
        const pctEl = document.getElementById('endurance-pct');
        if (bar) bar.style.width = `${pct}%`;
        if (pctEl) pctEl.textContent = String(pct);

        if (holdMs >= totalMs) {
          clearInterval(holdTickId!);
          holdTickId = null;
          clearInterval(thornInterval);
          gameActive = false;
          cleanup();
          resolve('success');
        }
      }, 100);
    }

    function stopHolding(): void {
      if (!isHolding) return;
      isHolding = false;
      const btn = document.getElementById('btn-endurance-hold');
      if (btn) btn.classList.remove('active');
      if (holdTickId) { clearInterval(holdTickId); holdTickId = null; }
    }

    function cleanup(): void {
      document.removeEventListener('mouseup', stopHolding);
      document.removeEventListener('touchend', stopHolding);
    }

    const holdBtn = document.getElementById('btn-endurance-hold')!;
    holdBtn.addEventListener('mousedown', startHolding);
    holdBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startHolding(); }, { passive: false });
    document.addEventListener('mouseup', stopHolding);
    document.addEventListener('touchend', stopHolding);
  });
}
