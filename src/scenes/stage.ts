// Bucca ステージシーン（ST-01 〜 ST-09）

import {
  navigateTo, getState, resetGameState, changeHp, sacrificeServant, recordStageResult,
  advanceStage, sleep, typewriter, createParticles, addGold,
} from '../utils/gameState';
import { findByDimension, TAROT_SYMBOLS, type TarotServant } from '../data/tarot';
import { STAGES } from '../data/stages';
import { LEVER_CONFIG } from '../data/levers';
import { playSFX } from '../utils/audio';

// ===============================
// 共通ヘルパー
// ===============================

function hpBarHTML(hp: number, maxHp: number): string {
  const pct = Math.max(0, Math.round((hp / maxHp) * 100));
  return `
    <div class="hp-bar-container">
      <div class="hp-bar-fill" style="width:${pct}%" id="hp-fill"></div>
    </div>
    <span class="stage-hp-value" id="hp-value">${hp}/${maxHp}</span>
  `;
}

function updateHpDisplay(): void {
  const state = getState();
  const fill = document.getElementById('hp-fill');
  const value = document.getElementById('hp-value');
  if (fill) fill.style.width = `${Math.max(0, Math.round((state.hp / state.maxHp) * 100))}%`;
  if (value) value.textContent = `${state.hp}/${state.maxHp}`;
}

function flashDamage(): void {
  const scene = document.getElementById('scene-stage');
  if (!scene) return;
  scene.classList.add('damage-flash');
  setTimeout(() => scene.classList.remove('damage-flash'), 220);
}

function stageLayout(stageId: number, stageName: string, area: string): string {
  const state = getState();
  return `
    <div class="scene scene-stage" id="scene-stage">
      <div class="bg-overlay"></div>
      <div class="particles-container" id="stage-particles"></div>
      <div class="stage-header">
        <div class="stage-header-left">
          <span class="stage-num">ST-${String(stageId).padStart(2, '0')}</span>
          <span class="stage-name">${stageName}</span>
          <span class="stage-area">${area}</span>
        </div>
        <div class="stage-hp-wrap">
          <span class="stage-hp-label">HP</span>
          ${hpBarHTML(state.hp, state.maxHp)}
        </div>
      </div>
      <div class="stage-body" id="stage-body">
        <div class="stage-narrative" id="stage-narrative"></div>
        <div class="stage-mechanic" id="stage-mechanic"></div>
      </div>
    </div>
  `;
}

async function narrateText(text: string, speed = 40): Promise<void> {
  const el = document.getElementById('stage-narrative');
  if (el) await typewriter(el, text, speed);
}

function setMechanic(html: string): void {
  const el = document.getElementById('stage-mechanic');
  if (el) el.innerHTML = html;
}

function aliveServants(): TarotServant[] {
  return getState().aliveServants;
}

function proceedNext(container: HTMLElement): void {
  const state = getState();
  if (state.gameOver) { showGameOver(container); return; }
  if (state.currentStage >= 9) {
    navigateTo('finale');
  } else {
    advanceStage();
    renderStageScene(container);
  }
}

// Servant selection modal - returns servant id or -1 for cancel
function showServantSelectModal(title: string): Promise<number> {
  return new Promise(resolve => {
    const alive = aliveServants();
    if (alive.length === 0) { resolve(-1); return; }

    const overlay = document.createElement('div');
    overlay.className = 'servant-select-overlay';
    overlay.innerHTML = `
      <div class="servant-select-modal">
        <h3 class="servant-modal-title">${title}</h3>
        <p class="servant-modal-desc">犠牲にする従者を選んでください</p>
        <div class="servant-modal-list" id="servant-modal-list"></div>
        <button class="btn-cancel" id="btn-cancel-sacrifice">キャンセル</button>
      </div>
    `;

    const list = overlay.querySelector('#servant-modal-list')!;
    alive.forEach(s => {
      const btn = document.createElement('button');
      btn.className = 'servant-chip selectable';
      btn.innerHTML = `<span class="chip-symbol">${TAROT_SYMBOLS[s.id] ?? ''}</span><span class="chip-name">${s.name}</span><span class="chip-skill">${s.skill}</span>`;
      btn.addEventListener('click', () => { overlay.remove(); resolve(s.id); });
      list.appendChild(btn);
    });

    overlay.querySelector('#btn-cancel-sacrifice')?.addEventListener('click', () => {
      overlay.remove();
      resolve(-1);
    });

    document.body.appendChild(overlay);
  });
}


// Game over screen
function showGameOver(container: HTMLElement): void {
  const state = getState();
  state.gameOver = true;
  container.innerHTML = `
    <div class="scene scene-gameover">
      <div class="bg-overlay"></div>
      <div class="gameover-content">
        <h2 class="gameover-title">── 旅の終わり ──</h2>
        <p class="gameover-message" id="go-msg"></p>
        <button class="btn-primary" id="btn-restart" style="margin-top:2rem">もう一度旅に出る</button>
      </div>
    </div>
  `;
  const msg = document.getElementById('go-msg')!;
  typewriter(msg, '力尽きた。あなたの旅はここで終わった。', 60);

  document.getElementById('btn-restart')?.addEventListener('click', () => {
    resetGameState();
    navigateTo('title');
  });
}

function addNextButton(container: HTMLElement, parentEl: HTMLElement): void {
  const btn = document.createElement('button');
  btn.className = 'btn-primary stage-next-btn';
  btn.textContent = '次へ進む';
  btn.addEventListener('click', () => proceedNext(container));
  parentEl.appendChild(btn);
}

// ===============================
// ST-01 茨の泉（耐久長押し）
// ===============================
// 【新メカニクス】
//   押している間  → HPが減る（茨の痛み）
//   押していない間 → 生贄ゲージが上昇
//   生贄ゲージ満杯 → N最低の従者が自動生贄
//   耐久バー満杯   → 生贄なしクリア

