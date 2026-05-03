// BOCCA — メインゲームループ v2（10イベント対応）

import { SCENARIO } from '../data/scenarioData';
import type { ScenarioNode } from '../data/scenarioData';
import { SKILL_VESSELS } from '../data/personas';
import {
  getGameState,
  navigateTo,
  addDiagScores,
  recordAction,
  applyResourceDelta,
  consumeFoodForMove,
  sacrificePersona,
  applyDebuff,
  advanceStep,
  setAnchorMotivation,
  snapshotFinalStatus,
  typewriter,
  createParticles,
  sleep,
  fadeIn,
  addItem,
  consumeCostHalvedFlag,
  resetGameState,
} from '../utils/gameState';
import { renderEmotionPicker } from '../components/EmotionPicker';
import { buildProgressBar, buildProgressSteps } from '../components/ProgressBar';
import { startBattle } from './battle';
import { startDragSacrifice, startDragCombine } from './interaction';
import { playAmbienceForScene } from '../utils/audio';

export function renderMazeScene(container: HTMLElement): void {
  playAmbienceForScene('mountain');
  renderStep(container);
}

// ===============================
// ステップのレンダリング
// ===============================
function renderStep(container: HTMLElement): void {
  const state = getGameState();
  const node = SCENARIO[state.currentStep];

  if (!node) {
    finishGame(container);
    return;
  }

  if (node.stage === 'city') playAmbienceForScene('city');
  if (node.stage === 'ruins') playAmbienceForScene('space');

  if (node.foodCostOnMove > 0) {
    for (let i = 0; i < node.foodCostOnMove; i++) consumeFoodForMove();
  }

  if (checkGameOver(container)) return;

  switch (node.type) {
    case 'choice':
      if (node.interactionType === 'finalSacrifice') renderFinalSacrifice(container, node);
      else renderChoice(container, node);
      break;
    case 'battle':
      renderBattleNode(container, node);
      break;
    case 'shop':
      renderShop(container, node);
      break;
    case 'event':
      renderEvent(container, node);
      break;
    case 'anchor':
      renderAnchor(container, node);
      break;
    default:
      renderDialogue(container, node);
  }
}

// ===============================
// プログレスバー + HUD
// ===============================
function buildHUD(_node: ScenarioNode): string {
  const state = getGameState();
  const alive = state.personas.filter(p => p.isAlive);
  const stageLabel = state.stage === 'forest' ? '🌲 森' : state.stage === 'city' ? '🌆 都市' : '👁️ 遺跡';

  const showEmotionArr = SCENARIO.map(s => s.showEmotion);
  const progressSteps = buildProgressSteps(state.currentStep, SCENARIO.length, showEmotionArr);
  const progressHTML = buildProgressBar(progressSteps);

  return `
    <div class="maze-hud" id="maze-hud">
      <div class="hud-top">
        <div class="hud-stage">${stageLabel}</div>
        <div class="hud-resources">
          <span class="hud-item ${state.hp <= 3 ? 'hud-danger' : ''}">❤️ ${state.hp}/${state.maxHp}</span>
          <span class="hud-item ${state.food <= 2 ? 'hud-danger' : ''}">🍞 ${state.food}</span>
          <span class="hud-item">🪙 ${state.coins}</span>
          <span class="hud-item">👥 ${alive.length}体</span>
        </div>
      </div>
      ${progressHTML}
    </div>
  `;
}

// ===============================
// スチル表示
// ===============================
async function showStill(imagePath: string | undefined, container: HTMLElement): Promise<void> {
  if (!imagePath) return;
  const overlay = document.createElement('div');
  overlay.className = 'still-overlay';
  overlay.innerHTML = `<img src="${imagePath}" class="still-image" alt="scene" onerror="this.parentElement.style.display='none'">`;
  container.appendChild(overlay);
  await fadeIn(overlay, 600);
  await sleep(2000);
  overlay.style.transition = 'opacity 0.6s ease';
  overlay.style.opacity = '0';
  await sleep(600);
  overlay.remove();
}

