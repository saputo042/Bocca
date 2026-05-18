// ST-02 / ST-07 タイミングミニゲーム

import { changeHp, getState } from '../utils/gameState';
import { playSFX } from '../utils/audio';

export interface TimingConfig {
  windowMs: number;
  allowedMisses: number;
  waveCount: number;
  waveIntervalMs: number;
  threatLabel: string;
  hitZoneLabel?: string;
}

export interface TimingResult {
  outcome: 'success' | 'fail';
  misses: number;
}

export function runTiming(container: HTMLElement, cfg: TimingConfig): Promise<TimingResult> {
  return new Promise(resolve => {
    const state = getState();
    let misses = 0;
    let currentWave = 0;
    let gameActive = true;

    container.innerHTML = `
      <div class="minigame-overlay" id="timing-overlay">
        <div class="timing-info-row">
          <span class="timing-miss-label">ミス: <span id="timing-misses">0</span> / ${cfg.allowedMisses}</span>
          <span class="timing-wave-label">第 <span id="timing-wave">1</span> / ${cfg.waveCount} 波</span>
        </div>
        <div class="timing-arena" id="timing-arena">
          <div class="hit-zone" id="hit-zone"></div>
          <div class="threat-element" id="threat-el">${cfg.threatLabel}</div>
        </div>
        <p class="timing-status" id="timing-status">構えろ…</p>
        <button class="btn-timing-action" id="btn-timing-action" disabled>
          ${cfg.hitZoneLabel ?? '気を解放！'}
        </button>
      </div>
    `;

    function updateWaveDisplay(): void {
      const waveEl = document.getElementById('timing-wave');
      if (waveEl) waveEl.textContent = String(currentWave + 1);
    }

    function updateMissDisplay(): void {
      const missEl = document.getElementById('timing-misses');
      if (missEl) missEl.textContent = String(misses);
    }

    function showFeedback(text: string, color: string): void {
      const status = document.getElementById('timing-status');
      if (status) {
        status.textContent = text;
        status.style.color = color;
      }
    }

    function doWave(): void {
      if (!gameActive) return;
      updateWaveDisplay();

      const threatEl = document.getElementById('threat-el');
      const hitZone = document.getElementById('hit-zone');
      const actionBtn = document.getElementById('btn-timing-action') as HTMLButtonElement | null;

      if (!threatEl || !actionBtn) return;

      // Reset threat position (start from far right)
      threatEl.style.transition = 'none';
      threatEl.style.left = '90%';
      if (hitZone) hitZone.classList.remove('hit-zone-active');

      const travelDurationMs = 2000 + Math.random() * 500;
      const hitZoneStart = 0.38;
      const hitZoneEnd = hitZoneStart + (cfg.windowMs / travelDurationMs);

      let pressed = false;
      let waveStartTime = 0;
      let rafId: number;

      actionBtn.disabled = false;

      // Small delay before movement starts
      setTimeout(() => {
        if (!gameActive) return;
        waveStartTime = Date.now();

        threatEl.style.transition = `left ${travelDurationMs}ms linear`;
        threatEl.style.left = '5%';

        function checkZone(): void {
          if (pressed || !gameActive) return;
          const elapsed = (Date.now() - waveStartTime) / travelDurationMs;

          if (elapsed >= hitZoneStart && elapsed <= hitZoneEnd) {
            if (hitZone) hitZone.classList.add('hit-zone-active');
          } else {
            if (hitZone) hitZone.classList.remove('hit-zone-active');
          }

          if (elapsed >= 1.0 && !pressed) {
            cancelAnimationFrame(rafId);
            pressed = true;
            if (actionBtn) actionBtn.disabled = true;
            // Missed - threat passed
            misses++;
            updateMissDisplay();
            showFeedback('遅すぎた！ MISS!', '#ef4444');

            const dmg = 10;
            changeHp(-dmg);
            if (state.hp <= 0) {
              gameActive = false;
              resolve({ outcome: 'fail', misses });
              return;
            }

            if (misses >= cfg.allowedMisses) {
              gameActive = false;
              resolve({ outcome: 'fail', misses });
              return;
            }

            setTimeout(() => {
              currentWave++;
              if (currentWave >= cfg.waveCount) {
                resolve({ outcome: 'success', misses });
              } else {
                doWave();
              }
            }, cfg.waveIntervalMs);
            return;
          }
          rafId = requestAnimationFrame(checkZone);
        }
        rafId = requestAnimationFrame(checkZone);
      }, 400);

      actionBtn.onclick = () => {
        if (pressed || !gameActive) return;
        pressed = true;
        cancelAnimationFrame(rafId);
        actionBtn.disabled = true;

        const elapsed = (Date.now() - waveStartTime) / travelDurationMs;
        const inZone = elapsed >= hitZoneStart && elapsed <= hitZoneEnd;

        if (hitZone) hitZone.classList.remove('hit-zone-active');

        if (inZone) {
          playSFX('reveal');
          showFeedback('GOOD! 命中！', '#10b981');
          threatEl.style.transition = 'none';
          threatEl.style.transform = 'scale(0)';
          setTimeout(() => { if (threatEl) threatEl.style.transform = ''; }, 400);

          currentWave++;
          setTimeout(() => {
            if (!gameActive) return;
            if (currentWave >= cfg.waveCount) {
              resolve({ outcome: 'success', misses });
            } else {
              doWave();
            }
          }, cfg.waveIntervalMs);
        } else {
          showFeedback('MISS! タイミングがズレた', '#ef4444');
          misses++;
          updateMissDisplay();

          const dmg = 8;
          changeHp(-dmg);
          if (state.hp <= 0) {
            gameActive = false;
            resolve({ outcome: 'fail', misses });
            return;
          }

          if (misses >= cfg.allowedMisses) {
            gameActive = false;
            resolve({ outcome: 'fail', misses });
            return;
          }

          setTimeout(() => {
            if (!gameActive) return;
            currentWave++;
            if (currentWave >= cfg.waveCount) {
              resolve({ outcome: 'success', misses });
            } else {
              doWave();
            }
          }, cfg.waveIntervalMs);
        }
      };
    }

    setTimeout(doWave, 800);
  });
}
