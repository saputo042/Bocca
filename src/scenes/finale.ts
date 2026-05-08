// BOCCA — 終幕シーン v2（5軸レーダーチャート + 新レポート）

import { generateDiagnosis } from '../data/diagnosis';
import type { BigFiveProfile } from '../data/diagnosis';
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

      <!-- RFIDスキャン演出オーバーレイ -->
      <div class="rfid-overlay" id="rfid-overlay">
        <div class="rfid-scan-bar" id="rfid-scan-bar"></div>
        <div class="rfid-center">
          <div class="bocca-mouth rfid-bocca" id="rfid-bocca">
            <div class="mouth-outer"><div class="mouth-inner rfid-jaw-closed"><div class="tongue"></div></div></div>
            <div class="eye eye-left"></div>
            <div class="eye eye-right"></div>
          </div>
          <p class="rfid-msg" id="rfid-msg1" style="opacity:0">口が閉じた...</p>
          <p class="rfid-mono" id="rfid-msg2" style="opacity:0">BOCCA SYSTEM — READING SOUL DATA</p>
          <div class="rfid-dots" id="rfid-dots" style="opacity:0">
            <span class="rfid-dot"></span><span class="rfid-dot"></span><span class="rfid-dot"></span>
          </div>
          <p class="rfid-done" id="rfid-done" style="opacity:0">— 判定完了 —</p>
        </div>
      </div>

      <div class="finale-content">

        <div class="finale-header">
          <div class="scene-label">BOCCAの裁定</div>
          <h2 class="finale-main-title" id="finale-title"></h2>
        </div>

        <!-- Big Five メイン診断 -->
        <div class="report-section report-bigfive report-bigfive-primary" id="section-bigfive" style="opacity:0">
          <div class="report-section-label">Big Five 性格診断 — Scientific Profile</div>
          <div class="report-section-icon">🧬</div>
          <div class="bigfive-bars">
            ${buildBigFiveBars(report.bigFive)}
          </div>
          <p class="report-text">${buildBigFiveText(report.bigFive)}</p>
        </div>

        <!-- 信頼度・一貫性 -->
        <div class="report-section report-reliability" id="section-reliability" style="opacity:0">
          <div class="report-section-label">診断の信頼度 — Reliability</div>
          <div class="report-section-icon">📐</div>
          <div class="reliability-meter">
            <div class="reliability-bar-bg">
              <div class="reliability-bar-fill" style="width:${report.reliabilityScore}%"></div>
            </div>
            <span class="reliability-score">${report.reliabilityScore}%</span>
          </div>
          <p class="report-text">${report.reliabilityNote}</p>
          ${report.consistencyWarning
            ? `<div class="consistency-warning"><span class="warn-icon">⚠️</span> ${report.consistencyWarning.replace(/\n/g, '<br>')}</div>`
            : ''}
          <p class="report-text report-note wellbeing-note">
            💡 この診断はゲーム体験に基づく自己洞察ツールです。医療・臨床診断の代替にはなりません。
            深刻な悩みがある場合は、専門家へのご相談をお勧めします。
          </p>
        </div>

        <!-- 5軸レーダーチャート -->
        <div class="radar-section" id="radar-section" style="opacity:0">
          <div class="report-section-label">5軸行動分析 — Your Profile</div>
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

        <!-- 3. 戦い方が語るもの -->
        <div class="report-section" id="section-3" style="opacity:0">
          <div class="report-section-label">戦い方が語るもの — Fighting Style</div>
          <div class="report-section-icon">⚔️</div>
          <p class="report-text">${report.fightingStyle}</p>
        </div>

        <!-- 4. 期待と現実のズレ -->
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

        <!-- MBTIタイプ（参考） -->
        <div class="type-reveal type-reveal-ref" id="type-reveal" style="opacity:0">
          <div class="report-section-label type-ref-label">参考: MBTIタイプ（行動傾向ラベル）</div>
          <div class="type-emoji">${report.typeEmoji}</div>
          <div class="type-letters">${report.mbtiType}</div>
          <div class="type-title">${report.typeTitle}</div>
          <p class="report-text report-note">※ MBTIは娯楽的な行動傾向ラベルです。科学的診断には Big Five を参照してください。</p>
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
  runRFIDIntro(report.verdict);

  document.getElementById('btn-restart')?.addEventListener('click', () => {
    resetGameState();
    playAmbienceForScene('title');
    navigateTo('title');
  });
}

