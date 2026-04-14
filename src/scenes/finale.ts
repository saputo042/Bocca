// BOCCA 終幕シーン（診断結果 + 料理ペアリング）

import { getPersonaById } from '../data/personas';
import { generateDiagnosis } from '../data/diagnosis';
import {
  getGameState,
  resetGameState,
  navigateTo,
  typewriter,
  createParticles,
  sleep,
  fadeIn,
} from '../utils/gameState';
import { playSFX, playAmbienceForScene } from '../utils/audio';

export function renderFinaleScene(container: HTMLElement): void {
  const state = getGameState();
  const lastPersona = getPersonaById(state.lastStanding);
  const diagnosis = generateDiagnosis(state);

  playSFX('reveal');

  container.innerHTML = `
    <div class="scene scene-finale" id="scene-finale">
      <div class="particles-container" id="finale-particles"></div>
      <div class="bg-overlay finale-overlay"></div>

      <div class="finale-content">
        <!-- ヘッダー -->
        <div class="finale-header">
          <div class="scene-label">第四の扉 · 宇宙</div>
          <h2 class="finale-main-title" id="finale-title"></h2>
        </div>

        <!-- 最後に残ったペルソナ -->
        <div class="last-persona-reveal" id="last-persona" style="opacity:0">
          <div class="reveal-label">あなたが最後まで守ったもの</div>
          <div class="last-persona-card">
            <div class="last-persona-symbol">${lastPersona?.symbol || '?'}</div>
            <div class="last-persona-name">${lastPersona?.name || '不明'}</div>
            <div class="last-persona-subtitle">${lastPersona?.subtitle || ''}</div>
          </div>
        </div>

        <!-- 診断 3層分析 -->
        <div class="diagnosis-section" id="diagnosis" style="opacity:0">
          <h3 class="diagnosis-title">——BOCCAが診断する、あなたの3つの顔——</h3>

          <div class="diagnosis-layers">
            <div class="diagnosis-layer layer-1" id="layer-1" style="opacity:0">
              <div class="layer-number">Layer 1</div>
              <div class="layer-label">表層の顔</div>
              <div class="layer-title">${diagnosis.layer1.title}</div>
              <div class="layer-desc">${diagnosis.layer1.description}</div>
            </div>

            <div class="diagnosis-layer layer-2" id="layer-2" style="opacity:0">
              <div class="layer-number">Layer 2</div>
              <div class="layer-label">中層の傷</div>
              <div class="layer-title">${diagnosis.layer2.title}</div>
              <div class="layer-desc">${diagnosis.layer2.description}</div>
            </div>

            <div class="diagnosis-layer layer-3" id="layer-3" style="opacity:0">
              <div class="layer-number">Layer 3</div>
              <div class="layer-label">深層の本質</div>
              <div class="layer-title">${diagnosis.layer3.title}</div>
              <div class="layer-desc">${diagnosis.layer3.description}</div>
            </div>
          </div>

          <div class="overall-comment" id="overall" style="opacity:0">
            <div class="overall-icon">⊕</div>
            <p class="overall-text">${diagnosis.overall}</p>
          </div>
        </div>

        <!-- 料理ペアリング -->
        <div class="food-pairing-section" id="food-pairing" style="opacity:0">
          <h3 class="food-title">——あなたへの一皿——</h3>

          <div class="food-card" style="border-color: ${diagnosis.foodPairing.color}">
            <div class="food-emoji">${diagnosis.foodPairing.emoji}</div>
            <div class="food-info">
              <div class="food-name">${diagnosis.foodPairing.name}</div>
              <div class="food-desc">${diagnosis.foodPairing.description}</div>
              <div class="food-reason">
                <div class="reason-label">なぜあなたにこの料理か</div>
                <p>${diagnosis.foodPairing.reason}</p>
              </div>
            </div>
          </div>

          <div class="food-mood-image" id="food-mood">
            <div class="food-image-placeholder">
              <div class="food-image-overlay">
                <span class="food-image-emoji">${diagnosis.foodPairing.emoji}</span>
                <span class="food-image-name">${diagnosis.foodPairing.name}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 犠牲の記録 -->
        <div class="sacrifice-log-section" id="sacrifice-log" style="opacity:0">
          <h3 class="log-title">——迷宮での選択の記録——</h3>
          <div class="sacrifice-entries">
            ${state.sacrificeHistory.map((record, i) => {
              const sacrificed = getPersonaById(record.sacrificed);
              return `
                <div class="sacrifice-entry">
                  <div class="entry-turn">第${i + 1}の選択</div>
                  <div class="entry-content">
                    <span class="entry-symbol">${sacrificed?.symbol || '?'}</span>
                    <span class="entry-name">「${sacrificed?.name || '不明'}」</span>
                    を差し出した
                    <span class="entry-time">（${(record.decisionTimeMs / 1000).toFixed(1)}秒で決断）</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- フッター -->
        <div class="finale-footer" id="finale-footer" style="opacity:0">
          <p class="finale-closing">BOCCAはあなたの真実を受け取った。</p>
          <button class="btn-primary btn-restart" id="btn-restart">
            <span class="btn-icon">↺</span>
            もう一度、迷宮へ
          </button>
        </div>
      </div>
    </div>
  `;

  createParticles(document.getElementById('finale-particles')!, 60);
  runFinaleAnimation();

  document.getElementById('btn-restart')?.addEventListener('click', () => {
    resetGameState();
    playAmbienceForScene('title');
    navigateTo('title');
  });
}

async function runFinaleAnimation(): Promise<void> {
  await sleep(300);

  // タイトル
  const titleEl = document.getElementById('finale-title');
  if (titleEl) {
    await typewriter(titleEl, '真実の口が、開く。', 80);
  }

  await sleep(600);

  // 最後のペルソナ表示
  const lastPersonaEl = document.getElementById('last-persona');
  if (lastPersonaEl) await fadeIn(lastPersonaEl, 1000);
  playSFX('reveal');

  await sleep(1200);

  // 診断セクション
  const diagnosisEl = document.getElementById('diagnosis');
  if (diagnosisEl) await fadeIn(diagnosisEl, 800);

  await sleep(400);

  // Layer1 → 2 → 3 を順番に表示
  for (const layerId of ['layer-1', 'layer-2', 'layer-3']) {
    const layerEl = document.getElementById(layerId);
    if (layerEl) {
      await fadeIn(layerEl, 700);
      await sleep(500);
    }
  }

  // 総合コメント
  const overallEl = document.getElementById('overall');
  if (overallEl) await fadeIn(overallEl, 800);

  await sleep(800);

  // 料理ペアリング
  const foodEl = document.getElementById('food-pairing');
  if (foodEl) await fadeIn(foodEl, 1000);
  playSFX('reveal');

  await sleep(600);

  // 犠牲の記録
  const logEl = document.getElementById('sacrifice-log');
  if (logEl) await fadeIn(logEl, 800);

  await sleep(400);

  // フッター
  const footerEl = document.getElementById('finale-footer');
  if (footerEl) await fadeIn(footerEl, 800);
}
