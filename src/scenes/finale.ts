// BOCCA — 終幕シーン（5段階診断レポート）

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
  const report = generateDiagnosis(state);

  playSFX('reveal');

  container.innerHTML = `
    <div class="scene scene-finale" id="scene-finale">
      <div class="particles-container" id="finale-particles"></div>
      <div class="bg-overlay finale-overlay"></div>

      <div class="finale-content">

        <!-- ヘッダー -->
        <div class="finale-header">
          <div class="scene-label">BOCCAの裁定</div>
          <h2 class="finale-main-title" id="finale-title"></h2>
        </div>

        <!-- MBTIタイプ表示 -->
        <div class="type-reveal" id="type-reveal" style="opacity:0">
          <div class="type-emoji">${report.typeEmoji}</div>
          <div class="type-letters">${report.mbtiType}</div>
          <div class="type-title">${report.typeTitle}</div>
        </div>

        <!-- 1. 偽りの仮面 -->
        <div class="report-section" id="section-1" style="opacity:0">
          <div class="report-section-label">偽りの仮面 — Ideal Self</div>
          <div class="report-section-icon">🎭</div>
          <p class="report-text">${report.idealSelf}</p>
        </div>

        <!-- 2. 決断の限界点 -->
        <div class="report-section report-section-dark" id="section-2" style="opacity:0">
          <div class="report-section-label">決断の限界点 — The Breaking Point</div>
          <div class="report-section-icon">💥</div>
          <p class="report-text">${report.breakingPoint}</p>
        </div>

        <!-- 3. 残骸の証明 -->
        <div class="report-section" id="section-3" style="opacity:0">
          <div class="report-section-label">残骸の証明 — Final Status</div>
          <div class="report-section-icon">📊</div>
          <p class="report-text report-mono">${report.finalStatusText}</p>
        </div>

        <!-- 4. 真実の姿 -->
        <div class="report-section report-section-true" id="section-4" style="opacity:0">
          <div class="report-section-label">真実の姿 — True Self</div>
          <div class="report-section-icon">${report.typeEmoji}</div>
          <p class="report-text">${report.trueSelf}</p>
        </div>

        <!-- 5. 真実の口の裁定 -->
        <div class="report-section report-verdict" id="section-5" style="opacity:0">
          <div class="report-section-label">真実の口の裁定</div>
          <div class="report-section-icon">👁️</div>
          <p class="report-text report-verdict-text" id="verdict-text"></p>
        </div>

        <!-- 行動ログ -->
        <div class="action-log-section" id="action-log" style="opacity:0">
          <div class="report-section-label">あなたの選択の記録</div>
          <div class="action-log-grid">
            ${state.actionLog.filter(a => a.type !== 'dialogue').map((log) => `
              <div class="action-log-item ${log.choice === 'B' || log.choice === 'fight' ? 'log-harsh' : 'log-soft'}">
                <span class="log-step">Step ${log.step + 1}</span>
                <span class="log-label">${log.label}</span>
                ${log.sacrificedName ? `<span class="log-sacrifice">💀 ${log.sacrificedName}</span>` : ''}
                ${log.debuffedName ? `<span class="log-debuff">⚠️ ${log.debuffedName}</span>` : ''}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- フッター -->
        <div class="finale-footer" id="finale-footer" style="opacity:0">
          <p class="finale-closing">BOCCAはお前の真実を、飲み込んだ。</p>
          <button class="btn-primary btn-restart" id="btn-restart">
            <span class="btn-icon">↺</span>
            もう一度、迷宮へ
          </button>
        </div>

      </div>
    </div>
  `;

  createParticles(document.getElementById('finale-particles')!, 60);
  runFinaleAnimation(report.verdict);

  document.getElementById('btn-restart')?.addEventListener('click', () => {
    resetGameState();
    playAmbienceForScene('title');
    navigateTo('title');
  });
}

async function runFinaleAnimation(verdictText: string): Promise<void> {
  await sleep(400);

  // タイトル
  const titleEl = document.getElementById('finale-title');
  if (titleEl) await typewriter(titleEl, '——真実の口が、開く。', 70);
  await sleep(800);

  // タイプ表示
  const typeEl = document.getElementById('type-reveal');
  if (typeEl) { await fadeIn(typeEl, 1000); playSFX('reveal'); }
  await sleep(1200);

  // セクション1〜4 順番に
  for (const id of ['section-1', 'section-2', 'section-3', 'section-4']) {
    const el = document.getElementById(id);
    if (el) { await fadeIn(el, 800); playSFX('reveal'); }
    await sleep(700);
  }

  // 裁定テキスト（タイプライター）
  const section5 = document.getElementById('section-5');
  if (section5) await fadeIn(section5, 600);
  const verdictEl = document.getElementById('verdict-text');
  if (verdictEl) await typewriter(verdictEl, verdictText, 30);
  await sleep(800);

  // 行動ログ
  const logEl = document.getElementById('action-log');
  if (logEl) await fadeIn(logEl, 800);
  await sleep(600);

  // フッター
  const footerEl = document.getElementById('finale-footer');
  if (footerEl) await fadeIn(footerEl, 800);
}