function buildBigFiveBars(bf: BigFiveProfile): string {
  const axes: Array<{ key: keyof BigFiveProfile; label: string; desc: string }> = [
    { key: 'openness',          label: '開放性 (O)',   desc: '創造・好奇心・新体験への受容' },
    { key: 'conscientiousness', label: '誠実性 (C)',   desc: '計画・自己規律・目標志向' },
    { key: 'extraversion',      label: '外向性 (E)',   desc: '社交性・活動性・刺激希求' },
    { key: 'agreeableness',     label: '協調性 (A)',   desc: '共感・利他・協力' },
    { key: 'neuroticism',       label: '神経症傾向 (N)', desc: '感情不安定・ストレス感受性' },
  ];
  return axes.map(ax => {
    const raw = bf[ax.key];
    const pct = Math.round(((raw + 10) / 20) * 100); // -10〜+10 を 0〜100%に
    const color = ax.key === 'neuroticism'
      ? `hsl(${Math.round(120 - pct * 1.2)},60%,40%)`
      : `hsl(${Math.round(180 + pct * 0.6)},55%,45%)`;
    return `
      <div class="bf-row">
        <div class="bf-label" title="${ax.desc}">${ax.label}</div>
        <div class="bf-bar-bg">
          <div class="bf-bar-fill" style="width:${pct}%;background:${color}"></div>
        </div>
        <div class="bf-value">${raw > 0 ? '+' : ''}${raw.toFixed(1)}</div>
      </div>
    `;
  }).join('');
}

function buildBigFiveText(bf: BigFiveProfile): string {
  const parts: string[] = [];
  if (bf.openness > 3)       parts.push('変化や未知に対して開かれている（高開放性）');
  else if (bf.openness < -3) parts.push('慣れ親しんだものを好み、安定を求める（低開放性）');

  if (bf.conscientiousness > 3)       parts.push('目標に向かって計画的・着実に動く（高誠実性）');
  else if (bf.conscientiousness < -3) parts.push('柔軟で即興的——規律より自由を選ぶ（低誠実性）');

  if (bf.extraversion > 3)       parts.push('他者との交流からエネルギーを得る（高外向性）');
  else if (bf.extraversion < -3) parts.push('一人の時間で回復する内省型（低外向性）');

  if (bf.agreeableness > 3)       parts.push('他者への配慮と共感を優先する（高協調性）');
  else if (bf.agreeableness < -3) parts.push('競争的・自己主張が強い（低協調性）');

  if (bf.neuroticism > 3)       parts.push('感情が揺れやすく、ストレスに敏感（高神経症傾向）');
  else if (bf.neuroticism < -3) parts.push('感情的に安定しており、ストレス耐性が高い（低神経症傾向）');

  return parts.length > 0
    ? parts.join('。') + '。'
    : '各軸が均衡しており、特定の傾向が突出していない。';
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

async function runRFIDIntro(verdictText: string): Promise<void> {
  await sleep(400);

  const m1 = document.getElementById('rfid-msg1');
  if (m1) await fadeIn(m1, 900);
  await sleep(1000);

  const m2 = document.getElementById('rfid-msg2');
  if (m2) await fadeIn(m2, 600);
  await sleep(600);

  const dots = document.getElementById('rfid-dots');
  if (dots) await fadeIn(dots, 400);
  await sleep(1800);

  const done = document.getElementById('rfid-done');
  if (done) await fadeIn(done, 700);
  await sleep(1000);

  // RFIDオーバーレイをフェードアウト
  const overlay = document.getElementById('rfid-overlay');
  if (overlay) {
    overlay.style.transition = 'opacity 1.2s ease';
    overlay.style.opacity = '0';
    await sleep(1200);
    overlay.remove();
  }

  await runFinaleAnimation(verdictText);
}

async function runFinaleAnimation(verdictText: string): Promise<void> {
  await sleep(400);

  const titleEl = document.getElementById('finale-title');
  if (titleEl) await typewriter(titleEl, '——真実の口が、開く。', 70);
  await sleep(800);

  // Big Five メイン診断を最初に表示
  const bigfiveEl = document.getElementById('section-bigfive');
  if (bigfiveEl) { await fadeIn(bigfiveEl, 1000); playSFX('reveal'); }
  await sleep(800);

  const reliabilityEl = document.getElementById('section-reliability');
  if (reliabilityEl) { await fadeIn(reliabilityEl, 800); }
  await sleep(600);

  const radarEl = document.getElementById('radar-section');
  if (radarEl) { await fadeIn(radarEl, 800); }
  await sleep(800);

  for (const id of ['section-1', 'section-2', 'section-3', 'section-4', 'section-5', 'section-6']) {
    const el = document.getElementById(id);
    if (el) { await fadeIn(el, 700); playSFX('reveal'); }
    await sleep(600);
  }

  // MBTIは参考として後に表示
  const typeEl = document.getElementById('type-reveal');
  if (typeEl) { await fadeIn(typeEl, 800); }
  await sleep(600);

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
