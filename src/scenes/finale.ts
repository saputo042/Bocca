// Bucca 終幕シーン

import { determineEnding } from '../data/endings';
import { TAROT_SYMBOLS } from '../data/tarot';
import {
  getState, resetState, navigateTo,
  typewriter, createParticles, sleep, fadeIn,
} from '../utils/gameState';
import { playSFX, playAmbienceForScene } from '../utils/audio';

const TYPE_COLORS: Record<string, string> = {
  BEST: '#C9A227',
  GOOD: '#10b981',
  NORMAL: '#6b7280',
  DEEP: '#8b5cf6',
  SPECIAL: '#f59e0b',
  SECRET: '#64748b',
  BAD: '#9b1c1c',
};

function bfBar(label: string, value: number, color: string): string {
  const pct = Math.round(value * 100);
  return `
    <div class="bf-bar-row">
      <span class="bf-bar-label">${label}</span>
      <div class="bf-bar-track">
        <div class="bf-bar-fill" style="width:${pct}%;background:${color}"></div>
      </div>
      <span class="bf-bar-pct">${pct}%</span>
    </div>
  `;
}

function bfPersonality(bf: { O: number; C: number; E: number; A: number; N: number }): string {
  const parts: string[] = [];
  if (bf.O > 0.65) parts.push('変化や新体験に対して開かれている（高開放性）');
  else if (bf.O < 0.35) parts.push('慣れ親しんだ環境と安定を好む（低開放性）');
  if (bf.C > 0.65) parts.push('計画的・着実に目標へ向かう（高誠実性）');
  else if (bf.C < 0.35) parts.push('柔軟で即興的——規律より自由（低誠実性）');
  if (bf.E > 0.65) parts.push('他者との交流でエネルギーを得る（高外向性）');
  else if (bf.E < 0.35) parts.push('一人の時間で回復する内省型（低外向性）');
  if (bf.A > 0.65) parts.push('共感・利他・協調を重視する（高協調性）');
  else if (bf.A < 0.35) parts.push('競争的・自己主張が強い（低協調性）');
  if (bf.N > 0.65) parts.push('感情が揺れやすく、ストレスに敏感（高神経症傾向）');
  else if (bf.N < 0.35) parts.push('感情的に安定しており、ストレス耐性が高い（低神経症傾向）');
  return parts.length > 0 ? parts.join('。') + '。' : '各軸が均衡しており、特定の傾向が突出していない。';
}

function servantChip(s: { id: number; name: string; skill: string }, alive: boolean): string {
  return `
    <div class="servant-chip-result ${alive ? '' : 'sacrificed'}">
      <span class="chip-symbol">${TAROT_SYMBOLS[s.id] ?? ''}</span>
      <span class="chip-name">${s.name}</span>
      <span class="chip-skill">${s.skill.split('（')[0]}</span>
    </div>
  `;
}