async function runStage01(container: HTMLElement): Promise<void> {
  const state = getState();
  const stageData = STAGES[0];
  const cfg = LEVER_CONFIG.endurance.st01;

  container.innerHTML = stageLayout(1, stageData.name, stageData.area);
  createParticles(document.getElementById('stage-particles')!, 20);

  await sleep(300);
  await narrateText(stageData.description, 40);
  await sleep(600);

  // N最低の従者（生贄候補）
  const targetServant = findByDimension(state.aliveServants, 'N', 'min');

  setMechanic(`
    <div class="thorn-scene" id="thorn-scene">
      <div class="thorn-side thorn-left" id="thorn-left"></div>
      <div class="thorn-center">

        <div class="endurance-gauge-row">
          <div class="endurance-gauge-block">
            <p class="gauge-label">耐久（押し続けた時間）</p>
            <div class="progress-bar-container">
              <div class="progress-bar-fill" id="endurance-bar" style="width:0%"></div>
            </div>
            <p class="endurance-label"><span id="endurance-pct">0</span>%</p>
          </div>
          <div class="endurance-gauge-block">
            <p class="gauge-label sacrifice-gauge-label">生贄ゲージ（離している時間）</p>
            <div class="progress-bar-container sacrifice-bar-bg">
              <div class="sacrifice-bar-fill" id="sacrifice-bar" style="width:0%"></div>
            </div>
            <p class="sacrifice-label"><span id="sacrifice-pct">0</span>%</p>
          </div>
        </div>

        <button class="btn-hold-large" id="btn-hold" style="touch-action:none;user-select:none">
          押し続けろ
        </button>
        <p class="mechanic-hint">
          押すと茨に刺さる。<br>離すと口が従者を求める。
        </p>
      </div>
      <div class="thorn-side thorn-right" id="thorn-right"></div>
    </div>
    <div class="stage-result" id="stage-result" style="display:none"></div>
  `);

  let isHolding = false;
  let holdMs = 0;        // 累積押し時間
  let sacrificeMs = 0;   // 累積非押し時間
  let gameActive = true;
  let totalDamage = 0;

  // 押している間のダメージ ticker (100ms)
  const holdTicker = setInterval(() => {
    if (!gameActive || !isHolding) return;

    // 耐久バー更新
    holdMs += 100;
    const endPct = Math.min(100, Math.round((holdMs / cfg.totalDurationMs) * 100));
    const endBar = document.getElementById('endurance-bar');
    const endPctEl = document.getElementById('endurance-pct');
    if (endBar) endBar.style.width = `${endPct}%`;
    if (endPctEl) endPctEl.textContent = String(endPct);

    // ダメージ（押している間）
    const dmgPerTick = Math.ceil(cfg.penaltyHpPerSec * 0.1);
    changeHp(-dmgPerTick);
    totalDamage += dmgPerTick;
    updateHpDisplay();
    flashDamage();

    if (state.hp <= 0) {
      finish(false, true, null);
      return;
    }

    // 耐久クリア
    if (holdMs >= cfg.totalDurationMs) {
      finish(true, false, null);
    }
  }, 100);

  // 押していない間の生贄ゲージ ticker (200ms)
  const sacrificeTicker = setInterval(() => {
    if (!gameActive || isHolding) return;

    sacrificeMs += 200;
    const sacPct = Math.min(100, Math.round((sacrificeMs / cfg.totalDurationMs) * 100));
    const sacBar = document.getElementById('sacrifice-bar');
    const sacPctEl = document.getElementById('sacrifice-pct');
    if (sacBar) sacBar.style.width = `${sacPct}%`;
    if (sacPctEl) sacPctEl.textContent = String(sacPct);

    // 茨を近づける（視覚的脅迫）
    const thornProgress = sacPct;
    const left = document.getElementById('thorn-left');
    const right = document.getElementById('thorn-right');
    if (left) left.style.transform = `translateX(${thornProgress - 100}%)`;
    if (right) right.style.transform = `translateX(${100 - thornProgress}%)`;

    // 生贄ゲージ満杯 → 自動生贄
    if (sacrificeMs >= cfg.totalDurationMs) {
      finish(false, false, targetServant);
    }
  }, 200);

  function finish(endured: boolean, dead: boolean, autoSacServant: TarotServant | null): void {
    if (!gameActive) return;
    gameActive = false;
    clearInterval(holdTicker);
    clearInterval(sacrificeTicker);
    docCleanup();

    if (dead) {
      showGameOver(container);
      return;
    }

    let sacrificed = false;
    let servant: TarotServant | null = null;

    if (!endured && autoSacServant) {
      sacrificed = true;
      servant = autoSacServant;
      sacrificeServant(autoSacServant.id);
      playSFX('sacrifice');
    }

    finishStage01(totalDamage, sacrificed, servant);
  }

  function startHolding(): void {
    if (!gameActive || isHolding) return;
    isHolding = true;
    document.getElementById('btn-hold')?.classList.add('active');
  }

  function stopHolding(): void {
    if (!isHolding) return;
    isHolding = false;
    document.getElementById('btn-hold')?.classList.remove('active');
  }

  function docCleanup(): void {
    document.removeEventListener('mouseup', stopHolding);
    document.removeEventListener('touchend', stopHolding);
  }

  const holdBtn = document.getElementById('btn-hold')!;
  holdBtn.addEventListener('mousedown', startHolding);
  holdBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startHolding(); }, { passive: false });
  document.addEventListener('mouseup', stopHolding);
  document.addEventListener('touchend', stopHolding);

  async function finishStage01(dmg: number, sacrificed: boolean, servant: TarotServant | null): Promise<void> {
    const resultEl = document.getElementById('stage-result')!;
    resultEl.style.display = 'block';
    let msg: string;
    if (sacrificed && servant) {
      msg = `${servant.name}が茨に身を投じた。口はその魂を喰らい、あなたは無傷で抜け出した。`;
    } else {
      msg = `茨に刻まれながらも耐え抜いた。${dmg > 0 ? `HP -${dmg}` : '完璧な耐久。'}`;
    }
    await typewriter(resultEl, msg, 40);

    recordStageResult({
      stageId: 1, stageName: stageData.name,
      outcome: sacrificed ? 'sacrifice' : 'success',
      sacrificedServantName: servant?.name,
      hpDelta: -dmg,
    });

    await sleep(800);
    addNextButton(container, resultEl);
  }
}

// ===============================
// ST-02 オオカミの出現（接近 × リスク報酬）
// ===============================
// 【新メカニクス】
//   狼が画面奥から近づいてくる（SVG拡大）
//   待つほど金貨が増える（リスク報酬）
//   「逃げろ！」で金貨確定、タイミングで逃走成功
//   100%到達（逃げ遅れ）→ ランダム従者がロスト