// ===============================
// 結果表示
// ===============================
async function showResult(
  container: HTMLElement,
  node: ScenarioNode,
  text: string,
  afterStill: string | undefined,
  onNext: () => void
): Promise<void> {
  if (afterStill) await showStill(afterStill, container);

  const resultEl = document.createElement('div');
  resultEl.className = 'result-overlay';
  resultEl.innerHTML = `
    <div class="result-panel">
      <p class="result-text" id="result-text"></p>
      ${node.showEmotion ? '' : '<button class="btn-primary result-next" id="btn-result-next">▷ 先へ進む</button>'}
    </div>
  `;
  container.appendChild(resultEl);
  await fadeIn(resultEl, 400);

  const el = document.getElementById('result-text');
  if (el) await typewriter(el, text, 28);

  if (node.showEmotion) {
    // 感情選択を挿入
    await sleep(600);
    renderEmotionPicker(container, node.id, node.title, 'action', node.emotionPrompt, () => {
      resultEl.remove();
      onNext();
    });
  } else {
    document.getElementById('btn-result-next')?.addEventListener('click', () => {
      resultEl.remove();
      onNext();
    });
  }
}

// ===============================
// choiceノード（A/B）
// ===============================
function renderChoice(container: HTMLElement, node: ScenarioNode): void {
  const optA = node.options.find(o => o.id === 'A')!;
  const optB = node.options.find(o => o.id === 'B')!;

  function renderMain(): void {
    container.innerHTML = `
      ${buildHUD(node)}
      <div class="scene scene-${node.stage}" id="scene-main">
        <div class="particles-container" id="maze-particles"></div>
        <div class="bg-overlay"></div>
        <div class="maze-content">
          <div class="node-label">— ${node.title} —</div>
          <div class="maze-prompt-container">
            <p class="maze-prompt" id="maze-prompt"></p>
          </div>
          <div class="choice-actions">
            <div class="choice-card choice-a">
              <div class="choice-header">A. スキル組み合わせ</div>
              <div class="choice-cost">
                ${optA.hpCost ? `<span class="cost-item cost-bad">❤️ -${optA.hpCost}</span>` : ''}
                ${optA.foodCost ? `<span class="cost-item cost-bad">🍞 -${optA.foodCost}</span>` : ''}
                <span class="cost-item cost-warn">⚠️ 1体デバフ（${optA.debuffType || ''}）</span>
              </div>
              <button class="btn-choice btn-a" id="btn-a">従者を2体選んで実行</button>
            </div>
            <div class="choice-divider">OR</div>
            <div class="choice-card choice-b">
              <div class="choice-header">B. 犠牲</div>
              <div class="choice-cost">
                <span class="cost-item cost-bad">💀 従者1体ロスト</span>
                <span class="cost-item cost-good">コスト不要</span>
              </div>
              <button class="btn-choice btn-b" id="btn-b">従者を選んで犠牲にする</button>
            </div>
          </div>
        </div>
      </div>
    `;
    createParticles(document.getElementById('maze-particles')!, 12);
    const el = document.getElementById('maze-prompt');
    if (el) sleep(200).then(() => typewriter(el, node.situation, 25));

    document.getElementById('btn-a')?.addEventListener('click', () => launchCombine());
    document.getElementById('btn-b')?.addEventListener('click', () => launchSacrifice());
  }

  function launchCombine(): void {
    startDragCombine(container, node, optA,
      (p1Name, p2Name) => executeA(p1Name, p2Name),
      () => launchSacrifice()
    );
  }

  function launchSacrifice(): void {
    startDragSacrifice(container, node, optB, (sacrificedName) => executeB(sacrificedName));
    container.addEventListener('drag-cancelled', () => renderMain(), { once: true });
  }

  function executeA(p1Name: string, p2Name: string): void {
    const state = getGameState();
    const aliveNow = state.personas.filter(p => p.isAlive);
    const debuffTarget = aliveNow.find(p => p.customName !== p1Name && p.customName !== p2Name);
    const debuffTargetName = debuffTarget?.customName || '（他の従者）';

    const halved = consumeCostHalvedFlag();
    const hpCost = halved ? Math.ceil((optA.hpCost || 0) / 2) : (optA.hpCost || 0);
    const foodCost = halved ? Math.ceil((optA.foodCost || 0) / 2) : (optA.foodCost || 0);
    if (hpCost) applyResourceDelta({ hp: -hpCost });
    if (foodCost) applyResourceDelta({ food: -foodCost });
    if (debuffTarget && optA.debuffType) applyDebuff(debuffTarget.customName, optA.debuffType);
    addDiagScores(optA.diagDelta);

    const p1 = state.personas.find(p => p.customName === p1Name);
    const p2 = state.personas.find(p => p.customName === p2Name);
    const s1 = SKILL_VESSELS.find(v => v.id === p1?.skillId)?.name || '';
    const s2 = SKILL_VESSELS.find(v => v.id === p2?.skillId)?.name || '';

    const resultText = (halved ? '【通行証発動：コスト半減】\n' : '') +
      optA.description
        .replace('{name1}', p1Name).replace('{name2}', p2Name)
        .replace('{skill1}', s1).replace('{skill2}', s2)
        .replace(/{debuffTarget}/g, debuffTargetName);

    recordAction({ step: state.currentStep, type: 'choice', choice: 'A', label: optA.label, debuffedName: debuffTargetName, resourceDelta: { hp: -hpCost, food: -foodCost, coins: 0 } });

    showResult(container, node, resultText, node.afterStillA, () => { advanceStep(); renderStep(container); });
  }

  function executeB(sacrificedName: string): void {
    sacrificePersona(sacrificedName, getGameState().currentStep);
    addDiagScores(optB.diagDelta);
    const resultText = optB.description.replace(/{sacrificeName}/g, sacrificedName);
    recordAction({ step: getGameState().currentStep, type: 'choice', choice: 'B', label: optB.label, sacrificedName, resourceDelta: { hp: 0, food: 0, coins: 0 } });
    showResult(container, node, resultText, node.afterStillB, () => { advanceStep(); renderStep(container); });
  }

  renderMain();
}

