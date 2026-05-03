// BOCCA — 終幕シーン v2（5軸レーダーチャート + 新レポート）

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
import { buildRadarChartSVG, buildAxesDescription } from '../components/RadarChart';

export function renderFinaleScene(container: HTMLElement): void {
  const state = getGameState();
  const report = generateDiagnosis(state);

  playSFX('reveal');

  container.innerHTML = `
    <div class="scene scene-finale" id="scene-finale">
      <div class="particles-container" id="finale-particles"></div>
      <div class="bg-overlay finale-overlay"></div>

      <div class="finale-content">

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

        <!-- 5軸レーダーチャート -->
        <div class="radar-section" id="radar-section" style="opacity:0">
          <div class="report-section-label">5軸分析 — Your Profile</div>
          <div class="radar-wrapper">
            ${buildRadarChartSVG(report.diagScores)}
          </div>
          <div class="axes-description">
            ${buildAxesDescription(report.diagScores)}
          </div>
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

        <!-- 3. 戦い方が語るもの (NEW) -->
        <div class="report-section" id="section-3" style="opacity:0">
          <div class="report-section-label">戦い方が語るもの — Fighting Style</div>
          <div class="report-section-icon">⚔️</div>
          <p class="report-text">${report.fightingStyle}</p>
        </div>

        <!-- 4. 期待と現実のズレ (NEW) -->
        <div class="report-section report-section-dark" id="section-4" style="opacity:0">
          <div class="report-section-label">期待と現実のズレ — Expectation Gap</div>
          <div class="report-section-icon">🪞</div>
          <p class="report-text">${report.expectationGap}</p>
        </div>

        <!-- 5. 残骸の証明 -->
        <div class="report-section" id="section-5" style="opacity:0">
          <div class="report-section-label">残骸の証明 — Final Status</div>
          <div class="report-section-icon">📊</div>
          <p class="report-text report-mono">${report.finalStatusText}</p>
        </div>

        <!-- 6. 真実の姿 -->
        <div class="report-section report-section-true" id="section-6" style="opacity:0">
          <div class="report-section-label">真実の姿 — True Self</div>
          <div class="report-section-icon">${report.typeEmoji}</div>
          <p class="report-text">${report.trueSelf}</p>
        </div>

        <!-- 7. 真実の口の裁定 -->
        <div class="report-section report-verdict" id="section-7" style="opacity:0">
          <div class="report-section-label">真実の口の裁定</div>
          <div class="report-section-icon">👁️</div>
          <p class="report-text report-verdict-text" id="verdict-text"></p>
        </div>

        <!-- 行動ログ -->
        <div class="action-log-section" id="action-log" style="opacity:0">
          <div class="report-section-label">あなたの選択の記録</div>
          <div class="action-log-grid">
            ${state.actionLog.filter(a => a.type !== 'dialogue').map(log => `
              <div class="action-log-item ${log.choice === 'B' || log.choice === 'fight' ? 'log-harsh' : 'log-soft'}">
                <span class="log-step">Event ${log.step + 1}</span>
                <span class="log-label">${log.label}</span>
                ${log.sacrificedName ? `<span class="log-sacrifice">💀 ${log.sacrificedName}</span>` : ''}
                ${log.debuffedName ? `<span class="log-debuff">⚠️ ${log.debuffedName}</span>` : ''}
              </div>
            `).join('')}
          </div>
          <!-- 感情ログ -->
          ${state.emotionLog.length > 0 ? `
            <div class="report-section-label" style="margin-top:2rem">あなたの感情の記録</div>
            <div class="action-log-grid">
              ${state.emotionLog.map(log => `
                <div class="action-log-item emotion-log-item">
                  <span class="log-step">Event ${log.eventId + 1}</span>
                  <span class="log-label">${log.eventTitle}</span>
                  <span class="log-emotion">${getEmotionLabel(log.emotionChoice)}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <!-- フッター -->
        <div class="finale-footer" id="finale-footer" style="opacity:0">
          <p class="finale-closing">BOCCAはお前の真実を、飲み込んだ。</p>
          <button class="btn-primary btn-restart" id="btn-restart">↺ もう一度、迷宮へ</button>
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

function getEmotionLabel(choice: string): string {
  const map: Record<string, string> = {
    expected: '😐 予想通りだった',
    guiltyButRight: '😔 痛みはあったが正しかった',
    regret: '😢 後悔している',
    numb: '😶 何も感じなかった',
  };
  return map[choice] || choice;
}

async function runFinaleAnimation(verdictText: string): Promise<void> {
  await sleep(400);

  const titleEl = document.getElementById('finale-title');
  if (titleEl) await typewriter(titleEl, '——真実の口が、開く。', 70);
  await sleep(800);

  const typeEl = document.getElementById('type-reveal');
  if (typeEl) { await fadeIn(typeEl, 1000); playSFX('reveal'); }
  await sleep(1000);

  const radarEl = document.getElementById('radar-section');
  if (radarEl) { await fadeIn(radarEl, 800); }
  await sleep(800);

  for (const id of ['section-1', 'section-2', 'section-3', 'section-4', 'section-5', 'section-6']) {
    const el = document.getElementById(id);
    if (el) { await fadeIn(el, 700); playSFX('reveal'); }
    await sleep(600);
  }

  const section7 = document.getElementById('section-7');
  if (section7) await fadeIn(section7, 600);
  const verdictEl = document.getElementById('verdict-text');
  if (verdictEl) await typewriter(verdictEl, verdictText, 30);
  await sleep(800);

  const logEl = document.getElementById('action-log');
  if (logEl) await fadeIn(logEl, 800);
  await sleep(600);

  const footerEl = document.getElementById('finale-footer');
  if (footerEl) await fadeIn(footerEl, 800);
}
