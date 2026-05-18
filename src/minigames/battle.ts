// ST-05 / ST-09 連打バトルミニゲーム

import { changeHp, getState } from '../utils/gameState';
import { playSFX } from '../utils/audio';

export interface BattleConfig {
  timeLimitSec: number;
  targetClicks: number;
  showSplitButtons?: boolean;
}

export function runBattle(container: HTMLElement, cfg: BattleConfig): Promise<'success' | 'fail'> {
  return new Promise(resolve => {
    let clicks = 0;
    let gameActive = true;

    container.innerHTML = `
      <div class="minigame-overlay battle-overlay" id="battle-overlay">
        <div class="progress-bar-container" style="margin-bottom:0.5rem">
          <div class="progress-bar-fill" id="battle-progress" style="width:0%"></div>
        </div>
        <p class="battle-click-label">クリック: <span id="battle-clicks">0</span> / ${cfg.targetClicks}</p>
        <p class="battle-timer-label">残り: <span id="battle-timer">${cfg.timeLimitSec}</span>秒</p>
        <div class="battle-split-area">
          <button class="battle-btn-left" id="btn-battle-left">L</button>
          <button class="battle-btn-right" id="btn-battle-right">R</button>
        </div>
        <p class="battle-hint">交互に素早く押せ！</p>
      </div>
    `;

    function onClick(): void {
      if (!gameActive) return;
      clicks++;
      playSFX('select');
      const pct = Math.min(100, Math.round((clicks / cfg.targetClicks) * 100));
      const bar = document.getElementById('battle-progress');
      const clickEl = document.getElementById('battle-clicks');
      if (bar) bar.style.width = `${pct}%`;
      if (clickEl) clickEl.textContent = String(clicks);

      if (clicks >= cfg.targetClicks) {
        gameActive = false;
        clearInterval(timerInterval);
        resolve('success');
      }
    }

    document.getElementById('btn-battle-left')?.addEventListener('click', onClick);
    document.getElementById('btn-battle-right')?.addEventListener('click', onClick);

    let timeLeft = cfg.timeLimitSec;
    const timerInterval = setInterval(() => {
      timeLeft--;
      const timerEl = document.getElementById('battle-timer');
      if (timerEl) timerEl.textContent = String(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        if (gameActive) {
          gameActive = false;
          resolve('fail');
        }
      }
    }, 1000);
  });
}

export interface BossConfig {
  bossMaxHp: number;
  leverDamage: number;
  sacrificeDamage: number;
  counterDamage: number;
  hasSword: boolean;
}

export interface BossRoundResult {
  bossDefeated: boolean;
  playerDied: boolean;
  sacrificeUsed: boolean;
}