export function renderFinaleScene(container: HTMLElement): void {
  const state = getState();
  const ending = determineEnding(state);
  const bf = state.bigFive;

  const survivingServants = state.aliveServants;
  const sacrificedServants = state.servants.filter(s => !s.alive);

  container.innerHTML = `
    <div class="scene scene-finale" id="scene-finale">
      <div class="particles-container" id="finale-particles"></div>
      <div class="bg-overlay finale-overlay"></div>

      <div class="finale-content">

        <div class="finale-header">
          <div class="scene-label">真実の口の裁定</div>
          <h2 class="finale-main-title" id="finale-title"></h2>
        </div>

        <!-- エンディング -->
        <div class="ending-card" id="ending-card" style="opacity:0">
          <div class="ending-badge" style="background:${TYPE_COLORS[ending.type] ?? '#666'}">${ending.type}</div>
          <h3 class="ending-title">${ending.title}</h3>
          <p class="ending-message" id="ending-message"></p>
        </div>

        <!-- 従者の状態 -->
        <div class="report-section" id="section-servants" style="opacity:0">
          <div class="report-section-label">旅を共にした従者</div>
          ${survivingServants.length > 0 ? `
            <p class="servant-section-head">生き残った従者（${survivingServants.length}体）</p>
            <div class="servant-chip-grid">
              ${survivingServants.map(s => servantChip(s, true)).join('')}
            </div>
          ` : '<p class="servant-section-head servant-all-gone">全ての従者が旅立った</p>'}
          ${sacrificedServants.length > 0 ? `
            <p class="servant-section-head sacrificed-head">捧げた従者（${sacrificedServants.length}体）</p>
            <div class="servant-chip-grid">
              ${sacrificedServants.map(s => servantChip(s, false)).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Big Five -->
        <div class="report-section report-bigfive-primary" id="section-bigfive" style="opacity:0">
          <div class="report-section-label">Big Five 性格診断 — Scientific Profile</div>
          <div class="bigfive-bars">
            ${bfBar('開放性 (O)', bf.O, '#8b5cf6')}
            ${bfBar('誠実性 (C)', bf.C, '#3b82f6')}
            ${bfBar('外向性 (E)', bf.E, '#f59e0b')}
            ${bfBar('協調性 (A)', bf.A, '#10b981')}
            ${bfBar('神経症傾向 (N)', bf.N, '#ef4444')}
          </div>
          <p class="report-text">${bfPersonality(bf)}</p>
          <p class="report-text report-note">
            この診断はゲーム体験に基づく自己洞察ツールです。医療・臨床診断の代替にはなりません。
          </p>
        </div>

        <!-- 旅の記録 -->
        <div class="report-section" id="section-log" style="opacity:0">
          <div class="report-section-label">旅の記録</div>
          <div class="stage-log-list">
            ${state.stageLog.map(log => `
              <div class="stage-log-item ${log.outcome === 'sacrifice' ? 'log-sacrifice' : log.outcome === 'fail' ? 'log-fail' : ''}">
                <span class="log-stage">ST-${String(log.stageId).padStart(2,'0')}</span>
                <span class="log-name">${log.stageName}</span>
                <span class="log-outcome">${outcomeLabel(log.outcome)}</span>
                ${log.sacrificedServantName ? `<span class="log-sacrifice-name">（${log.sacrificedServantName}を捧げた）</span>` : ''}
                ${log.hpDelta !== 0 ? `<span class="log-hp ${log.hpDelta > 0 ? 'hp-plus' : 'hp-minus'}">HP ${log.hpDelta > 0 ? '+' : ''}${log.hpDelta}</span>` : ''}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- フッター -->
        <div class="finale-footer" id="finale-footer" style="opacity:0">
          <p class="finale-closing">——BOCCAはお前の真実を、飲み込んだ。</p>
          <button class="btn-primary btn-restart" id="btn-restart">&#x21BA; もう一度、旅に出る</button>
        </div>

      </div>
    </div>
  `;

  createParticles(document.getElementById('finale-particles')!, 50);
  playSFX('reveal');

  runFinaleAnimation(ending.message);

  document.getElementById('btn-restart')?.addEventListener('click', () => {
    resetState();
    playAmbienceForScene('title');
    navigateTo('title');
  });
}

function outcomeLabel(outcome: string): string {
  switch (outcome) {
    case 'success': return '成功';
    case 'fail': return '失敗';
    case 'sacrifice': return '従者を捧げた';
    case 'skip': return 'スキップ';
    case 'item': return 'アイテム取得';
    default: return outcome;
  }
}

async function runFinaleAnimation(endingMessage: string): Promise<void> {
  await sleep(400);

  const titleEl = document.getElementById('finale-title')!;
  await typewriter(titleEl, '——真実の口が、開く。', 70);
  await sleep(800);

  const endingCard = document.getElementById('ending-card')!;
  await fadeIn(endingCard, 900);
  playSFX('reveal');

  const msgEl = document.getElementById('ending-message')!;
  await sleep(400);
  await typewriter(msgEl, endingMessage, 35);
  await sleep(800);

  for (const id of ['section-servants', 'section-bigfive', 'section-log']) {
    const el = document.getElementById(id);
    if (el) { await fadeIn(el, 700); playSFX('reveal'); }
    await sleep(500);
  }

  const footer = document.getElementById('finale-footer')!;
  await fadeIn(footer, 800);
}