// ===============================
// バトルノード
// ===============================
function renderBattleNode(container: HTMLElement, node: ScenarioNode): void {
  // スチル表示 → バトル開始
  (async () => {
    // 行動前スチル
    container.innerHTML = `${buildHUD(node)}<div class="scene scene-${node.stage}"><div class="bg-overlay"></div><div class="maze-content"><p class="maze-prompt" id="pre-battle-text"></p></div></div>`;
    const el = document.getElementById('pre-battle-text');
    if (el) await typewriter(el, node.situation, 25);
    await sleep(1500);

    startBattle(container, node, (outcome, _actionId) => {
      const afterStill = outcome === 'fled' ? node.afterStillFlee : node.afterStillFight;
      const text = outcome === 'victory' ? (node.options.find(o=>o.id==='fight')?.successText || '戦いに勝利した。') : outcome === 'fled' ? (node.options.find(o=>o.id==='flee')?.description || '逃げ切った。') : (node.options.find(o=>o.id==='fight')?.failureText || '敗北した。');
      showResult(container, node, text, afterStill, () => { advanceStep(); renderStep(container); });
    });
  })();
}

// ===============================
// イベントノード
// ===============================
function renderEvent(container: HTMLElement, node: ScenarioNode): void {
  const state = getGameState();

  container.innerHTML = `
    ${buildHUD(node)}
    <div class="scene scene-${node.stage}">
      <div class="bg-overlay"></div>
      <div class="maze-content">
        <div class="node-label">🌿 ${node.title}</div>
        <p class="maze-prompt" id="event-text"></p>
        <div class="event-options">
          ${node.options.map(o => `<button class="btn-event" id="ev-${o.id}">${o.label}</button>`).join('')}
        </div>
      </div>
    </div>
  `;
  const el = document.getElementById('event-text');
  if (el) sleep(200).then(() => typewriter(el, node.situation, 25));

  node.options.forEach(opt => {
    document.getElementById(`ev-${opt.id}`)?.addEventListener('click', () => {
      if (opt.hpCost) applyResourceDelta({ hp: -opt.hpCost });
      if (opt.foodCost) applyResourceDelta({ food: -opt.foodCost });
      if (opt.coinGain) applyResourceDelta({ coins: opt.coinGain });
      addDiagScores(opt.diagDelta);
      recordAction({ step: state.currentStep, type: 'event', choice: opt.id, label: opt.label, resourceDelta: { hp: -(opt.hpCost||0), food: -(opt.foodCost||0), coins: opt.coinGain||0 } });
      showResult(container, node, opt.description, undefined, () => { advanceStep(); renderStep(container); });
    });
  });
}