async function runStage02(container: HTMLElement): Promise<void> {
  const state = getState();
  const stageData = STAGES[1];

  // 接近時間（ミリ秒）
  const APPROACH_DURATION = 12000;
  // 金貨レート: 1秒ごとに加算
  const GOLD_PER_SEC = 5;
  container.innerHTML = stageLayout(2, stageData.name, stageData.area);
  createParticles(document.getElementById('stage-particles')!, 15);

  await sleep(300);
  await narrateText('暗い森の奥から、二つの赤い目が光る。オオカミだ。待てば待つほど報酬は増えるが——逃げ遅れれば喰われる。', 38);
  await sleep(500);

  // E最高の従者（生贄候補：オオカミを引きつける）
  const targetServant = findByDimension(state.aliveServants, 'E', 'max');

  setMechanic(`
    <div class="wolf-approach-scene" id="wolf-scene">
      <div class="wolf-forest-bg"></div>

      <div class="wolf-img-wrap" id="wolf-wrap">
        <img src="/wolf.svg" class="wolf-img" id="wolf-img" alt="wolf" draggable="false"/>
      </div>

      <div class="wolf-danger-bar-wrap">
        <div class="wolf-danger-bar" id="wolf-danger-bar" style="width:0%"></div>
      </div>

      <div class="wolf-hud">
        <div class="wolf-gold-display">
          <span class="wolf-gold-icon">&#x25C6;</span>
          <span class="wolf-gold-label">金貨:</span>
          <span class="wolf-gold-val" id="wolf-gold">0</span>
        </div>
        <div class="wolf-time-display">
          <span class="wolf-time-label" id="wolf-time-label">待機中…</span>
        </div>
      </div>

      <button class="btn-wolf-escape" id="btn-escape">逃げろ！</button>

      ${targetServant ? `
        <div class="sacrifice-quick-btn" style="margin-top:0.5rem">
          <button class="btn-sacrifice" id="btn-sac-02">
            ${targetServant.name} を囮にする（E最高の従者）
          </button>
        </div>
      ` : ''}
    </div>
    <div class="stage-result" id="stage-result" style="display:none"></div>
  `);

  let gameActive = true;
  let elapsedMs = 0;
  let earnedGold = 0;
  let escaped = false;

  // 狼接近アニメーション（rAFループ）
  let lastTick = Date.now();
  let rafId: number;

  function tick(): void {
    if (!gameActive) return;
    const now = Date.now();
    const delta = now - lastTick;
    lastTick = now;
    elapsedMs += delta;

    const progress = Math.min(1, elapsedMs / APPROACH_DURATION);

    // 狼サイズ: 6% → 90%（画面幅比）
    const wolfSize = 6 + progress * 84;
    const wolfEl = document.getElementById('wolf-img');
    if (wolfEl) {
      (wolfEl as HTMLImageElement).style.width = `${wolfSize}%`;
      (wolfEl as HTMLImageElement).style.maxWidth = `${wolfSize}%`;
      // 赤みを徐々に増す
      const redFilter = Math.round(progress * 120);
      (wolfEl as HTMLImageElement).style.filter =
        `drop-shadow(0 0 ${Math.round(progress * 24)}px rgba(180,0,0,${progress * 0.9})) sepia(${redFilter}%)`;
    }

    // 危険ゲージ
    const dangerBar = document.getElementById('wolf-danger-bar');
    if (dangerBar) dangerBar.style.width = `${progress * 100}%`;

    // 金貨加算（秒ごと）
    earnedGold = Math.floor((elapsedMs / 1000) * GOLD_PER_SEC);
    const goldEl = document.getElementById('wolf-gold');
    if (goldEl) goldEl.textContent = String(earnedGold);

    // 時間ラベル
    const timeLabel = document.getElementById('wolf-time-label');
    if (timeLabel) {
      if (progress < 0.4) timeLabel.textContent = '遠い…まだ余裕がある';
      else if (progress < 0.7) timeLabel.textContent = '近づいてくる…';
      else if (progress < 0.9) timeLabel.textContent = '危険！ 今すぐ逃げろ！';
      else timeLabel.textContent = '！！！';
    }

    // 100%到達 → 噛まれる
    if (progress >= 1.0) {
      gameActive = false;
      cancelAnimationFrame(rafId);
      onWolfReach();
      return;
    }

    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);

  // 逃走ボタン
  document.getElementById('btn-escape')?.addEventListener('click', () => {
    if (!gameActive || escaped) return;
    escaped = true;
    gameActive = false;
    cancelAnimationFrame(rafId);

    const progress = Math.min(1, elapsedMs / APPROACH_DURATION);
    const isSafe = progress < 0.95; // 95%以上は間に合わない

    if (isSafe) {
      onEscapeSuccess(earnedGold);
    } else {
      // 逃げようとしたが間に合わなかった
      onEscapeFail(earnedGold);
    }
  });

  // 従者を囮にする（E最高）
  document.getElementById('btn-sac-02')?.addEventListener('click', () => {
    if (!targetServant || !gameActive) return;
    gameActive = false;
    escaped = true;
    cancelAnimationFrame(rafId);
    sacrificeServant(targetServant.id);
    playSFX('sacrifice');
    // 囮を使うと金貨も確定（ボーナス付き）
    const bonusGold = earnedGold + 10;
    addGold(bonusGold);
    endStage02(`${targetServant.name}がオオカミを引きつけた。あなたは金貨${bonusGold}枚を手に脱出した。`, 'sacrifice', targetServant, 0, bonusGold);
  });

  function onWolfReach(): void {
    // ランダムに生存している従者1体がロスト
    const alive = state.aliveServants;
    if (alive.length > 0) {
      const victim = alive[Math.floor(Math.random() * alive.length)];
      sacrificeServant(victim.id);
      playSFX('sacrifice');
      flashDamage();
      changeHp(-20);
      updateHpDisplay();
      if (state.hp <= 0) { showGameOver(container); return; }
      endStage02(
        `逃げ遅れた。オオカミが${victim.name}に喰いついた。${victim.name}はロストした。HP -20`,
        'fail', null, 20, 0,
      );
    } else {
      // 従者なし → HPダメージのみ
      changeHp(-30);
      updateHpDisplay();
      flashDamage();
      if (state.hp <= 0) { showGameOver(container); return; }
      endStage02('逃げ遅れた。オオカミに噛みつかれた。HP -30', 'fail', null, 30, 0);
    }
  }

  function onEscapeSuccess(gold: number): void {
    addGold(gold);
    playSFX('reveal');
    endStage02(
      `素早く逃げ切った。金貨${gold}枚を手に入れた。`,
      'success', null, 0, gold,
    );
  }

  function onEscapeFail(gold: number): void {
    // ギリギリで逃げようとして噛まれた → HP-10、金貨半減
    const halfGold = Math.floor(gold / 2);
    addGold(halfGold);
    changeHp(-10);
    updateHpDisplay();
    flashDamage();
    if (state.hp <= 0) { showGameOver(container); return; }
    endStage02(
      `逃げるのが遅かった。爪に引っかかれた。金貨${halfGold}枚を手に入れた。HP -10`,
      'fail', null, 10, halfGold,
    );
  }

  async function endStage02(
    msg: string,
    outcome: 'success' | 'sacrifice' | 'fail',
    servant: TarotServant | null,
    dmg: number,
    gold: number,
  ): Promise<void> {
    const resultEl = document.getElementById('stage-result')!;
    resultEl.style.display = 'block';
    await typewriter(resultEl, msg, 40);
    recordStageResult({
      stageId: 2, stageName: stageData.name,
      outcome,
      sacrificedServantName: servant?.name,
      hpDelta: -dmg,
      choice: gold > 0 ? `金貨+${gold}` : undefined,
    });
    await sleep(800);
    addNextButton(container, resultEl);
  }
}

// ===============================
// ST-03 毒キノコの選別
// ===============================

