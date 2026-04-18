// BOCCA — メインゲームループ（全26ステップ対応版）

import { SCENARIO } from '../data/scenarioData';
import type { ScenarioNode } from '../data/scenarioData';
import { SKILL_VESSELS } from '../data/personas';
import type { CustomPersona } from '../data/personas';
import {
  getGameState,
  navigateTo,
  addMBTIPoints,
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
} from '../utils/gameState';
import { playAmbienceForScene, playSFX } from '../utils/audio';

export function renderMazeScene(container: HTMLElement): void {
  // 最初のシーンBGM
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

  // BGM切り替え
  if (node.stage === 'city') playAmbienceForScene('city');
  if (node.stage === 'ruins') playAmbienceForScene('space');

  // 移動時の食料消費
  if (node.foodCostOnMove > 0) {
    for (let i = 0; i < node.foodCostOnMove; i++) {
      consumeFoodForMove();
    }
  }

  // ゲームオーバーチェック
  if (checkGameOver(container)) return;

  // ノードタイプに応じて描画
  switch (node.type) {
    case 'dialogue':
      renderDialogue(container, node);
      break;
    case 'choice':
      renderChoice(container, node);
      break;
    case 'battle':
      renderBattle(container, node);
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
// HUD（常時表示リソースバー）
// ===============================

function buildHUD(): string {
  const state = getGameState();
  const alive = state.personas.filter(p => p.isAlive);
  const remaining = state.totalSteps - state.currentStep;
  const stageLabel = state.stage === 'forest' ? '🌲 森' : state.stage === 'city' ? '🌆 都市' : '👁️ 遺跡';

  return `
    <div class="maze-hud" id="maze-hud">
      <div class="hud-stage">${stageLabel}</div>
      <div class="hud-resources">
        <span class="hud-item hud-hp ${state.hp <= 3 ? 'hud-danger' : ''}">❤️ ${state.hp}/${state.maxHp}</span>
        <span class="hud-item hud-food ${state.food <= 2 ? 'hud-danger' : ''}">🍞 ${state.food}</span>
        <span class="hud-item hud-coins">🪙 ${state.coins}</span>
        <span class="hud-item hud-personas">👥 ${alive.length}体</span>
      </div>
      <div class="hud-steps">
        <span class="hud-steps-label">真実の口まで</span>
        <span class="hud-steps-count hud-danger">${remaining}</span>
        <span class="hud-steps-label">歩</span>
      </div>
    </div>
  `;
}

// ===============================
// 従者（生存中）のカード描画
// ===============================

function buildPersonaCards(selectable = false, selectedIds: string[] = [], debuffed: string[] = []): string {
  const state = getGameState();
  const alive = state.personas.filter(p => p.isAlive);
  return alive.map((p, i) => {
    const vessel = SKILL_VESSELS.find(v => v.id === p.skillId);
    const debuffs = p.debuffs.length > 0 ? `<div class="persona-debuffs">${p.debuffs.map(d => `<span class="debuff-badge">${d}</span>`).join('')}</div>` : '';
    const isSelected = selectedIds.includes(p.customName);
    const isDisabled = p.debuffs.length > 0 && debuffed.includes(p.customName);
    return `
      <div class="maze-persona-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'debuffed-disabled' : ''}"
           data-name="${p.customName}" data-skill="${p.skillId}" id="pcard-${i}">
        <div class="maze-persona-inner">
          <div class="maze-symbol">${vessel?.symbol || '?'}</div>
          <div class="maze-name">${p.customName}</div>
          <div class="maze-skill">${vessel?.attributeEmoji || ''} ${vessel?.name || ''}</div>
          ${debuffs}
          ${selectable ? `<div class="maze-select-ring"></div>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// ===============================
// 会話（Dialogue）
// ===============================

function renderDialogue(container: HTMLElement, node: ScenarioNode): void {
  const state = getGameState();
  const persona1 = state.personas.find(p => p.isAlive)?.customName ?? '従者';
  const text = node.situation.replace('{firstServant}', persona1);

  container.innerHTML = `
    ${buildHUD()}
    <div class="scene scene-${node.stage}" id="scene-maze">
      <div class="particles-container" id="maze-particles"></div>
      <div class="bg-overlay urgency-1"></div>
      <div class="maze-content">
        <div class="node-label">— ${node.title} —</div>
        <div class="dialogue-box">
          <p class="dialogue-text" id="dialogue-text"></p>
        </div>
        <button class="btn-primary btn-next" id="btn-next">
          <span class="btn-icon">▷</span> 先へ進む
        </button>
      </div>
    </div>
  `;
  createParticles(document.getElementById('maze-particles')!, 15);

  const el = document.getElementById('dialogue-text');
  if (el) sleep(200).then(() => typewriter(el, text, 30));

  document.getElementById('btn-next')?.addEventListener('click', () => {
    addMBTIPoints(node.options[0]?.mbtiDelta || {});
    recordAction({
      step: state.currentStep,
      type: 'dialogue',
      choice: 'proceed',
      label: '進行',
      resourceDelta: { hp: 0, food: -node.foodCostOnMove, coins: 0 },
    });
    advanceStep();
    renderStep(container);
  });
}

// ===============================
// 選択（Choice: A=組み合わせ / B=犠牲）
// ===============================

function renderChoice(container: HTMLElement, node: ScenarioNode): void {
  const state = getGameState();
  const alive = state.personas.filter(p => p.isAlive);
  const optA = node.options.find(o => o.id === 'A')!;
  const optB = node.options.find(o => o.id === 'B')!;

  let selectedForA: CustomPersona[] = [];
  let selectedForSacrifice: CustomPersona | null = null;

  function renderMain(): void {
    container.innerHTML = `
      ${buildHUD()}
      <div class="scene scene-${node.stage}" id="scene-maze">
        <div class="particles-container" id="maze-particles"></div>
        <div class="bg-overlay urgency-${Math.ceil(state.currentStep / 7)}"></div>
        <div class="maze-content">
          <div class="node-label">— ${node.title} —</div>
          <div class="maze-prompt-container">
            <div class="maze-prompt-icon">⧖</div>
            <p class="maze-prompt" id="maze-prompt"></p>
          </div>
          <div class="choice-actions">
            <div class="choice-card choice-a">
              <div class="choice-header">A. 組み合わせ</div>
              <div class="choice-cost">
                ${optA.hpCost ? `<span class="cost-item cost-bad">❤️ -${optA.hpCost}</span>` : ''}
                ${optA.foodCost ? `<span class="cost-item cost-bad">🍞 -${optA.foodCost}</span>` : ''}
                <span class="cost-item cost-warn">👥 1体デバフ（${optA.debuffType || ''}）</span>
              </div>
              <p class="choice-desc">${optA.label}</p>
              <button class="btn-choice btn-a" id="btn-a">従者を2体選んで実行</button>
            </div>
            <div class="choice-divider">OR</div>
            <div class="choice-card choice-b">
              <div class="choice-header">B. 犠牲</div>
              <div class="choice-cost">
                <span class="cost-item cost-bad">💀 従者1体ロスト</span>
                <span class="cost-item cost-good">コスト不要</span>
              </div>
              <p class="choice-desc">${optB.label}</p>
              <button class="btn-choice btn-b" id="btn-b">犠牲にする従者を選ぶ</button>
            </div>
          </div>
        </div>
      </div>
    `;
    createParticles(document.getElementById('maze-particles')!, 15);
    const el = document.getElementById('maze-prompt');
    if (el) sleep(200).then(() => typewriter(el, node.situation, 25));

    document.getElementById('btn-a')?.addEventListener('click', () => {
      renderSelectA();
    });
    document.getElementById('btn-b')?.addEventListener('click', () => {
      renderSelectB();
    });
  }

  function renderSelectA(): void {
    selectedForA = [];
    container.innerHTML = `
      ${buildHUD()}
      <div class="scene scene-${node.stage}">
        <div class="bg-overlay"></div>
        <div class="maze-content">
          <div class="node-label">従者を2体選んでください</div>
          <p class="select-hint-text">選んだ2体のスキルを組み合わせて突破します。1体は別の従者がデバフ（${optA.debuffType}）を受けます。</p>
          <div class="maze-personas" id="persona-select-grid">
            ${buildPersonaCards(true)}
          </div>
          <div class="select-status">選択中: <span id="sel-count">0</span>/2</div>
          <button class="btn-primary" id="btn-confirm-a" disabled>この2体で実行</button>
          <button class="btn-back" id="btn-back">← 戻る</button>
        </div>
      </div>
    `;
    document.getElementById('btn-back')?.addEventListener('click', () => renderMain());
    document.querySelectorAll('.maze-persona-card').forEach(card => {
      card.addEventListener('click', () => {
        const name = card.getAttribute('data-name')!;
        const p = alive.find(a => a.customName === name)!;
        if (selectedForA.find(s => s.customName === name)) {
          selectedForA = selectedForA.filter(s => s.customName !== name);
          card.classList.remove('selected');
        } else if (selectedForA.length < 2) {
          selectedForA.push(p);
          card.classList.add('selected');
        }
        const countEl = document.getElementById('sel-count');
        if (countEl) countEl.textContent = String(selectedForA.length);
        const btn = document.getElementById('btn-confirm-a') as HTMLButtonElement;
        if (btn) btn.disabled = selectedForA.length !== 2;
      });
    });
    document.getElementById('btn-confirm-a')?.addEventListener('click', () => executeA());
  }

  function renderSelectB(): void {
    container.innerHTML = `
      ${buildHUD()}
      <div class="scene scene-${node.stage}">
        <div class="bg-overlay"></div>
        <div class="maze-content">
          <div class="node-label">犠牲にする従者を選んでください</div>
          <p class="select-hint-text warning-text">選んだ従者は永遠に失われます。</p>
          <div class="maze-personas" id="persona-select-grid">
            ${buildPersonaCards(true)}
          </div>
          <button class="btn-primary btn-sacrifice-confirm" id="btn-confirm-b" disabled>この従者を犠牲にする</button>
          <button class="btn-back" id="btn-back">← 戻る</button>
        </div>
      </div>
    `;
    document.getElementById('btn-back')?.addEventListener('click', () => renderMain());
    document.querySelectorAll('.maze-persona-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.maze-persona-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const name = card.getAttribute('data-name')!;
        selectedForSacrifice = alive.find(a => a.customName === name)!;
        const btn = document.getElementById('btn-confirm-b') as HTMLButtonElement;
        if (btn) btn.disabled = false;
      });
    });
    document.getElementById('btn-confirm-b')?.addEventListener('click', () => executeB());
  }

  function executeA(): void {
    const [p1, p2] = selectedForA;
    const s1 = SKILL_VESSELS.find(v => v.id === p1.skillId)?.name || '';
    const s2 = SKILL_VESSELS.find(v => v.id === p2.skillId)?.name || '';
    const freshState = getGameState();
    const aliveNow = freshState.personas.filter(p => p.isAlive);
    const debuffTarget = aliveNow.find(p => p.customName !== p1.customName && p.customName !== p2.customName);
    const debuffTargetName = debuffTarget?.customName || '（他の従者）';

    if (optA.hpCost) applyResourceDelta({ hp: -optA.hpCost });
    if (optA.foodCost) applyResourceDelta({ food: -optA.foodCost });
    if (debuffTarget && optA.debuffType) applyDebuff(debuffTarget.customName, optA.debuffType);
    addMBTIPoints(optA.mbtiDelta);

    const resultText = optA.description
      .replace('{skill1}', s1)
      .replace('{skill2}', s2)
      .replace('{debuffTarget}', debuffTargetName)
      .replace(/{debuffTarget}/g, debuffTargetName);

    recordAction({
      step: freshState.currentStep,
      type: 'choice',
      choice: 'A',
      label: optA.label,
      debuffedName: debuffTargetName,
      resourceDelta: { hp: -(optA.hpCost || 0), food: -(optA.foodCost || 0), coins: 0 },
    });

    showResult(container, node, resultText, () => { advanceStep(); renderStep(container); });
  }

  function executeB(): void {
    if (!selectedForSacrifice) return;
    const sacrificeName = selectedForSacrifice.customName;
    playSFX('sacrifice');
    const resultText = optB.description
      .replace(/{sacrificeName}/g, sacrificeName);

    sacrificePersona(sacrificeName, getGameState().currentStep);
    addMBTIPoints(optB.mbtiDelta);
    recordAction({
      step: getGameState().currentStep,
      type: 'choice',
      choice: 'B',
      label: optB.label,
      sacrificedName: sacrificeName,
      resourceDelta: { hp: 0, food: 0, coins: 0 },
    });

    showResult(container, node, resultText, () => { advanceStep(); renderStep(container); });
  }

  renderMain();
}

// ===============================
// バトル（Battle）
// ===============================

function renderBattle(container: HTMLElement, node: ScenarioNode): void {
  const state = getGameState();
  const fightOpt = node.options.find(o => o.type === 'fight')!;
  const fleeOpt = node.options.find(o => o.type === 'flee' || o.type === 'accept')!;

  container.innerHTML = `
    ${buildHUD()}
    <div class="scene scene-${node.stage}" id="scene-maze">
      <div class="particles-container" id="maze-particles"></div>
      <div class="bg-overlay urgency-${Math.ceil(state.currentStep / 7)}"></div>
      <div class="maze-content">
        <div class="node-label battle-label">⚔️ ${node.title}</div>
        <p class="maze-prompt" id="battle-text"></p>
        <div class="battle-options">
          <div class="battle-card">
            <div class="battle-option-label">【戦う】</div>
            <div class="battle-risk">${fightOpt.riskLabel || ''}</div>
            <button class="btn-battle btn-fight" id="btn-fight">${fightOpt.label}</button>
          </div>
          <div class="battle-card">
            <div class="battle-option-label">【逃げる】</div>
            <div class="battle-risk">${fleeOpt.riskLabel || ''}</div>
            <button class="btn-battle btn-flee" id="btn-flee">${fleeOpt.label}</button>
          </div>
        </div>
      </div>
    </div>
  `;
  createParticles(document.getElementById('maze-particles')!, 10);
  const el = document.getElementById('battle-text');
  if (el) sleep(200).then(() => typewriter(el, node.situation, 25));

  document.getElementById('btn-fight')?.addEventListener('click', () => {
    const success = Math.random() < (fightOpt.successChance ?? 0.5);
    if (fightOpt.hpCost && success) applyResourceDelta({ hp: -fightOpt.hpCost });
    if (fightOpt.hpCost && !success) applyResourceDelta({ hp: -(fightOpt.hpCost) });
    if (fightOpt.coinGain && success) applyResourceDelta({ coins: fightOpt.coinGain });
    addMBTIPoints(fightOpt.mbtiDelta);
    recordAction({
      step: state.currentStep, type: 'battle', choice: 'fight',
      label: fightOpt.label,
      resourceDelta: { hp: -(fightOpt.hpCost || 0), food: 0, coins: fightOpt.coinGain && success ? fightOpt.coinGain : 0 },
    });
    const text = success ? fightOpt.successText! : fightOpt.failureText!;
    showResult(container, node, text, () => { advanceStep(); renderStep(container); });
  });

  document.getElementById('btn-flee')?.addEventListener('click', () => {
    if (fleeOpt.hpCost) applyResourceDelta({ hp: -fleeOpt.hpCost });
    if (fleeOpt.foodCost) applyResourceDelta({ food: -fleeOpt.foodCost });
    if (fleeOpt.coinCost) {
      // 資金半減（スラムの暴漢など）
      const cur = getGameState().coins;
      applyResourceDelta({ coins: -(Math.floor(cur / 2)) });
    }
    addMBTIPoints(fleeOpt.mbtiDelta);
    recordAction({
      step: state.currentStep, type: 'battle', choice: fleeOpt.id,
      label: fleeOpt.label,
      resourceDelta: { hp: -(fleeOpt.hpCost || 0), food: -(fleeOpt.foodCost || 0), coins: 0 },
    });
    showResult(container, node, fleeOpt.description, () => { advanceStep(); renderStep(container); });
  });
}

// ===============================
// 買い物（Shop）
// ===============================

function renderShop(container: HTMLElement, node: ScenarioNode): void {
  const state = getGameState();

  const itemsHTML = node.options.map(opt => `
    <div class="shop-item">
      <div class="shop-item-label">${opt.label}</div>
      <button class="btn-shop" id="shop-${opt.id}"
        ${opt.coinCost && opt.coinCost > state.coins ? 'disabled' : ''}>
        ${opt.coinCost ? `🪙 ${opt.coinCost}枚` : '無料'}${opt.coinCost && opt.coinCost > state.coins ? '（資金不足）' : ''}
      </button>
    </div>
  `).join('');

  container.innerHTML = `
    ${buildHUD()}
    <div class="scene scene-${node.stage}">
      <div class="bg-overlay"></div>
      <div class="maze-content">
        <div class="node-label">🛒 ${node.title}</div>
        <p class="maze-prompt shop-situation" id="shop-text"></p>
        <div class="shop-grid">${itemsHTML}</div>
        <button class="btn-skip" id="btn-skip">何も買わず進む</button>
      </div>
    </div>
  `;

  const el = document.getElementById('shop-text');
  if (el) sleep(200).then(() => typewriter(el, node.situation, 20));

  node.options.forEach(opt => {
    document.getElementById(`shop-${opt.id}`)?.addEventListener('click', () => {
      if (opt.coinCost) applyResourceDelta({ coins: -opt.coinCost });
      if (opt.coinGain) applyResourceDelta({ coins: opt.coinGain });
      if (opt.hpCost && opt.hpCost < 0) applyResourceDelta({ hp: -opt.hpCost }); // マイナス=回復
      if (opt.id === 'buy1' && node.id === 9) {
        // 全体回復薬: デバフ全クリア
        getGameState().personas.forEach(p => { p.debuffs = []; });
      }
      addMBTIPoints(opt.mbtiDelta);
      recordAction({
        step: state.currentStep, type: 'shop', choice: opt.id,
        label: opt.label,
        resourceDelta: { hp: 0, food: 0, coins: -(opt.coinCost || 0) },
      });
      showResult(container, node, opt.description, () => { advanceStep(); renderStep(container); });
    });
  });

  document.getElementById('btn-skip')?.addEventListener('click', () => {
    addMBTIPoints({ S: 1 });
    recordAction({
      step: state.currentStep, type: 'shop', choice: 'skip',
      label: '何も買わない',
      resourceDelta: { hp: 0, food: 0, coins: 0 },
    });
    advanceStep();
    renderStep(container);
  });
}

// ===============================
// イベント（Event）
// ===============================

function renderEvent(container: HTMLElement, node: ScenarioNode): void {
  const state = getGameState();

  const optionsHTML = node.options.map(opt => `
    <button class="btn-event" id="event-${opt.id}">${opt.label}</button>
  `).join('');

  container.innerHTML = `
    ${buildHUD()}
    <div class="scene scene-${node.stage}">
      <div class="bg-overlay"></div>
      <div class="maze-content">
        <div class="node-label">🌿 ${node.title}</div>
        <p class="maze-prompt" id="event-text"></p>
        <div class="event-options">${optionsHTML}</div>
      </div>
    </div>
  `;

  const el = document.getElementById('event-text');
  if (el) sleep(200).then(() => typewriter(el, node.situation, 25));

  node.options.forEach(opt => {
    document.getElementById(`event-${opt.id}`)?.addEventListener('click', () => {
      if (opt.hpCost) applyResourceDelta({ hp: -opt.hpCost });
      if (opt.foodCost) applyResourceDelta({ food: -opt.foodCost });
      if (opt.coinGain) applyResourceDelta({ coins: opt.coinGain });
      addMBTIPoints(opt.mbtiDelta);
      recordAction({
        step: state.currentStep, type: 'event', choice: opt.id,
        label: opt.label,
        resourceDelta: { hp: -(opt.hpCost || 0), food: -(opt.foodCost || 0), coins: opt.coinGain || 0 },
      });
      showResult(container, node, opt.description, () => { advanceStep(); renderStep(container); });
    });
  });
}

// ===============================
// アンカー（Anchor）— 動機の問い
// ===============================

function renderAnchor(container: HTMLElement, node: ScenarioNode): void {
  const state = getGameState();

  const optionsHTML = node.options.map(opt => `
    <button class="btn-anchor" id="anchor-${opt.id}">${opt.label}</button>
  `).join('');

  container.innerHTML = `
    ${buildHUD()}
    <div class="scene scene-ruins">
      <div class="bg-overlay finale-overlay"></div>
      <div class="maze-bocca-container active" style="position:relative;transform:none;opacity:1;margin:0 auto 2rem;">
        <div class="bocca-mouth">
          <div class="mouth-outer">
            <div class="mouth-inner"><div class="tongue"></div></div>
          </div>
          <div class="eye eye-left"></div>
          <div class="eye eye-right"></div>
        </div>
      </div>
      <div class="maze-content">
        <div class="node-label anchor-label">——真実の口が問う——</div>
        <p class="maze-prompt anchor-text" id="anchor-text"></p>
        <div class="anchor-options">${optionsHTML}</div>
      </div>
    </div>
  `;

  const el = document.getElementById('anchor-text');
  if (el) sleep(300).then(() => typewriter(el, node.situation, 30));

  node.options.forEach(opt => {
    document.getElementById(`anchor-${opt.id}`)?.addEventListener('click', () => {
      // アンカーの記録
      if (opt.id === 'survival' || opt.id === 'protect' || opt.id === 'curiosity') {
        setAnchorMotivation(opt.id);
      }
      addMBTIPoints(opt.mbtiDelta);
      recordAction({
        step: state.currentStep, type: 'event', choice: opt.id,
        label: opt.label,
        resourceDelta: { hp: 0, food: 0, coins: 0 },
      });
      showResult(container, node, opt.description, () => { advanceStep(); renderStep(container); });
    });
  });
}

// ===============================
// 結果テキスト表示（共通）
// ===============================

function showResult(container: HTMLElement, node: ScenarioNode, text: string, onNext: () => void): void {
  container.innerHTML = `
    ${buildHUD()}
    <div class="scene scene-${node.stage}">
      <div class="bg-overlay dark-overlay"></div>
      <div class="maze-content">
        <div class="result-box" id="result-box" style="opacity:0">
          <p class="result-text" id="result-text"></p>
        </div>
        <button class="btn-primary btn-continue" id="btn-continue" style="opacity:0">
          <span class="btn-icon">▷</span> 続ける
        </button>
      </div>
    </div>
  `;

  const boxEl = document.getElementById('result-box');
  const btnEl = document.getElementById('btn-continue');
  const textEl = document.getElementById('result-text');

  sleep(300).then(async () => {
    if (boxEl) await fadeIn(boxEl, 600);
    if (textEl) await typewriter(textEl, text, 28);
    await sleep(400);
    if (btnEl) await fadeIn(btnEl, 400);
    document.getElementById('btn-continue')?.addEventListener('click', onNext);
  });
}

// ===============================
// ゲームオーバーチェック
// ===============================

function checkGameOver(container: HTMLElement): boolean {
  const state = getGameState();
  if (state.hp <= 0) {
    renderGameOver(container, 'HPが尽きた');
    return true;
  }
  const alive = state.personas.filter(p => p.isAlive);
  if (alive.length === 0 && state.currentStep < SCENARIO.length - 3) {
    renderGameOver(container, '全ての従者を失った');
    return true;
  }
  return false;
}

function renderGameOver(container: HTMLElement, reason: string): void {
  container.innerHTML = `
    <div class="scene scene-ruins">
      <div class="bg-overlay dark-overlay"></div>
      <div class="maze-content gameover-content">
        <div class="gameover-icon">💀</div>
        <h2 class="gameover-title">— お前の旅は、ここで終わる —</h2>
        <p class="gameover-reason">${reason}</p>
        <p class="gameover-sub">しかし、真実の口はお前の記録を既に読み終えている。</p>
        <button class="btn-primary" id="btn-gameover-result">それでも、診断結果を見る</button>
        <button class="btn-secondary" id="btn-gameover-retry">最初からやり直す</button>
      </div>
    </div>
  `;
  document.getElementById('btn-gameover-result')?.addEventListener('click', () => finishGame(container));
  document.getElementById('btn-gameover-retry')?.addEventListener('click', () => {
    window.location.reload();
  });
}

// ===============================
// ゲーム終了 → 診断へ
// ===============================

function finishGame(_container: HTMLElement): void {
  snapshotFinalStatus();
  playAmbienceForScene('space');
  navigateTo('finale');
}