// ===============================
// ショップノード
// ===============================
function renderShop(container: HTMLElement, node: ScenarioNode): void {
  const state = getGameState();

  container.innerHTML = `
    ${buildHUD(node)}
    <div class="scene scene-${node.stage}">
      <div class="bg-overlay"></div>
      <div class="maze-content">
        <div class="node-label">🛒 ${node.title}</div>
        <p class="maze-prompt" id="shop-text"></p>
        <div class="shop-grid">
          ${node.options.filter(o=>o.id!=='skip').map(o => `
            <div class="shop-item-card">
              <div class="shop-item-label">${o.label}</div>
              <button class="btn-shop" id="shop-${o.id}" ${o.coinCost && o.coinCost > state.coins ? 'disabled' : ''}>
                ${o.coinCost ? `🪙 ${o.coinCost}枚` : '無料'}
                ${o.coinCost && o.coinCost > state.coins ? '<br>（資金不足）' : ''}
              </button>
            </div>
          `).join('')}
        </div>
        <button class="btn-secondary" id="shop-skip">何も買わず進む</button>
      </div>
    </div>
  `;

  const el = document.getElementById('shop-text');
  if (el) sleep(200).then(() => typewriter(el, node.situation, 20));

  node.options.filter(o=>o.id!=='skip').forEach(opt => {
    document.getElementById(`shop-${opt.id}`)?.addEventListener('click', () => {
      if (opt.coinCost) applyResourceDelta({ coins: -opt.coinCost });
      if (opt.hpCost && opt.hpCost < 0) applyResourceDelta({ hp: -opt.hpCost });
      if (opt.itemGain) addItem(opt.itemGain);
      addDiagScores(opt.diagDelta);
      recordAction({ step: state.currentStep, type: 'shop', choice: opt.id, label: opt.label, resourceDelta: { hp: 0, food: 0, coins: -(opt.coinCost||0) } });
      showResult(container, node, opt.description, undefined, () => { advanceStep(); renderStep(container); });
    });
  });

  const skipOpt = node.options.find(o=>o.id==='skip');
  document.getElementById('shop-skip')?.addEventListener('click', () => {
    if (skipOpt) addDiagScores(skipOpt.diagDelta);
    recordAction({ step: state.currentStep, type: 'shop', choice: 'skip', label: '何も買わない', resourceDelta: { hp: 0, food: 0, coins: 0 } });
    advanceStep();
    renderStep(container);
  });
}

// ===============================
// アンカーノード
// ===============================
function renderAnchor(container: HTMLElement, node: ScenarioNode): void {
  container.innerHTML = `
    ${buildHUD(node)}
    <div class="scene scene-ruins" id="anchor-scene">
      <div class="bg-overlay finale-overlay"></div>
      <div class="maze-bocca-container active">
        <div class="bocca-mouth">
          <div class="mouth-outer"><div class="mouth-inner"><div class="tongue"></div></div></div>
          <div class="eye eye-left"></div>
          <div class="eye eye-right"></div>
        </div>
      </div>
      <div class="maze-content">
        <div class="node-label anchor-label">——真実の口が問う——</div>
        <p class="maze-prompt anchor-text" id="anchor-text"></p>
        <div class="anchor-options">
          ${node.options.map(o => `<button class="btn-anchor" id="anchor-${o.id}">${o.label}</button>`).join('')}
        </div>
      </div>
    </div>
  `;

  const el = document.getElementById('anchor-text');
  if (el) sleep(300).then(() => typewriter(el, node.situation, 30));

  node.options.forEach(opt => {
    document.getElementById(`anchor-${opt.id}`)?.addEventListener('click', () => {
      setAnchorMotivation(opt.id as any);
      addDiagScores(opt.diagDelta);
      recordAction({ step: getGameState().currentStep, type: 'anchor', choice: opt.id, label: opt.label, resourceDelta: { hp: 0, food: 0, coins: 0 } });
      showResult(container, node, opt.description, undefined, () => { advanceStep(); renderStep(container); });
    });
  });
}

