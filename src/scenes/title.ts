// BOCCA タイトルシーン

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
        <h1 class="game-title" id="game-title">BOCCA</h1>
        <p class="game-subtitle" id="game-subtitle"></p>

        <div class="title-steps" id="title-steps" style="opacity:0">
          <div class="title-step">
            <div class="title-step-num">I</div>
            <div class="title-step-label">視覚</div>
            <div class="title-step-desc">迷宮を彷徨え</div>
          </div>
          <div class="title-step-arrow">→</div>
          <div class="title-step">
            <div class="title-step-num">II</div>
            <div class="title-step-label">触覚・決断</div>
            <div class="title-step-desc">口に奉納せよ</div>
          </div>
          <div class="title-step-arrow">→</div>
          <div class="title-step">
            <div class="title-step-num">III</div>
            <div class="title-step-label">喪失・判定</div>
            <div class="title-step-desc">魂を裁かれる</div>
          </div>
        </div>

        <p class="game-tagline" id="game-tagline"></p>
        <div class="title-buttons" id="title-buttons" style="opacity:0">
          <button class="btn-primary" id="btn-start">
            <span class="btn-icon">⚑</span>
            祭壇に近づく
          </button>
          <p class="btn-note">※ 音声推奨。静かな場所でお楽しみください。</p>
        </div>
      </div>
      <div class="scroll-hint">▼</div>
    </div>
  `;

  const particlesContainer = document.getElementById('title-particles')!;
  createParticles(particlesContainer, 50);

  playAmbienceForScene('title');

  runTitleAnimation();

  document.getElementById('btn-start')?.addEventListener('click', () => {
    playAmbienceForScene('ruins');
    navigateTo('entrance');
  });
}

async function runTitleAnimation(): Promise<void> {
  await sleep(500);

  const subtitle = document.getElementById('game-subtitle');
  if (subtitle) {
    await typewriter(subtitle, '——あなたが手放してきたものが、あなたを喰らいに来る。', 60);
  }

  await sleep(600);

  const stepsEl = document.getElementById('title-steps');
  if (stepsEl) await fadeIn(stepsEl, 1000);

  await sleep(600);

  const tagline = document.getElementById('game-tagline');
  if (tagline) {
    await typewriter(tagline, 'ダーク・アトラクション × 心理診断 × 魂の供物', 40);
  }

  await sleep(400);

  const buttons = document.getElementById('title-buttons');
  if (buttons) {
    await fadeIn(buttons, 800);
  }
}
