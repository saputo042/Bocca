// Bucca 従者公開シーン

import { navigateTo, getState, sleep, fadeIn, typewriter } from '../utils/gameState';
import { TAROT_SYMBOLS } from '../data/tarot';
import { playSFX } from '../utils/audio';

export function renderServantRevealScene(container: HTMLElement): void {
  const state = getState();
  const servant = state.aliveServants[0];

  if (!servant) {
    navigateTo('stage');
    return;
  }

  const symbol = TAROT_SYMBOLS[servant.id] ?? String(servant.id);
  const resonancePct = Math.round((servant.resonance / 25) * 100);

  container.innerHTML = `
    <div class="scene scene-servant-reveal" id="scene-servant-reveal">
      <div class="bg-overlay"></div>
      <div class="servant-reveal-wrapper servant-reveal-single">
        <p class="servant-reveal-subtitle" id="reveal-subtitle" style="opacity:0">
          タロットがあなたの魂と共鳴した
        </p>

        <div class="servant-single-card" id="servant-card" style="opacity:0">
          <div class="servant-card-header">
            <span class="servant-symbol">${symbol}</span>
            <div>
              <div class="servant-name">${servant.name}</div>
              <div class="servant-english">${servant.englishName}</div>
            </div>
          </div>
          <div class="servant-trait">${servant.trait}</div>
          <div class="servant-skill-block">
            <span class="servant-skill-desc">${servant.skill}</span>
          </div>
          <div class="servant-resonance">共鳴度 ${resonancePct}%</div>
        </div>

        <div class="servant-intro-dialogue" id="servant-dialogue" style="opacity:0">
          <span class="servant-dialogue-name">${servant.name}</span>
          <p class="servant-dialogue-text" id="dialogue-text"></p>
        </div>

        <div class="servant-reveal-footer" id="reveal-footer" style="opacity:0">
          <button class="btn-primary" id="btn-begin">
            <span class="btn-icon">&#x2694;</span>
            旅を始める
          </button>
        </div>
      </div>
    </div>
  `;

  runRevealAnimation(servant.dialogue.intro);

  document.getElementById('btn-begin')?.addEventListener('click', () => {
    navigateTo('stage');
  });
}

async function runRevealAnimation(introText: string): Promise<void> {
  await sleep(500);

  const subtitleEl = document.getElementById('reveal-subtitle');
  if (subtitleEl) await fadeIn(subtitleEl, 700);

  await sleep(400);

  const card = document.getElementById('servant-card');
  if (card) {
    playSFX('reveal');
    await fadeIn(card, 600);
  }

  await sleep(600);

  const dialogueEl = document.getElementById('servant-dialogue');
  const textEl = document.getElementById('dialogue-text');
  if (dialogueEl && textEl) {
    await fadeIn(dialogueEl, 400);
    await typewriter(textEl, introText, 45);
  }

  await sleep(500);

  const footer = document.getElementById('reveal-footer');
  if (footer) await fadeIn(footer, 600);
}
