// Bucca タイトルシーン

import { navigateTo, fadeIn, typewriter, createParticles, sleep } from '../utils/gameState';
import { playAmbienceForScene } from '../utils/audio';

export function renderTitleScene(container: HTMLElement): void {
  container.innerHTML = `
    <div class="scene scene-title" id="scene-title">
      <div class="particles-container" id="title-particles"></div>
      <div class="bg-overlay"></div>
      <div class="title-content">
        <div class="bocca-mouth" id="bocca-mouth">
          <div class="mouth-outer">
            <div class="mouth-inner">
              <div class="tongue"></div>
            </div>
          </div>
          <div class="eye eye-left"></div>
          <div class="eye eye-right"></div>
        </div>
        <h1 class="game-title" id="game-title">Bucca</h1>
        <p class="game-subtitle" id="game-subtitle"></p>

        <div class="title-steps" id="title-steps" style="opacity:0">
          <div class="title-step">
            <div class="title-step-num">I</div>
            <div class="title-step-label">診断</div>
            <div class="title-step-desc">自分を知れ</div>
          </div>
          <div class="title-step-arrow">&#x2192;</div>
          <div class="title-step">
            <div class="title-step-num">II</div>
            <div class="title-step-label">従者</div>
            <div class="title-step-desc">仲間を得よ</div>
          </div>
          <div class="title-step-arrow">&#x2192;</div>
          <div class="title-step">
            <div class="title-step-num">III</div>
            <div class="title-step-label">試練</div>
            <div class="title-step-desc">魂を証せ</div>
          </div>
        </div>

        <p class="game-tagline" id="game-tagline"></p>
        <div class="title-buttons" id="title-buttons" style="opacity:0">
          <button class="btn-primary" id="btn-start">
            <span class="btn-icon">&#x2691;</span>
            旅を始める
          </button>
          <p class="btn-note">※ 音声推奨。静かな場所でお楽しみください。</p>
        </div>
      </div>
      <div class="scroll-hint">&#x25BC;</div>
    </div>
  `;

  const particlesContainer = document.getElementById('title-particles')!;
  createParticles(particlesContainer, 50);

  playAmbienceForScene('title');

  runTitleAnimation();

  document.getElementById('btn-start')?.addEventListener('click', () => {
    navigateTo('diagnosis');
  });
}

async function runTitleAnimation(): Promise<void> {
  await sleep(500);

  const subtitle = document.getElementById('game-subtitle');
  if (subtitle) {
    await typewriter(subtitle, '性格診断 × デスゲーム体験', 60);
  }

  await sleep(600);

  const stepsEl = document.getElementById('title-steps');
  if (stepsEl) await fadeIn(stepsEl, 1000);

  await sleep(600);

  const tagline = document.getElementById('game-tagline');
  if (tagline) {
    await typewriter(tagline, '22体のタロット従者があなたの性格を映し出す', 40);
  }

  await sleep(400);

  const buttons = document.getElementById('title-buttons');
  if (buttons) {
    await fadeIn(buttons, 800);
  }
}
