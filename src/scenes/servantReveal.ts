// Bucca 従者公開シーン

import { navigateTo, getState, sleep, fadeIn } from '../utils/gameState';
import { TAROT_SYMBOLS } from '../data/tarot';
import { playSFX } from '../utils/audio';

function dimensionBar(label: string, value: number, color: string): string {
  const pct = Math.round(value * 100);
  return `
    <div class="servant-dim-row">
      <span class="servant-dim-label">${label}</span>
      <div class="servant-dim-track">
        <div class="servant-dim-fill" style="width:${pct}%;background:${color}"></div>
      </div>
    </div>
  `;
}

function servantCardHTML(
  servant: { id: number; name: string; englishName: string; trait: string; skill: string; weights: { O: number; C: number; E: number; A: number; N: number }; resonance: number },
  _scores: { O: number; C: number; E: number; A: number; N: number }
): string {
  const dims = [
    { label: 'O', value: servant.weights.O / 5, color: '#8b5cf6' },
    { label: 'C', value: servant.weights.C / 5, color: '#3b82f6' },
    { label: 'E', value: servant.weights.E / 5, color: '#f59e0b' },
    { label: 'A', value: servant.weights.A / 5, color: '#10b981' },
    { label: 'N', value: servant.weights.N / 5, color: '#ef4444' },
  ];

  const resonancePct = Math.round((servant.resonance / 25) * 100);

  return `
    <div class="servant-card" style="opacity:0" data-id="${servant.id}">
      <div class="servant-card-header">
        <span class="servant-symbol">${TAROT_SYMBOLS[servant.id] ?? String(servant.id)}</span>
        <div>
          <div class="servant-name">${servant.name}</div>
          <div class="servant-english">${servant.englishName}</div>
        </div>
      </div>
      <div class="servant-trait">${servant.trait}</div>
      <div class="servant-skill-block">
        <span class="servant-skill-desc">${servant.skill}</span>
      </div>
      <div class="servant-affinity">
        ${dims.map(d => dimensionBar(d.label, d.value, d.color)).join('')}
      </div>
      <div class="servant-resonance">共鳴度 ${resonancePct}%</div>
    </div>
  `;
}

export function renderServantRevealScene(container: HTMLElement): void {
  const state = getState();
  const servants = state.servants;
  const scores = state.bigFive;

  container.innerHTML = `
    <div class="scene scene-servant-reveal" id="scene-servant-reveal">
      <div class="bg-overlay"></div>
      <div class="servant-reveal-wrapper">
        <h2 class="servant-reveal-title">あなたに宿る8体の従者</h2>
        <p class="servant-reveal-subtitle" id="reveal-subtitle" style="opacity:0">タロットがあなたの性格を映し出した</p>
        <div class="servant-grid" id="servant-grid">
          ${servants.map(s => servantCardHTML(s, scores)).join('')}
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

  runRevealAnimation(servants.length);

  document.getElementById('btn-begin')?.addEventListener('click', () => {
    navigateTo('stage');
  });
}

async function runRevealAnimation(count: number): Promise<void> {
  await sleep(400);

  const subtitleEl = document.getElementById('reveal-subtitle');
  if (subtitleEl) await fadeIn(subtitleEl, 600);

  await sleep(300);

  for (let i = 0; i < count; i++) {
    await sleep(200);
    const cards = document.querySelectorAll<HTMLElement>('.servant-card');
    if (cards[i]) {
      playSFX('reveal');
      await fadeIn(cards[i], 400);
    }
  }

  await sleep(500);

  const footer = document.getElementById('reveal-footer');
  if (footer) await fadeIn(footer, 600);
}