async function runStage03(container: HTMLElement): Promise<void> {
  const state = getState();
  const stageData = STAGES[2];
  const cfg = LEVER_CONFIG.selection.st03;

  container.innerHTML = stageLayout(3, stageData.name, stageData.area);
  createParticles(document.getElementById('stage-particles')!, 10);

  await sleep(300);
  await narrateText(stageData.description, 40);
  await sleep(600);

  const targetServant = findByDimension(state.aliveServants, 'O', 'max');

  let revealed = false;
  let choiceMade = false;
  let seconds = cfg.timeoutSec;

  setMechanic(`
    <div class="countdown-ring" id="countdown-ring">
      <span id="countdown-num">${cfg.timeoutSec}</span>
    </div>
    <div class="choice-grid">
      <button class="choice-btn choice-btn-large" id="btn-eat-a">
        <span class="choice-icon">&#x1F344;</span>
        Aを食べる<br><small>赤紫・毒々しい</small>
      </button>
      <button class="choice-btn choice-btn-large" id="btn-eat-b">
        <span class="choice-icon">&#x1F344;</span>
        Bを食べる<br><small>普通・SNS噂</small>
      </button>
      <button class="choice-btn choice-btn-neutral" id="btn-eat-none">食べない</button>
    </div>
    ${targetServant ? `
      <div class="sacrifice-quick-btn">
        <button class="btn-sacrifice" id="btn-sac-03">従者を捧げる（${targetServant.name}）— 透視</button>
      </div>
    ` : ''}
    <div class="servant-hint" id="servant-hint" style="display:none;color:#C9A227;margin-top:0.5rem"></div>
    <div class="stage-result" id="stage-result" style="display:none"></div>
  `);

  const countdownId = setInterval(() => {
    seconds--;
    const el = document.getElementById('countdown-num');
    if (el) el.textContent = String(seconds);
    if (seconds <= 0) {
      clearInterval(countdownId);
      if (!choiceMade) resolveChoice('none');
    }
  }, 1000);

  document.getElementById('btn-sac-03')?.addEventListener('click', () => {
    if (!targetServant || revealed) return;
    revealed = true;
    sacrificeServant(targetServant.id);
    playSFX('sacrifice');
    const hint = document.getElementById('servant-hint')!;
    hint.style.display = 'block';
    hint.textContent = `${targetServant.name}の透視：Aは安全。Bは毒だ。`;
  });

  document.getElementById('btn-eat-a')?.addEventListener('click', () => { if (!choiceMade) resolveChoice('a'); });
  document.getElementById('btn-eat-b')?.addEventListener('click', () => { if (!choiceMade) resolveChoice('b'); });
  document.getElementById('btn-eat-none')?.addEventListener('click', () => { if (!choiceMade) resolveChoice('none'); });

  async function resolveChoice(choice: 'a' | 'b' | 'none'): Promise<void> {
    choiceMade = true;
    clearInterval(countdownId);

    let hpDelta = 0;
    let msg = '';
    if (choice === 'a') {
      hpDelta = 10; changeHp(10); updateHpDisplay();
      msg = 'Aを食べた。毒々しい見た目だったが、安全だった。HP +10';
    } else if (choice === 'b') {
      hpDelta = -15; changeHp(-15); updateHpDisplay(); flashDamage();
      msg = 'Bを食べた。SNSの噂は正しかった。猛毒だ。HP -15';
    } else {
      msg = '何も食べなかった。安全だが、何も得られなかった。';
    }

    const resultEl = document.getElementById('stage-result')!;
    resultEl.style.display = 'block';
    await typewriter(resultEl, msg, 40);

    if (state.hp <= 0) { showGameOver(container); return; }

    recordStageResult({
      stageId: 3, stageName: stageData.name,
      outcome: revealed ? 'sacrifice' : hpDelta >= 0 ? 'success' : 'fail',
      sacrificedServantName: revealed ? targetServant?.name : undefined,
      choice, hpDelta,
    });

    await sleep(800);
    addNextButton(container, resultEl);
  }
}

// ===============================
// ST-04 孤児との出会い
// ===============================

async function runStage04(container: HTMLElement): Promise<void> {
  const state = getState();
  const stageData = STAGES[3];
  const cfg = LEVER_CONFIG.selection.st04;

  container.innerHTML = stageLayout(4, stageData.name, stageData.area);

  await sleep(300);
  await narrateText(stageData.description, 40);
  await sleep(600);

  let seconds = cfg.timeoutSec;
  let choiceMade = false;

  setMechanic(`
    <div class="countdown-ring" id="countdown-ring">
      <span id="countdown-num">${cfg.timeoutSec}</span>
    </div>
    <p class="mechanic-hint">どうする？</p>
    <div class="choice-grid-2x2">
      <button class="choice-btn" id="btn-talk">話しかける</button>
      <button class="choice-btn" id="btn-money">お金を渡す</button>
      <button class="choice-btn" id="btn-guide">案内してもらう</button>
      <button class="choice-btn sel-danger" id="btn-ignore">無視する</button>
    </div>
    <div class="stage-result" id="stage-result" style="display:none"></div>
  `);

  const countdownId = setInterval(() => {
    seconds--;
    const el = document.getElementById('countdown-num');
    if (el) el.textContent = String(seconds);
    if (seconds <= 0) {
      clearInterval(countdownId);
      if (!choiceMade) resolveChoice('ignore');
    }
  }, 1000);

  ['talk', 'money', 'guide', 'ignore'].forEach(id => {
    document.getElementById(`btn-${id}`)?.addEventListener('click', () => {
      if (!choiceMade) resolveChoice(id as 'talk' | 'money' | 'guide' | 'ignore');
    });
  });

  async function resolveChoice(choice: 'talk' | 'money' | 'guide' | 'ignore'): Promise<void> {
    choiceMade = true;
    clearInterval(countdownId);

    const msgs: Record<string, string> = {
      talk: '子どもと話した。有益な情報を得た。信頼関係が生まれた。',
      money: 'コインを渡した。子どもは喜んで道案内をしてくれた。',
      guide: '案内を頼んだ。子どもは詳しい情報を教えてくれた。',
      ignore: '無視した。後の番人の試練が、より厳しくなるだろう。',
    };
    const msg = msgs[choice];

    state.orphanChoice = choice;

    const resultEl = document.getElementById('stage-result')!;
    resultEl.style.display = 'block';
    await typewriter(resultEl, msg, 40);

    recordStageResult({
      stageId: 4, stageName: stageData.name,
      outcome: choice === 'ignore' ? 'fail' : 'success',
      choice, hpDelta: 0,
    });

    await sleep(800);
    addNextButton(container, resultEl);
  }
}

// ===============================
// ST-05 盗賊との遭遇
// ===============================