// ===============================
// 最終供物（特殊インタラクション）
// ===============================
function renderFinalSacrifice(container: HTMLElement, node: ScenarioNode): void {
  const optA = node.options.find(o => o.id === 'A')!;
  const optB = node.options.find(o => o.id === 'B')!;
  const state = getGameState();
  const alive = state.personas.filter(p => p.isAlive);

  container.innerHTML = `
    ${buildHUD(node)}
    <div class="scene scene-ruins" id="final-scene">
      <div class="bg-overlay finale-overlay"></div>
      <div class="maze-bocca-container active final-bocca">
        <div class="bocca-mouth bocca-open">
          <div class="mouth-outer"><div class="mouth-inner"><div class="tongue"></div></div></div>
          <div class="eye eye-left"></div>
          <div class="eye eye-right"></div>
        </div>
      </div>
      <div class="maze-content">
        <div class="node-label">— ${node.title} —</div>
        <p class="maze-prompt" id="final-prompt"></p>
        <div class="final-choices">
          <div class="final-choice-a">
            <button class="btn-choice btn-final-a" id="btn-final-a">${optA.label}</button>
          </div>
          <div class="choice-divider">OR</div>
          <div class="final-choice-b">
            <p class="final-choice-hint">最後まで残った従者をBOCCAの口に捧げる</p>
            <div class="final-servants">
              ${alive.map(p => {
                const vessel = SKILL_VESSELS.find(v => v.id === p.skillId);
                return `<div class="final-servant-drag" id="fsd-${p.customName}" data-name="${p.customName}" draggable="true">${vessel?.symbol || '?'} ${p.customName}</div>`;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const el = document.getElementById('final-prompt');
  if (el) sleep(300).then(() => typewriter(el, node.situation, 28));

  // A選択
  document.getElementById('btn-final-a')?.addEventListener('click', () => {
    applyResourceDelta({ hp: -(optA.hpCost || 9) });
    addDiagScores(optA.diagDelta);
    recordAction({ step: state.currentStep, type: 'choice', choice: 'A', label: optA.label, resourceDelta: { hp: -(optA.hpCost||9), food: 0, coins: 0 } });
    snapshotFinalStatus();
    showResult(container, node, optA.description, node.afterStillA, () => finishGame(container));
  });

  // B選択（ドラッグ）
  startDragSacrifice(container, { ...node, interactionType: 'dragSacrifice' }, optB, (sacrificedName) => {
    sacrificePersona(sacrificedName, state.currentStep);
    addDiagScores(optB.diagDelta);
    const text = optB.description.replace(/{sacrificeName}/g, sacrificedName);
    recordAction({ step: state.currentStep, type: 'choice', choice: 'B', label: optB.label, sacrificedName, resourceDelta: { hp: 0, food: 0, coins: 0 } });
    snapshotFinalStatus();
    showResult(container, node, text, node.afterStillB, () => finishGame(container));
  });
}

// ===============================
// ダイアログノード
// ===============================
function renderDialogue(container: HTMLElement, node: ScenarioNode): void {
  const state = getGameState();
  const persona1 = state.personas.find(p => p.isAlive)?.customName ?? '従者';
  const text = node.situation.replace('{firstServant}', persona1);

  container.innerHTML = `
    ${buildHUD(node)}
    <div class="scene scene-${node.stage}">
      <div class="particles-container" id="maze-particles"></div>
      <div class="bg-overlay"></div>
      <div class="maze-content">
        <div class="node-label">— ${node.title} —</div>
        <p class="maze-prompt" id="dialogue-text"></p>
        <button class="btn-primary" id="btn-next">▷ 先へ進む</button>
      </div>
    </div>
  `;
  createParticles(document.getElementById('maze-particles')!, 12);
  const el = document.getElementById('dialogue-text');
  if (el) sleep(200).then(() => typewriter(el, text, 30));
  document.getElementById('btn-next')?.addEventListener('click', () => { advanceStep(); renderStep(container); });
}

// ===============================
// ゲームオーバー
// ===============================
function checkGameOver(container: HTMLElement): boolean {
  const state = getGameState();
  if (state.hp > 0) return false;

  container.innerHTML = `
    <div class="scene scene-ruins">
      <div class="bg-overlay finale-overlay"></div>
      <div class="gameover-content">
        <div class="gameover-title">——力尽きた——</div>
        <p class="gameover-text">真実の口に辿り着く前に、あなたは倒れた。\nしかし、記録は残る。</p>
        <button class="btn-primary" id="btn-still-diagnose">記録を見る</button>
        <button class="btn-secondary" id="btn-retry">もう一度</button>
      </div>
    </div>
  `;
  snapshotFinalStatus();
  document.getElementById('btn-still-diagnose')?.addEventListener('click', () => navigateTo('finale'));
  document.getElementById('btn-retry')?.addEventListener('click', () => {
    resetGameState();
    navigateTo('title');
  });
  return true;
}

// ===============================
// ゲームクリア → フィナーレへ
// ===============================
function finishGame(_container: HTMLElement): void {
  snapshotFinalStatus();
  navigateTo('finale');
}
