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
        <p class="game-tagline" id="game-tagline"></p>
        <div class="title-buttons" id="title-buttons" style="opacity:0">
          <button class="btn-primary" id="btn-start">
            <span class="btn-icon">⚑</span>
            体験を始める
          </button>
          <p class="btn-note">※ 音声推奨。静かな場所でお楽しみください。</p>
        </div>
      </div>
      <div class="scroll-hint">▼</div>
    </div>
  `;

  // パーティクル生成
  const particlesContainer = document.getElementById('title-particles')!;
  createParticles(particlesContainer, 50);

  // 雰囲気音を開始
  playAmbienceForScene('title');

  // アニメーション順序
  runTitleAnimation();

  // スタートボタン
  document.getElementById('btn-start')?.addEventListener('click', () => {
    playAmbienceForScene('ruins');
    navigateTo('entrance');
  });
}

async function runTitleAnimation(): Promise<void> {
  await sleep(500);

  // タイトル＆サブタイトルをタイプライター表示
  const subtitle = document.getElementById('game-subtitle');
  if (subtitle) {
    await typewriter(subtitle, '——あなたが手放してきたものが、あなたを喰らいに来る。', 60);
  }

  await sleep(800);

  const tagline = document.getElementById('game-tagline');
  if (tagline) {
    await typewriter(tagline, 'ダーク・イマーシブ体験 × 心理診断 × 食', 40);
  }

  await sleep(600);

  // ボタンをフェードイン
  const buttons = document.getElementById('title-buttons');
  if (buttons) {
    await fadeIn(buttons, 800);
  }
}