async function runStage05(container: HTMLElement): Promise<void> {
  const state = getState();
  const stageData = STAGES[4];
  const cfg = LEVER_CONFIG.battle.st05;

  container.innerHTML = stageLayout(5, stageData.name, stageData.area);
  createParticles(document.getElementById('stage-particles')!, 15);

  await sleep(300);
  await narrateText('道を塞ぐ武装した盗賊。「通りたければ通行料を払え」', 40);
  await sleep(600);

  setMechanic(`
    <p class="mechanic-hint">どうする？</p>
    <div class="choice-grid-2x2">
      <button class="choice-btn" id="btn-fight">戦う</button>
      <button class="choice-btn" id="btn-flee">逃げる</button>
      <button class="choice-btn" id="btn-negotiate">交渉する</button>
      <button class="choice-btn" id="btn-pay">通行料を払う</button>
    </div>
    <div class="battle-section" id="battle-section" style="display:none">
      <p class="mechanic-hint">${cfg.timeLimitSec}秒で${cfg.targetClicks}回クリック！</p>
      <div class="progress-bar-container" style="margin-bottom:0.5rem">
        <div class="progress-bar-fill" id="fight-bar" style="width:0%"></div>
      </div>
      <p>クリック: <span id="fight-count">0</span> / ${cfg.targetClicks}</p>
      <p>残り: <span id="fight-timer">${cfg.timeLimitSec}</span>秒</p>
      <div class="battle-split-area">
        <button class="battle-btn-left" id="btn-fight-l">L</button>
        <button class="battle-btn-right" id="btn-fight-r">R</button>
      </div>
    </div>
    <div class="stage-result" id="stage-result" style="display:none"></div>
  `);

  document.getElementById('btn-fight')?.addEventListener('click', () => startFight());
  document.getElementById('btn-flee')?.addEventListener('click', () => {
    changeHp(-5); updateHpDisplay();
    if (state.hp <= 0) { showGameOver(container); return; }
    endStage05(-5, 'success', null, '逃げた。多少傷ついたが命は助かった。HP -5');
  });
  document.getElementById('btn-negotiate')?.addEventListener('click', () => {
    if (state.bigFive.A >= 0.6) {
      endStage05(0, 'success', null, '交渉成功。盗賊は道を開けた。');
    } else {
      changeHp(-8); updateHpDisplay(); flashDamage();
      if (state.hp <= 0) { showGameOver(container); return; }
      endStage05(-8, 'fail', null, '交渉失敗。代償を払った。HP -8');
    }
  });
  document.getElementById('btn-pay')?.addEventListener('click', () => {
    endStage05(0, 'success', null, '通行料を払った。財布が軽くなった。');
  });

  function startFight(): void {
    document.querySelectorAll('.choice-grid-2x2 .choice-btn').forEach(b => (b as HTMLButtonElement).disabled = true);
    const fightSection = document.getElementById('battle-section')!;
    fightSection.style.display = 'block';

    let clicks = 0;
    let fightActive = true;
    let timeLeft = cfg.timeLimitSec;

    const timerInterval = setInterval(() => {
      timeLeft--;
      const timerEl = document.getElementById('fight-timer');
      if (timerEl) timerEl.textContent = String(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        if (!fightActive) return;
        fightActive = false;
        changeHp(-15); updateHpDisplay(); flashDamage();
        if (state.hp <= 0) { showGameOver(container); return; }
        endStage05(-15, 'fail', null, '敗北した。HP -15');
      }
    }, 1000);

    const onFightClick = () => {
      if (!fightActive) return;
      clicks++;
      playSFX('select');
      const pct = Math.min(100, Math.round((clicks / cfg.targetClicks) * 100));
      const bar = document.getElementById('fight-bar');
      const countEl = document.getElementById('fight-count');
      if (bar) bar.style.width = `${pct}%`;
      if (countEl) countEl.textContent = String(clicks);
      if (clicks >= cfg.targetClicks) {
        fightActive = false;
        clearInterval(timerInterval);
        endStage05(0, 'success', null, '盗賊を撃退した。道が開いた。');
      }
    };

    document.getElementById('btn-fight-l')?.addEventListener('click', onFightClick);
    document.getElementById('btn-fight-r')?.addEventListener('click', onFightClick);
  }

  async function endStage05(hpDelta: number, outcome: 'success' | 'fail', _sid: null, msg: string): Promise<void> {
    const resultEl = document.getElementById('stage-result')!;
    resultEl.style.display = 'block';
    await typewriter(resultEl, msg, 40);

    recordStageResult({
      stageId: 5, stageName: stageData.name,
      outcome, hpDelta,
    });

    await sleep(800);
    addNextButton(container, resultEl);
  }
}

// ===============================
// ST-06 旅の買い出し（ショップ）
// ===============================

async function runStage06(container: HTMLElement): Promise<void> {
  const state = getState();
  const stageData = STAGES[5];

  container.innerHTML = stageLayout(6, stageData.name, stageData.area);

  await sleep(300);
  await narrateText('市場。旅の補給ができる最後のチャンスだ。2つまで選べる。', 40);
  await sleep(600);

  const items = [
    { id: 'potion', icon: '&#x1F9EA;', name: '回復薬', desc: '後のステージでHP+30' },
    { id: 'sword',  icon: '&#x2694;',  name: '剣',     desc: 'ボス攻撃力UP、ダメージ減少' },
    { id: 'key',    icon: '&#x1F5DD;', name: '鍵',     desc: 'ST-07の戦闘をスキップ' },
    { id: 'food',   icon: '&#x1F35E;', name: '携帯食', desc: '即時HP+10' },
  ];

  setMechanic(`
    <p class="mechanic-hint">2つまで選んで確定する</p>
    <div class="item-shop-grid">
      ${items.map(item => `
        <div class="item-card" id="item-${item.id}" data-id="${item.id}">
          <div class="item-icon">${item.icon}</div>
          <div class="item-name">${item.name}</div>
          <div class="item-desc">${item.desc}</div>
        </div>
      `).join('')}
    </div>
    <button class="btn-primary" id="btn-confirm-shop" style="margin-top:1rem">確定する</button>
    <div class="stage-result" id="stage-result" style="display:none"></div>
  `);

  const selected = new Set<string>();

  document.querySelectorAll('.item-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = (card as HTMLElement).dataset.id!;
      if (selected.has(id)) {
        selected.delete(id);
        card.classList.remove('selected');
      } else if (selected.size < 2) {
        selected.add(id);
        card.classList.add('selected');
      }
    });
  });

  document.getElementById('btn-confirm-shop')?.addEventListener('click', async () => {
    let hpGain = 0;
    selected.forEach(id => {
      if (id === 'potion') state.hasPotion = true;
      if (id === 'sword')  state.hasSword  = true;
      if (id === 'key')    state.hasKey    = true;
      if (id === 'food')   { changeHp(10); updateHpDisplay(); hpGain = 10; }
    });

    const resultEl = document.getElementById('stage-result')!;
    resultEl.style.display = 'block';

    const names = [...selected].map(id => items.find(i => i.id === id)?.name ?? '').filter(Boolean);
    const msg = names.length > 0
      ? `${names.join('・')} を手に入れた。${hpGain > 0 ? `HP +${hpGain}` : ''}`
      : '何も買わなかった。';

    await typewriter(resultEl, msg, 40);

    recordStageResult({
      stageId: 6, stageName: stageData.name,
      outcome: 'item', hpDelta: hpGain,
    });

    await sleep(800);
    addNextButton(container, resultEl);
  });
}

// ===============================
// ST-07 番人との対峙（タイミング）
// ===============================