export function runBossBattle(
  container: HTMLElement,
  cfg: BossConfig,
  onSacrificeRequested: () => Promise<boolean>
): Promise<BossRoundResult> {
  return new Promise(resolve => {
    const state = getState();
    const bossMaxHp = cfg.bossMaxHp + (cfg.hasSword ? -20 : 0);
    let bossHp = bossMaxHp;
    let roundActive = false;
    let sacrificeUsed = false;

    function renderUI(): void {
      container.innerHTML = `
        <div class="minigame-overlay boss-overlay" id="boss-overlay">
          <div class="boss-hp-bar">
            <span class="boss-hp-label">真実の口</span>
            <div class="hp-bar-container" style="flex:1;margin:0 0.5rem">
              <div class="hp-bar-fill boss-hp-fill" id="boss-hp-fill" style="width:100%;background:#9b1c1c"></div>
            </div>
            <span id="boss-hp-val">${bossHp}/${bossMaxHp}</span>
          </div>
          <div class="player-hp-display">
            <span>あなたのHP: <strong id="boss-player-hp">${state.hp}</strong>/${state.maxHp}</span>
          </div>
          <p class="boss-status" id="boss-status">攻撃方法を選べ</p>
          <div class="boss-action-row">
            <button class="btn-attack boss-attack-btn" id="btn-boss-lever">
              レバー攻撃<br><small>（5回押す → ${cfg.leverDamage}ダメージ）</small>
            </button>
            <button class="btn-sacrifice boss-sacrifice-btn" id="btn-boss-sacrifice">
              従者を投じる<br><small>（${cfg.sacrificeDamage}ダメージ）</small>
            </button>
          </div>
          <div class="boss-click-counter" id="boss-click-counter" style="display:none">
            クリック: <span id="boss-click-cnt">0</span> / 5
          </div>
        </div>
      `;

      attachListeners();
    }

    function updateBossHp(): void {
      const fill = document.getElementById('boss-hp-fill');
      const val = document.getElementById('boss-hp-val');
      if (fill) fill.style.width = `${Math.max(0, (bossHp / bossMaxHp) * 100)}%`;
      if (val) val.textContent = `${Math.max(0, bossHp)}/${bossMaxHp}`;
    }

    function updatePlayerHp(): void {
      const el = document.getElementById('boss-player-hp');
      if (el) el.textContent = String(state.hp);
    }

    function setStatus(text: string): void {
      const el = document.getElementById('boss-status');
      if (el) el.textContent = text;
    }

    function checkBossDeath(): boolean {
      if (bossHp <= 0) {
        resolve({ bossDefeated: true, playerDied: false, sacrificeUsed });
        return true;
      }
      return false;
    }

    function bossCounter(): boolean {
      changeHp(-cfg.counterDamage);
      updatePlayerHp();
      setStatus(`反撃！ HP -${cfg.counterDamage}`);
      if (state.hp <= 0) {
        resolve({ bossDefeated: false, playerDied: true, sacrificeUsed });
        return true;
      }
      return false;
    }

    function attachListeners(): void {
      const leverBtn = document.getElementById('btn-boss-lever') as HTMLButtonElement | null;
      const sacBtn = document.getElementById('btn-boss-sacrifice') as HTMLButtonElement | null;
      const counterEl = document.getElementById('boss-click-counter');
      const cntEl = document.getElementById('boss-click-cnt');

      if (leverBtn) {
        leverBtn.addEventListener('click', () => {
          if (roundActive) return;
          roundActive = true;
          leverBtn.disabled = true;
          if (sacBtn) sacBtn.disabled = true;
          if (counterEl) counterEl.style.display = 'block';

          let localClicks = 0;
          if (cntEl) cntEl.textContent = '0';

          leverBtn.textContent = 'クリック！';
          const rapidClick = () => {
            localClicks++;
            if (cntEl) cntEl.textContent = String(localClicks);
            if (localClicks >= 5) {
              leverBtn.removeEventListener('click', rapidClick);
              leverBtn.textContent = 'レバー攻撃\n（5回押す）';
              leverBtn.disabled = false;
              if (sacBtn) sacBtn.disabled = false;
              if (counterEl) counterEl.style.display = 'none';

              bossHp -= cfg.leverDamage;
              updateBossHp();
              playSFX('select');
              setStatus(`${cfg.leverDamage}ダメージ！`);
              if (checkBossDeath()) return;
              if (bossCounter()) return;
              roundActive = false;
            }
          };
          leverBtn.addEventListener('click', rapidClick);
        });
      }

      if (sacBtn) {
        sacBtn.addEventListener('click', async () => {
          if (roundActive) return;
          roundActive = true;
          if (leverBtn) leverBtn.disabled = true;
          sacBtn.disabled = true;

          const ok = await onSacrificeRequested();
          if (!ok) {
            roundActive = false;
            if (leverBtn) leverBtn.disabled = false;
            sacBtn.disabled = false;
            return;
          }

          sacrificeUsed = true;
          playSFX('sacrifice');
          bossHp -= cfg.sacrificeDamage;
          updateBossHp();
          setStatus(`従者を投じた！ ${cfg.sacrificeDamage}ダメージ！`);

          if (checkBossDeath()) return;
          // Sacrifice does not trigger counter
          roundActive = false;
          if (leverBtn) leverBtn.disabled = false;
          sacBtn.disabled = false;
        });
      }
    }

    renderUI();
  });
}