async function runStage07(container: HTMLElement): Promise<void> {
  const state = getState();
  const stageData = STAGES[6];
  const cfg = LEVER_CONFIG.timing.st07;

  container.innerHTML = stageLayout(7, stageData.name, stageData.area);
  createParticles(document.getElementById('stage-particles')!, 20);

  const firstSacrificedId = state.firstSacrificedId;
  const guardianName = firstSacrificedId !== null
    ? (state.servants.find(s => s.id === firstSacrificedId)?.name ?? '番人')
    : '空白の番人';

  const orphanIgnored = state.orphanChoice === 'ignore';
  const introText = orphanIgnored
    ? `遺跡の最奥。「なぜ孤児を無視したのか」——番人の怒りが増している。`
    : firstSacrificedId !== null
      ? `遺跡の最奥。${guardianName}の姿をした番人が待ち構える。「なぜ私を捨てたのか」`
      : `遺跡の最奥。空白の番人が立ちはだかる。「お前は何も捧げなかった……」`;

  await sleep(300);
  await narrateText(introText, 40);
  await sleep(600);

  if (state.hasKey) {
    setMechanic(`
      <p class="mechanic-hint">鍵を使って戦闘をスキップできる。</p>
      <button class="btn-primary" id="btn-use-key">&#x1F5DD; 鍵を使う</button>
      <button class="choice-btn" id="btn-fight-guardian">戦う</button>
      <div class="stage-result" id="stage-result" style="display:none"></div>
    `);
    document.getElementById('btn-use-key')?.addEventListener('click', async () => {
      state.hasKey = false;
      const msg = '鍵を使った。番人は道を開けた。';
      setMechanic(`<div class="stage-result" id="stage-result">${msg}</div>`);
      recordStageResult({ stageId: 7, stageName: stageData.name, outcome: 'skip', hpDelta: 0 });
      await sleep(1000);
      proceedNext(container);
    });
    document.getElementById('btn-fight-guardian')?.addEventListener('click', () => startGuardianBattle());
    return;
  }

  startGuardianBattle();

  function startGuardianBattle(): void {
    const bonusFromSword = state.hasSword ? 2 : 0;
    const guardianMaxHp = cfg.phaseCount - bonusFromSword;
    let guardianHp = guardianMaxHp;
    let roundActive = false;
    let autoSucceed = 0;

    setMechanic(`
      <div class="boss-hp-bar">
        <span class="boss-hp-label">${guardianName}</span>
        <div class="hp-bar-container" style="flex:1;margin:0 0.5rem">
          <div class="hp-bar-fill boss-hp-fill" id="boss-hp-fill" style="width:100%;background:#8b5cf6"></div>
        </div>
        <span id="boss-hp-val">${guardianHp}/${guardianMaxHp}</span>
      </div>
      <p class="battle-status" id="battle-status">リングがボタンと重なった瞬間に押せ！</p>
      <div class="ring-arena" id="ring-arena">
        <div class="ring-target" id="ring-target"></div>
        <div class="ring-shrink" id="ring-shrink" style="display:none"></div>
        <button class="btn-ring-hit" id="btn-ring-hit" disabled>押せ</button>
      </div>
      <div class="battle-action-row">
        ${state.hasPotion ? `<button class="btn-primary" id="btn-potion">&#x1F9EA; 回復薬</button>` : ''}
        <button class="btn-sacrifice" id="btn-sac-07">従者を捧げる</button>
      </div>
      <div class="stage-result" id="stage-result" style="display:none"></div>
    `);

    document.getElementById('btn-sac-07')?.addEventListener('click', async () => {
      if (roundActive) return;
      if (aliveServants().length === 0) return;
      const sid = await showServantSelectModal('番人に従者を捧げる');
      if (sid === -1) return;
      const sac = sacrificeServant(sid);
      playSFX('sacrifice');
      autoSucceed += 2;
      const statusEl = document.getElementById('battle-status');
      if (statusEl) statusEl.textContent = `${sac?.name ?? '従者'}が身を挺した。次の2回が自動成功する。`;
    });

    document.getElementById('btn-potion')?.addEventListener('click', () => {
      if (!state.hasPotion) return;
      state.hasPotion = false;
      changeHp(30); updateHpDisplay();
      document.getElementById('btn-potion')?.remove();
    });

    function updateGuardianHp(): void {
      const fill = document.getElementById('boss-hp-fill');
      const val = document.getElementById('boss-hp-val');
      if (fill) fill.style.width = `${Math.max(0, (guardianHp / guardianMaxHp) * 100)}%`;
      if (val) val.textContent = `${Math.max(0, guardianHp)}/${guardianMaxHp}`;
    }

    function doRing(): void {
      if (roundActive) return;
      roundActive = true;

      const ringEl = document.getElementById('ring-shrink') as HTMLElement;
      const hitBtn = document.getElementById('btn-ring-hit') as HTMLButtonElement;
      const statusEl = document.getElementById('battle-status') as HTMLElement;
      if (!ringEl || !hitBtn || !statusEl) return;

      if (autoSucceed > 0) {
        autoSucceed--;
        statusEl.textContent = '自動成功！番人に痛打！（-2）';
        guardianHp -= 2;
        updateGuardianHp();
        if (guardianHp <= 0) { finishBattle(); return; }
        roundActive = false;
        setTimeout(doRing, 900);
        return;
      }

      const DURATION = 2200;
      const RING_START = 200;
      const BTN_SIZE = 80;
      const t_perfect = DURATION * (1 - BTN_SIZE / RING_START);
      const PERFECT_WIN = 160;
      const LATE_WIN = 420;

      statusEl.textContent = 'リングがボタンと重なった瞬間に押せ！';
      hitBtn.disabled = false;
      ringEl.style.display = 'block';
      ringEl.style.borderColor = '#ef4444';
      ringEl.style.boxShadow = 'none';

      const startTime = Date.now();
      let pressed = false;
      let rafId: number;

      function animateRing(): void {
        if (pressed) return;
        const elapsed = Date.now() - startTime;
        const size = Math.max(0, RING_START * (1 - elapsed / DURATION));
        const offset = (200 - size) / 2;
        ringEl.style.width = `${size}px`;
        ringEl.style.height = `${size}px`;
        ringEl.style.left = `${offset}px`;
        ringEl.style.top = `${offset}px`;

        const diff = elapsed - t_perfect;
        if (Math.abs(diff) <= PERFECT_WIN) {
          ringEl.style.borderColor = '#C9A227';
          ringEl.style.boxShadow = '0 0 14px rgba(201,162,39,0.9)';
        } else {
          ringEl.style.borderColor = '#ef4444';
          ringEl.style.boxShadow = 'none';
        }

        if (elapsed >= DURATION) {
          cancelAnimationFrame(rafId);
          if (!pressed) {
            pressed = true;
            hitBtn.disabled = true;
            ringEl.style.display = 'none';
            changeHp(-10); updateHpDisplay(); flashDamage();
            statusEl.textContent = '遅すぎた... HP -10';
            roundActive = false;
            if (state.hp <= 0) { showGameOver(container); return; }
            setTimeout(doRing, 1200);
          }
          return;
        }
        rafId = requestAnimationFrame(animateRing);
      }
      rafId = requestAnimationFrame(animateRing);

      hitBtn.onclick = () => {
        if (pressed) return;
        pressed = true;
        cancelAnimationFrame(rafId);
        hitBtn.disabled = true;
        ringEl.style.display = 'none';

        const elapsed = Date.now() - startTime;
        const diff = elapsed - t_perfect;

        if (Math.abs(diff) <= PERFECT_WIN) {
          guardianHp -= 2;
          statusEl.textContent = '完璧！番人に痛打！（-2）';
          playSFX('reveal');
        } else if (diff > PERFECT_WIN && diff <= PERFECT_WIN + LATE_WIN) {
          guardianHp -= 1;
          statusEl.textContent = '少し遅かった。かすり傷（-1）';
        } else {
          changeHp(-10); updateHpDisplay(); flashDamage();
          statusEl.textContent = 'タイミングがズレた。 HP -10';
        }

        updateGuardianHp();
        if (state.hp <= 0) { showGameOver(container); return; }
        if (guardianHp <= 0) { finishBattle(); return; }
        roundActive = false;
        setTimeout(doRing, 1000);
      };
    }

    async function finishBattle(): Promise<void> {
      await sleep(600);
      const resultEl = document.getElementById('stage-result')!;
      resultEl.style.display = 'block';
      const msg = '番人を退けた。遺跡の道が開く。';
      await typewriter(resultEl, msg, 40);
      recordStageResult({ stageId: 7, stageName: stageData.name, outcome: 'success', hpDelta: 0 });
      await sleep(800);
      addNextButton(container, resultEl);
    }

    doRing();
  }
}

// ===============================
// ST-08 暴走トロッコ（選択）
// ===============================

async function runStage08(container: HTMLElement): Promise<void> {
  const state = getState();
  const stageData = STAGES[7];

  container.innerHTML = stageLayout(8, stageData.name, stageData.area);
  createParticles(document.getElementById('stage-particles')!, 15);

  await sleep(300);
  await narrateText(stageData.description, 40);
  await sleep(600);

  const advisorServant = findByDimension(state.aliveServants, 'A', 'max');
  let allRevealed = false;
  let currentRound = 0;
  let totalDamage = 0;

  const correctPaths = ['left', 'right', 'left'] as const;
  const servantAdvice = ['left', 'left', 'left'] as const;
  type TrolleyPath = 'left' | 'center' | 'right';

  function renderFork(): void {
    const advice = allRevealed ? correctPaths[currentRound] : servantAdvice[currentRound];
    const adviceLabel = advice === 'left' ? '左' : advice === 'right' ? '右' : '中央';
    const correctLabel = correctPaths[currentRound] === 'left' ? '左' : correctPaths[currentRound] === 'right' ? '右' : '中央';

    setMechanic(`
      <p class="trolley-fork-label">第${currentRound + 1}分岐 / 3</p>
      ${advisorServant ? `
        <p class="servant-hint-text">
          ${allRevealed
            ? `<span style="color:#C9A227">&#x2606; 正解は「${correctLabel}」だ</span>`
            : `従者 <strong>${advisorServant.name}</strong>：「${adviceLabel}へ行け」`
          }
        </p>
      ` : ''}
      ${advisorServant && !allRevealed ? `
        <div class="sacrifice-quick-btn">
          <button class="btn-sacrifice" id="btn-sac-08">従者を捧げる（${advisorServant.name}）— 全ルート開示</button>
        </div>
      ` : ''}
      <div class="trolley-path-btns">
        <button class="choice-btn" id="troll-left">&#x2190; 左</button>
        <button class="choice-btn" id="troll-center">&#x2191; 中央</button>
        <button class="choice-btn" id="troll-right">右 &#x2192;</button>
      </div>
      <div class="betrayal-overlay" id="betray-overlay" style="display:none">
        <p id="betray-text" style="color:#ef4444"></p>
      </div>
      <div class="stage-result" id="stage-result" style="display:none"></div>
    `);

    document.getElementById('btn-sac-08')?.addEventListener('click', () => {
      if (!advisorServant || allRevealed) return;
      sacrificeServant(advisorServant.id);
      playSFX('sacrifice');
      allRevealed = true;
      renderFork();
    });

    document.getElementById('troll-left')?.addEventListener('click', () => handleChoice('left'));
    document.getElementById('troll-center')?.addEventListener('click', () => handleChoice('center'));
    document.getElementById('troll-right')?.addEventListener('click', () => handleChoice('right'));
  }

  async function handleChoice(choice: TrolleyPath): Promise<void> {
    ['troll-left', 'troll-center', 'troll-right'].forEach(id => {
      const btn = document.getElementById(id) as HTMLButtonElement | null;
      if (btn) btn.disabled = true;
    });

    const correct = correctPaths[currentRound];

    if (currentRound === 1 && !allRevealed && choice === 'left') {
      state.st08TrustAfterBetrayal = false;
      const overlay = document.getElementById('betray-overlay')!;
      overlay.style.display = 'block';
      const textEl = document.getElementById('betray-text')!;
      await typewriter(textEl, '従者が……嘘をついた。トロッコが崖に向かっている！', 40);
      changeHp(-20); updateHpDisplay(); flashDamage();
      totalDamage += 20;
      await sleep(1500);

      if (state.hp <= 0) { showGameOver(container); return; }

      overlay.innerHTML = `
        <p style="color:#C9A227;font-style:italic">
          「……信じてくれ。次は必ず正しい道を示す。」
          <br><small style="color:#a89a7a">従者が懇願している</small>
        </p>
      `;
      await sleep(1800);
      overlay.style.display = 'none';
    } else if (!allRevealed && choice !== correct) {
      changeHp(-10); updateHpDisplay(); flashDamage();
      totalDamage += 10;
      if (state.hp <= 0) { showGameOver(container); return; }
    }

    currentRound++;
    if (currentRound >= 3) {
      await endStage08(totalDamage);
    } else {
      await sleep(400);
      renderFork();
    }
  }

  async function endStage08(dmg: number): Promise<void> {
    setMechanic(`<div class="stage-result" id="stage-result"></div>`);
    const resultEl = document.getElementById('stage-result')!;
    const msg = dmg === 0 ? 'すべての分岐を正しく選んだ。' : `トロッコを乗り越えた。HP -${dmg}`;
    await typewriter(resultEl, msg, 40);

    recordStageResult({
      stageId: 8, stageName: stageData.name,
      outcome: dmg > 0 ? 'fail' : 'success',
      hpDelta: -dmg,
    });

    await sleep(800);
    addNextButton(container, resultEl);
  }

  renderFork();
}

// ===============================
// ST-09 真実の口（最終ボス）
// ===============================

async function runStage09(container: HTMLElement): Promise<void> {
  const state = getState();
  const stageData = STAGES[8];
  const cfg = LEVER_CONFIG.battle.st09;

  container.innerHTML = stageLayout(9, stageData.name, stageData.area);
  createParticles(document.getElementById('stage-particles')!, 30);

  await sleep(300);
  await narrateText('問の間。高さ3mの真実の口。これまでの選択が映し出される。「お前は何者だ」', 40);
  await sleep(800);

  const bossMaxHp = state.hasSword ? cfg.bossMaxHp - 20 : cfg.bossMaxHp;
  let bossHp = bossMaxHp;
  let roundActive = false;

  function renderBossUI(): void {
    setMechanic(`
      <div class="boss-hp-bar">
        <span class="boss-hp-label">&#x1F62E;&#x200D;&#x1F4A8; 真実の口</span>
        <div class="hp-bar-container" style="flex:1;margin:0 0.5rem">
          <div class="hp-bar-fill boss-hp-fill" id="boss-hp-fill" style="width:100%;background:#9b1c1c"></div>
        </div>
        <span id="boss-hp-val">${bossHp}/${bossMaxHp}</span>
      </div>
      <div class="player-hp-mini">
        <span>あなたのHP: <strong id="boss-player-hp">${state.hp}</strong>/${state.maxHp}</span>
      </div>
      <p class="boss-status" id="boss-status">攻撃を選べ</p>
      <div class="boss-action-row">
        <button class="btn-attack" id="btn-boss-lever">レバー攻撃<br><small>（5回→${cfg.leverDamage}dmg）</small></button>
        <button class="btn-sacrifice" id="btn-boss-sacrifice">従者を投じる<br><small>（${cfg.sacrificeDamage}dmg）</small></button>
        ${state.hasPotion ? `<button class="btn-primary" id="btn-boss-potion">&#x1F9EA; 回復薬</button>` : ''}
      </div>
      <div class="boss-click-counter" id="boss-click-counter" style="display:none">
        クリック: <span id="boss-click-cnt">0</span> / 5
      </div>
      <div class="stage-result" id="stage-result" style="display:none"></div>
    `);

    attachBossListeners();
  }

  function updateBossHp(): void {
    const fill = document.getElementById('boss-hp-fill');
    const val = document.getElementById('boss-hp-val');
    if (fill) fill.style.width = `${Math.max(0, (bossHp / bossMaxHp) * 100)}%`;
    if (val) val.textContent = `${Math.max(0, bossHp)}/${bossMaxHp}`;
  }

  function updatePlayerHpMini(): void {
    const el = document.getElementById('boss-player-hp');
    if (el) el.textContent = String(state.hp);
  }

  function setStatus(text: string): void {
    const el = document.getElementById('boss-status');
    if (el) el.textContent = text;
  }

  function checkBossDeath(): boolean {
    if (bossHp <= 0) {
      state.bossDefeated = true;
      endStage09();
      return true;
    }
    return false;
  }

  function bossCounter(): boolean {
    changeHp(-cfg.counterDamage);
    updateHpDisplay();
    updatePlayerHpMini();
    flashDamage();
    setStatus(`反撃！ HP -${cfg.counterDamage}`);
    if (state.hp <= 0) {
      showGameOver(container);
      return true;
    }
    return false;
  }

  function attachBossListeners(): void {
    const leverBtn = document.getElementById('btn-boss-lever') as HTMLButtonElement | null;
    const sacBtn = document.getElementById('btn-boss-sacrifice') as HTMLButtonElement | null;
    const counterEl = document.getElementById('boss-click-counter');
    const cntEl = document.getElementById('boss-click-cnt');

    if (leverBtn) {
      leverBtn.addEventListener('click', () => {
        if (roundActive) return;
        roundActive = true;
        leverBtn.disabled = true;
        if (sacBtn) sacBtn.disabled = true;
        if (counterEl) counterEl.style.display = 'block';

        let localClicks = 0;
        if (cntEl) cntEl.textContent = '0';

        const origText = leverBtn.innerHTML;
        leverBtn.textContent = 'クリック！';

        const rapidClick = () => {
          localClicks++;
          if (cntEl) cntEl.textContent = String(localClicks);
          if (localClicks >= 5) {
            leverBtn.removeEventListener('click', rapidClick);
            leverBtn.innerHTML = origText;
            leverBtn.disabled = false;
            if (sacBtn) sacBtn.disabled = false;
            if (counterEl) counterEl.style.display = 'none';

            bossHp -= cfg.leverDamage;
            updateBossHp();
            playSFX('select');
            setStatus(`${cfg.leverDamage}ダメージ！`);

            if (checkBossDeath()) return;
            if (bossCounter()) return;
            roundActive = false;
          }
        };
        leverBtn.addEventListener('click', rapidClick);
      });
    }

    if (sacBtn) {
      sacBtn.addEventListener('click', async () => {
        if (roundActive) return;
        if (aliveServants().length === 0) return;
        roundActive = true;
        if (leverBtn) leverBtn.disabled = true;
        sacBtn.disabled = true;

        const sid = await showServantSelectModal('真実の口に従者を投じる');
        if (sid === -1) {
          roundActive = false;
          if (leverBtn) leverBtn.disabled = false;
          sacBtn.disabled = false;
          return;
        }

        const sac = sacrificeServant(sid);
        playSFX('sacrifice');

        bossHp -= cfg.sacrificeDamage;
        updateBossHp();
        setStatus(`${sac?.name ?? '従者'}を投じた！ ${cfg.sacrificeDamage}ダメージ！`);

        // If last servant: final blow
        if (aliveServants().length === 0) {
          bossHp = 0;
          updateBossHp();
          state.bossDefeated = true;
          endStage09();
          return;
        }

        if (checkBossDeath()) return;
        // Sacrifice does not trigger counter
        roundActive = false;
        if (leverBtn) leverBtn.disabled = false;
        sacBtn.disabled = false;

        // Update sacrifice button if no servants left
        if (aliveServants().length === 0) sacBtn.remove();
      });
    }

    document.getElementById('btn-boss-potion')?.addEventListener('click', () => {
      if (!state.hasPotion) return;
      state.hasPotion = false;
      changeHp(30); updateHpDisplay(); updatePlayerHpMini();
      document.getElementById('btn-boss-potion')?.remove();
    });
  }

  async function endStage09(): Promise<void> {
    await sleep(600);
    const resultEl = document.getElementById('stage-result')!;
    resultEl.style.display = 'block';
    await typewriter(resultEl, '真実の口が砕け散った。旅が終わる。', 50);

    recordStageResult({
      stageId: 9, stageName: stageData.name,
      outcome: 'success', hpDelta: 0,
    });

    await sleep(1000);
    navigateTo('finale');
  }

  renderBossUI();
}

// ===============================
// メインエントリー
// ===============================

export function renderStageScene(container: HTMLElement): void {
  const state = getState();

  if (state.gameOver) {
    showGameOver(container);
    return;
  }

  type StageRunner = (c: HTMLElement) => Promise<void>;
  const stageRunners: Record<number, StageRunner> = {
    1: runStage01,
    2: runStage02,
    3: runStage03,
    4: runStage04,
    5: runStage05,
    6: runStage06,
    7: runStage07,
    8: runStage08,
    9: runStage09,
  };

  const runner = stageRunners[state.currentStage];
  if (runner) {
    runner(container).catch(err => console.error('Stage error:', err));
  }
}
