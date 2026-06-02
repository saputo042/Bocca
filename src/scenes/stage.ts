// Bucca ステージシーン（ST-01 〜 ST-09）

import {
  navigateTo, getState, resetGameState, changeHp, sacrificeServant, recordStageResult,
  advanceStage, sleep, typewriter, createParticles, addGold, acquireNextServant, logRhythm,
  getServantByPiece, getServantPieceName,
} from '../utils/gameState';
import { rfidManager } from '../utils/rfid';
import { findByDimension, TAROT_SYMBOLS, type TarotServant } from '../data/tarot';
import { STAGES } from '../data/stages';
import { getLeverConfig, GAME_CONFIG } from '../data/gameConfig';
import { playSFX, switchBGMTrack } from '../utils/audio';
import { checkOnBeat, flashActionBeat, playMotif, getBPM } from '../utils/rhythm';

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
  const rfidLabel = rfidManager.isConnected ? '📡 RFID接続中' : '🔌 RFID';
  const rfidClass = rfidManager.isConnected ? 'rfid-btn connected' : 'rfid-btn';
  const rfidHidden = rfidManager.isSupported() ? '' : 'style="display:none"';
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
        <button class="${rfidClass}" id="rfid-btn" ${rfidHidden}>${rfidLabel}</button>
      </div>
      <div class="stage-body" id="stage-body">
        <div class="stage-narrative" id="stage-narrative"></div>
        <div class="stage-mechanic" id="stage-mechanic"></div>
      </div>
    </div>
  `;
}

function setupRfidButton(container: HTMLElement): void {
  const btn = container.querySelector<HTMLButtonElement>('#rfid-btn');
  if (!btn) return;

  function updateBtn(): void {
    if (!btn) return;
    btn.textContent = rfidManager.isConnected ? '📡 RFID接続中' : '🔌 RFID';
    btn.classList.toggle('connected', rfidManager.isConnected);
  }

  btn.addEventListener('click', () => {
    if (rfidManager.isConnected) {
      void rfidManager.disconnect().then(updateBtn);
    } else {
      void rfidManager.connect().then(updateBtn);
    }
  });
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

// 従者選択モーダル。RFIDが接続中なら駒スキャンでも選択できる。
function showServantSelectModal(title: string): Promise<number> {
  return new Promise(resolve => {
    const alive = aliveServants();
    if (alive.length === 0) { resolve(-1); return; }

    const overlay = document.createElement('div');
    overlay.className = 'servant-select-overlay';

    const rfidHint = rfidManager.isConnected
      ? '<p class="rfid-hint">📡 コマをかざして選択できます</p>'
      : '';

    overlay.innerHTML = `
      <div class="servant-select-modal">
        <h3 class="servant-modal-title">${title}</h3>
        <p class="servant-modal-desc">犠牲にする従者を選んでください</p>
        ${rfidHint}
        <div class="rfid-scan-result" id="rfid-scan-result" style="display:none"></div>
        <div class="servant-modal-list" id="servant-modal-list"></div>
        <button class="btn-cancel" id="btn-cancel-sacrifice">キャンセル</button>
      </div>
    `;

    const list = overlay.querySelector<HTMLElement>('#servant-modal-list')!;
    const scanResult = overlay.querySelector<HTMLElement>('#rfid-scan-result')!;

    alive.forEach(s => {
      const pieceLabel = getServantPieceName(s.id);
      const btn = document.createElement('button');
      btn.className = 'servant-chip selectable';
      btn.dataset.sid = String(s.id);
      btn.innerHTML = `
        <span class="chip-symbol">${TAROT_SYMBOLS[s.id] ?? ''}</span>
        <span class="chip-name">${s.name}</span>
        <span class="chip-skill">${s.skill}</span>
        ${pieceLabel ? `<span class="chip-piece">${pieceLabel}</span>` : ''}
      `;
      btn.addEventListener('click', () => { cleanup(); resolve(s.id); });
      list.appendChild(btn);
    });

    overlay.querySelector('#btn-cancel-sacrifice')?.addEventListener('click', () => {
      cleanup();
      resolve(-1);
    });

    // RFID スキャン: キャラ情報を表示してから1.5秒後に確定
    let unsubscribe: (() => void) | null = null;
    let confirmTimer: ReturnType<typeof setTimeout> | null = null;

    if (rfidManager.isConnected) {
      unsubscribe = rfidManager.onScan(piece => {
        // 連打防止: 確定待ち中は無視
        if (confirmTimer !== null) return;

        const servant = getServantByPiece(piece);

        // 未登録の駒
        if (!servant) {
          scanResult.innerHTML = `
            <div class="rfid-scan-unknown">
              <span class="scan-icon">❓</span>
              <span class="scan-msg">このコマは登録されていません</span>
            </div>
          `;
          scanResult.style.display = 'block';
          setTimeout(() => { scanResult.style.display = 'none'; }, 1200);
          return;
        }

        // 対応する従者チップをハイライト
        const chipBtn = list.querySelector<HTMLButtonElement>(`[data-sid="${servant.id}"]`);
        if (chipBtn) chipBtn.classList.add('rfid-selected');

        // キャラ情報パネルを表示
        const pieceLabel = getServantPieceName(servant.id) ?? piece;
        scanResult.innerHTML = `
          <div class="rfid-scan-card">
            <div class="scan-piece-label">${pieceLabel}</div>
            <div class="scan-symbol">${TAROT_SYMBOLS[servant.id] ?? ''}</div>
            <div class="scan-name">${servant.name}</div>
            <div class="scan-trait">${servant.trait}</div>
            <div class="scan-skill-row">
              <span class="scan-skill-label">スキル</span>
              <span class="scan-skill-val">${servant.skill}</span>
            </div>
            <div class="scan-confirm-msg">この従者を犠牲にします…</div>
          </div>
        `;
        scanResult.style.display = 'block';
        list.style.opacity = '0.3';

        confirmTimer = setTimeout(() => {
          cleanup();
          resolve(servant.id);
        }, 1500);
      });
    }

    function cleanup(): void {
      if (confirmTimer !== null) { clearTimeout(confirmTimer); confirmTimer = null; }
      unsubscribe?.();
      overlay.remove();
    }

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

// フェイズ中にダメージを受けた直後、メカニク欄にインラインで犠牲オプションを提示する。
// 従者がいない・dmg=0 の場合は即 false を返す。healed=true なら HP は回復済み。
function offerHealNow(dmg: number): Promise<boolean> {
  return new Promise(resolve => {
    if (dmg <= 0 || aliveServants().length === 0) { resolve(false); return; }
    const mechEl = document.getElementById('stage-mechanic');
    if (!mechEl) { resolve(false); return; }

    const section = document.createElement('div');
    section.className = 'heal-now-section';
    section.innerHTML = `
      <p class="heal-now-msg">従者を捧げて傷を癒しますか？（HP +${dmg}）</p>
      <div class="heal-now-btns">
        <button class="btn-sacrifice" id="btn-heal-now">従者を捧げる</button>
        <button class="btn-cancel"    id="btn-heal-skip">このまま続ける</button>
      </div>
    `;
    mechEl.appendChild(section);

    document.getElementById('btn-heal-now')?.addEventListener('click', async () => {
      const sid = await showServantSelectModal('傷を癒す従者を選ぶ');
      if (sid === -1) return;
      const sac = sacrificeServant(sid);
      if (!sac) return;
      playSFX('sacrifice');
      changeHp(dmg);
      updateHpDisplay();
      section.remove();
      resolve(true);
    });

    document.getElementById('btn-heal-skip')?.addEventListener('click', () => {
      section.remove();
      resolve(false);
    });
  });
}

// ===============================
// ST-01 茨の湖（ボートで横断）
// ===============================
// 【メカニクス】
//   3レーンを茨の密集地帯が前方から迫ってくる
//   A:左移動 / D:右移動 でボートを操舵して安全レーンへ
//   茨にぶつかると → 従者HPダメージ（従者なければ自分がダメージ）
//   回避成功 + 拍に合わせた操舵 → ボーナス進行
//   進行100% → クリア

async function runStage01(container: HTMLElement): Promise<void> {
  const state = getState();
  const stageData = STAGES[0];

  container.innerHTML = stageLayout(1, stageData.name, stageData.area);
  createParticles(document.getElementById('stage-particles')!, 20);

  await sleep(300);
  await narrateText(stageData.description, 40);

  const rowingServant = state.aliveServants[0] ?? null;
  if (rowingServant) {
    await sleep(500);
    await narrateText(`${rowingServant.name}「${rowingServant.dialogue.rowing}」`, 40);
  }
  await sleep(400);

  const servantMaxHp = 20;
  let servantHp = servantMaxHp;

  setMechanic(`
    <div class="pain-overlay" id="pain-overlay"></div>
    ${rowingServant ? `
      <div class="st01-servant-hp-row">
        <span class="st01-servant-label">${rowingServant.name} HP</span>
        <div class="st01-servant-hp-track">
          <div class="st01-servant-hp-fill" id="st01-servant-fill" style="width:100%"></div>
        </div>
        <span class="st01-servant-hp-val" id="st01-servant-val">${servantHp}/${servantMaxHp}</span>
      </div>
    ` : ''}
    <div class="st01-progress-row">
      <span class="st01-progress-label">対岸まで</span>
      <div class="progress-bar-container">
        <div class="progress-bar-fill" id="st01-progress-bar" style="width:0%"></div>
      </div>
      <span class="st01-progress-pct" id="st01-progress-pct">0%</span>
    </div>
    ${rowingServant ? `
      <div class="st01-servant-dialogue" id="st01-dialogue" style="opacity:0">
        <span class="st01-dialogue-name">${rowingServant.name}</span>
        <span class="st01-dialogue-text" id="st01-dialogue-text"></span>
      </div>
    ` : ''}

    <div class="st01-track-wrap">
      <div class="st01-track-row">
        <div class="st01-lane" id="st01-lane-0"></div>
        <div class="st01-lane" id="st01-lane-1"></div>
        <div class="st01-lane" id="st01-lane-2"></div>
      </div>
      <div class="st01-judge-line"></div>
      <div class="st01-boat-slots">
        <div class="st01-boat-slot" id="boat-slot-0"></div>
        <div class="st01-boat-slot active-slot" id="boat-slot-1">⛵</div>
        <div class="st01-boat-slot" id="boat-slot-2"></div>
      </div>
    </div>

    <div class="st01-key-row">
      <button class="st01-key-btn" id="btn-key-a">◀ A</button>
      <button class="st01-key-btn" id="btn-key-d">D ▶</button>
    </div>
    <div class="battle-action-row" id="st01-sac-row" style="display:none">
      <button class="btn-sacrifice" id="btn-sac-heal-01">従者を捧げる — 傷を癒す</button>
    </div>
    <p class="mechanic-hint">
      茨の密集地帯を避けよ。A:左 / D:右<br>
      拍に合わせて回避すると速く進む。
    </p>
    <div class="stage-result" id="stage-result" style="display:none"></div>
  `);

  let gameActive = true;
  let progress = 0;
  let totalPlayerDmg = 0;
  let servantSacrificed = false;
  let playerLane = 1; // 0=左 1=中央 2=右
  let lastMoveWasOnBeat = false;
  let beatCount = 0;
  const shownMilestones = new Set<number>();
  let dialogueLocked = false;
  let sacrificing = false; // 犠牲モーダル中は当たり判定を停止
  const beatMs = Math.round(60000 / getBPM());

  function updateHealBtn(): void {
    const row = document.getElementById('st01-sac-row');
    const btn = document.getElementById('btn-sac-heal-01') as HTMLButtonElement | null;
    if (!row || !btn) return;
    const canHeal = totalPlayerDmg > 0 && aliveServants().length > 0;
    row.style.display = canHeal ? 'block' : 'none';
    if (canHeal) btn.textContent = `従者を捧げる — 傷を癒す（HP +${totalPlayerDmg}）`;
  }

  document.getElementById('btn-sac-heal-01')?.addEventListener('click', async () => {
    if (!gameActive || sacrificing || totalPlayerDmg <= 0) return;
    sacrificing = true;
    const sid = await showServantSelectModal('傷を癒す従者を選ぶ');
    sacrificing = false;
    if (sid === -1) return;
    const sac = sacrificeServant(sid);
    if (!sac) return;
    playSFX('sacrifice');
    changeHp(totalPlayerDmg);
    totalPlayerDmg = 0;
    updateHpDisplay();
    updateHealBtn();
  });

  function updateProgressDisplay(): void {
    const bar = document.getElementById('st01-progress-bar');
    const pct = document.getElementById('st01-progress-pct');
    if (bar) bar.style.width = `${progress}%`;
    if (pct) pct.textContent = `${Math.round(progress)}%`;
  }

  function updateServantHpDisplay(): void {
    const fill = document.getElementById('st01-servant-fill');
    const val = document.getElementById('st01-servant-val');
    if (fill) fill.style.width = `${Math.round((servantHp / servantMaxHp) * 100)}%`;
    if (val) val.textContent = `${servantHp}/${servantMaxHp}`;
  }

  function updateBoatDisplay(): void {
    for (let i = 0; i < 3; i++) {
      const slot = document.getElementById(`boat-slot-${i}`);
      if (!slot) continue;
      slot.textContent = i === playerLane ? '⛵' : '';
      slot.classList.toggle('active-slot', i === playerLane);
    }
  }

  async function showServantLine(text: string): Promise<void> {
    if (dialogueLocked) return;
    dialogueLocked = true;
    const dial = document.getElementById('st01-dialogue');
    const textEl = document.getElementById('st01-dialogue-text');
    if (!dial || !textEl) { dialogueLocked = false; return; }
    dial.style.opacity = '1';
    textEl.textContent = '';
    for (const ch of text) {
      if (!gameActive && !servantSacrificed) { dialogueLocked = false; return; }
      textEl.textContent += ch;
      await sleep(40);
    }
    await sleep(2000);
    dial.style.opacity = '0';
    dialogueLocked = false;
  }

  function flashLane(laneIdx: number, type: 'safe' | 'hit'): void {
    const el = document.getElementById(`st01-lane-${laneIdx}`);
    if (!el) return;
    el.classList.add(`flash-${type}`);
    setTimeout(() => el.classList.remove(`flash-${type}`), 320);
  }

  function spawnThornWave(): void {
    if (!gameActive) return;
    const safeLane = Math.floor(Math.random() * 3);
    const animDuration = Math.round(2.5 * beatMs);

    for (let i = 0; i < 3; i++) {
      if (i === safeLane) continue;
      const lane = document.getElementById(`st01-lane-${i}`);
      if (!lane) continue;
      const thorn = document.createElement('div');
      thorn.className = 'st01-thorn-block';
      thorn.style.animationDuration = `${animDuration}ms`;
      thorn.innerHTML = '<span class="st01-thorn-inner">🌿🌿🌿<br>🌿🌿🌿<br>🌿🌿🌿</span>';
      lane.appendChild(thorn);
      thorn.addEventListener('animationend', () => thorn.remove(), { once: true });
    }

    // 茨がレーン底部（判定ライン）に到達するタイミングで判定
    setTimeout(() => {
      if (!gameActive) return;
      if (playerLane === safeLane) {
        // 回避成功
        const bonus = lastMoveWasOnBeat ? 4.5 : 2.5;
        progress = Math.min(100, progress + bonus);
        flashLane(safeLane, 'safe');
        playSFX(lastMoveWasOnBeat ? 'onbeat' : 'select');
        updateProgressDisplay();
        for (const ms of [25, 50, 75]) {
          if (progress >= ms && !shownMilestones.has(ms) && rowingServant) {
            shownMilestones.add(ms);
            showServantLine(rowingServant.dialogue.rowing);
          }
        }
        if (progress >= 100) finish('success');
      } else {
        // 被弾
        flashLane(playerLane, 'hit');
        flashDamage();
        document.getElementById('pain-overlay')?.classList.add('active');
        setTimeout(() => document.getElementById('pain-overlay')?.classList.remove('active'), 250);

        if (rowingServant && !servantSacrificed) {
          servantHp = Math.max(0, servantHp - 5);
          updateServantHpDisplay();
          if (servantHp === 5) showServantLine(rowingServant.dialogue.pain);
          if (servantHp <= 0) {
            servantSacrificed = true;
            showServantLine(rowingServant.dialogue.sacrifice);
            sacrificeServant(rowingServant.id);
            playSFX('sacrifice');
          }
        } else {
          // 従者なし → 直接ダメージ（犠牲モーダル中はスキップ）
          if (!sacrificing) {
            changeHp(-6);
            totalPlayerDmg += 6;
            updateHpDisplay();
            updateHealBtn();
            if (state.hp <= 0) finish('dead');
          }
        }
      }
    }, Math.round(animDuration * 0.62));
  }

  function moveLane(dir: 'a' | 'd'): void {
    if (!gameActive) return;
    const { isOnBeat } = checkOnBeat();
    lastMoveWasOnBeat = isOnBeat;
    flashActionBeat(isOnBeat);

    const prev = playerLane;
    if (dir === 'a') playerLane = Math.max(0, playerLane - 1);
    else playerLane = Math.min(2, playerLane + 1);
    if (playerLane !== prev) updateBoatDisplay();

    const btn = document.getElementById(`btn-key-${dir}`);
    if (btn) {
      btn.classList.add('pressed-key');
      setTimeout(() => btn.classList.remove('pressed-key'), 110);
    }
  }

  function finish(outcome: 'success' | 'dead'): void {
    if (!gameActive) return;
    gameActive = false;
    clearInterval(beatTicker);
    document.removeEventListener('keydown', onKeyDown);
    document.getElementById('pain-overlay')?.classList.remove('active');
    if (outcome === 'dead') { showGameOver(container); return; }
    finishStage01();
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (!gameActive) return;
    const k = e.key.toLowerCase();
    if (k === 'a') moveLane('a');
    else if (k === 'd') moveLane('d');
  }

  // 拍ごとにベース進行、2拍ごとに茨の波を生成
  const beatTicker = setInterval(() => {
    if (!gameActive) return;
    beatCount++;
    progress = Math.min(100, progress + 1.2);
    updateProgressDisplay();
    if (progress >= 100) { finish('success'); return; }
    if (beatCount % 2 === 0) spawnThornWave();
  }, beatMs);

  document.addEventListener('keydown', onKeyDown);
  document.getElementById('btn-key-a')?.addEventListener('click', () => moveLane('a'));
  document.getElementById('btn-key-d')?.addEventListener('click', () => moveLane('d'));

  async function finishStage01(): Promise<void> {
    // プレイ終了時はヒールボタンを隠す
    const sacRow = document.getElementById('st01-sac-row');
    if (sacRow) sacRow.style.display = 'none';

    const resultEl = document.getElementById('stage-result')!;
    resultEl.style.display = 'block';
    let msg: string;
    if (servantSacrificed && rowingServant) {
      msg = `${rowingServant.name}が茨に身を投じた。口はその魂を喰らい、あなたは対岸に辿り着いた。`;
    } else {
      msg = `対岸に辿り着いた。${totalPlayerDmg > 0 ? `HPが${totalPlayerDmg}削られた。` : '傷ひとつなく渡り切った。'}`;
    }
    await typewriter(resultEl, msg, 40);
    recordStageResult({
      stageId: 1, stageName: stageData.name,
      outcome: servantSacrificed ? 'sacrifice' : 'success',
      sacrificedServantName: servantSacrificed ? rowingServant?.name : undefined,
      hpDelta: -totalPlayerDmg,
    });
    await sleep(800);
    addNextButton(container, resultEl);
  }
}

// ===============================
// ST-02 鉱山の遭遇（従者獲得 → 犬タイミング）
// ===============================
// 【メカニクス】
//   鉱山で共鳴度2位・3位の従者を発見 → 仲間になる
//   番犬が出現。タイミングよく避けると従者が反撃・撃退
//   早すぎると落石で足止め（もう一度チャンス）
//   遅すぎると噛まれてHPダメージ

async function runStage02(container: HTMLElement): Promise<void> {
  const state = getState();
  const stageData = STAGES[1];

  container.innerHTML = stageLayout(2, stageData.name, stageData.area);
  createParticles(document.getElementById('stage-particles')!, 15);

  await sleep(300);
  await narrateText(stageData.description, 40);
  await sleep(500);

  // 従者獲得（共鳴度2位・3位）
  const newServant1 = acquireNextServant();
  const newServant2 = acquireNextServant();

  if (newServant1) {
    await sleep(400);
    await narrateText(`${newServant1.name}が鉱山の奥から現れた。`, 40);
    await sleep(200);
    await narrateText(`${newServant1.name}「${newServant1.dialogue.intro}」`, 40);
    await sleep(500);
  }
  if (newServant2) {
    await narrateText(`${newServant2.name}も姿を現した。`, 40);
    await sleep(200);
    await narrateText(`${newServant2.name}「${newServant2.dialogue.intro}」`, 40);
    await sleep(500);
  }

  // 覚悟の間
  await new Promise<void>(resolve => {
    const narrativeEl = document.getElementById('stage-narrative');
    if (narrativeEl) {
      const readyBtn = document.createElement('button');
      readyBtn.className = 'btn-primary stage-ready-btn';
      readyBtn.textContent = '目を凝らせ——';
      readyBtn.style.marginTop = '1.5rem';
      readyBtn.addEventListener('click', () => { readyBtn.remove(); resolve(); }, { once: true });
      narrativeEl.appendChild(readyBtn);
    } else { resolve(); }
  });
  await sleep(300);

  await narrateText('鉱山の番犬が牙を剥いて突進してくる——', 35);
  await sleep(300);

  const APPROACH_MS = 8000;
  const SWEET_SPOT_MIN = 0.40;
  const SWEET_SPOT_MAX = 0.82;

  function buildDogScene(): void {
    setMechanic(`
      <div class="wolf-approach-scene" id="wolf-scene">
        <div class="wolf-forest-bg"></div>
        <div class="wolf-img-wrap" id="wolf-wrap">
          <img src="/wolf.svg" class="wolf-img" id="wolf-img" alt="dog" draggable="false"/>
        </div>
        <div class="wolf-danger-bar-wrap">
          <div class="wolf-danger-bar" id="wolf-danger-bar" style="width:0%"></div>
        </div>
        <div class="wolf-hud">
          <div class="wolf-time-display">
            <span class="wolf-time-label" id="wolf-time-label">遠くから唸り声が聞こえる</span>
          </div>
        </div>
        <button class="btn-wolf-escape" id="btn-dodge">避けろ！</button>
      </div>
      <div class="stage-result" id="stage-result" style="display:none"></div>
    `);
  }

  async function runDogApproach(durationMs: number, isRetry: boolean): Promise<void> {
    buildDogScene();
    if (isRetry) {
      const lbl = document.getElementById('wolf-time-label');
      if (lbl) lbl.textContent = '犬が再び向かってくる！';
    }

    let gameActive = true;
    let elapsedMs = 0;
    let lastTick = Date.now();
    let rafId: number;

    await new Promise<void>(resolveRound => {
      function tick(): void {
        if (!gameActive) return;
        const now = Date.now();
        elapsedMs += now - lastTick;
        lastTick = now;

        const progress = Math.min(1, elapsedMs / durationMs);

        const wolfEl = document.getElementById('wolf-img') as HTMLImageElement | null;
        if (wolfEl) {
          wolfEl.style.width = `${6 + progress * 84}%`;
          wolfEl.style.maxWidth = `${6 + progress * 84}%`;
          wolfEl.style.filter =
            `drop-shadow(0 0 ${Math.round(progress * 24)}px rgba(180,0,0,${progress * 0.9})) sepia(${Math.round(progress * 120)}%)`;
        }
        const dangerBar = document.getElementById('wolf-danger-bar');
        if (dangerBar) dangerBar.style.width = `${progress * 100}%`;

        const timeLabel = document.getElementById('wolf-time-label');
        if (timeLabel) {
          if (progress < 0.35) timeLabel.textContent = '唸りながら近づいてくる…';
          else if (progress < 0.65) timeLabel.textContent = '速度が上がった——！';
          else if (progress < SWEET_SPOT_MAX) timeLabel.textContent = '今だ！';
          else timeLabel.textContent = '！！！';
        }

        if (progress >= 1.0) {
          gameActive = false;
          cancelAnimationFrame(rafId);
          resolveRound();
          onBitten();
          return;
        }
        rafId = requestAnimationFrame(tick);
      }
      rafId = requestAnimationFrame(tick);

      document.getElementById('btn-dodge')?.addEventListener('click', () => {
        if (!gameActive) return;
        gameActive = false;
        cancelAnimationFrame(rafId);
        const p = Math.min(1, elapsedMs / durationMs);
        const dodgeElapsedMs = elapsedMs;
        resolveRound();
        if (p < SWEET_SPOT_MIN) {
          onEarlyDodge();
        } else if (p <= SWEET_SPOT_MAX) {
          onGoodDodge(dodgeElapsedMs);
        } else {
          onLateDodge();
        }
      }, { once: true });
    });
  }

  let finished = false;

  async function onEarlyDodge(): Promise<void> {
    if (finished) return;
    const narrativeEl = document.getElementById('stage-narrative');
    if (narrativeEl) narrativeEl.textContent = '';
    await narrateText('早すぎた！　落石で犬の足が止まった——もう一度来る！', 40);
    await sleep(1500);
    // 2回目チャンス（5秒、リトライフラグ）
    await runDogApproach(5000, true);
  }

  async function onGoodDodge(dodgeElapsedMs: number): Promise<void> {
    if (finished) return;
    finished = true;
    playSFX('reveal');
    const goldEarned = Math.floor(dodgeElapsedMs / 1000 * GAME_CONFIG.st02.goldPerSec);
    const attacker = newServant1 ?? newServant2 ?? state.aliveServants[0];
    const msg = attacker
      ? `${attacker.name}が犬に飛びかかり撃退した！　道が開けた。金貨+${goldEarned}`
      : `間一髪で避けた。犬は諦めて引いていった。金貨+${goldEarned}`;
    await endStage02(msg, 'success', null, 0, goldEarned);
    addGold(goldEarned);
  }

  async function onLateDodge(): Promise<void> {
    if (finished) return;
    finished = true;
    changeHp(-15);
    updateHpDisplay();
    flashDamage();
    if (state.hp <= 0) { showGameOver(container); return; }
    const healed = await offerHealNow(15);
    await endStage02(
      healed ? '避けるのが遅れた。だが従者が傷を癒した。' : '避けるのが遅れた。犬の牙が腕を掠めた。HP -15',
      healed ? 'sacrifice' : 'fail', null, healed ? 0 : 15, 0,
    );
  }

  async function onBitten(): Promise<void> {
    if (finished) return;
    finished = true;
    changeHp(-25);
    updateHpDisplay();
    flashDamage();
    if (state.hp <= 0) { showGameOver(container); return; }
    const healed = await offerHealNow(25);
    await endStage02(
      healed ? '逃げ遅れた。だが従者が傷を癒した。' : '逃げ遅れた。犬に噛みつかれた。HP -25',
      healed ? 'sacrifice' : 'fail', null, healed ? 0 : 25, 0,
    );
  }

  await runDogApproach(APPROACH_MS, false);

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
  const cfg = getLeverConfig().selection.st03;

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

  document.getElementById('btn-eat-a')?.addEventListener('click', () => {
    if (!choiceMade) { flashActionBeat(checkOnBeat().isOnBeat); resolveChoice('a'); }
  });
  document.getElementById('btn-eat-b')?.addEventListener('click', () => {
    if (!choiceMade) { flashActionBeat(checkOnBeat().isOnBeat); resolveChoice('b'); }
  });
  document.getElementById('btn-eat-none')?.addEventListener('click', () => {
    if (!choiceMade) { flashActionBeat(checkOnBeat().isOnBeat); resolveChoice('none'); }
  });

  async function resolveChoice(choice: 'a' | 'b' | 'none'): Promise<void> {
    choiceMade = true;
    clearInterval(countdownId);

    let hpDelta = 0;
    let msg = '';
    let healed = false;

    if (choice === 'a') {
      hpDelta = 10; changeHp(10); updateHpDisplay();
      msg = 'Aを食べた。毒々しい見た目だったが、安全だった。HP +10';
    } else if (choice === 'b') {
      hpDelta = -15; changeHp(-15); updateHpDisplay(); flashDamage();
      if (state.hp <= 0) { showGameOver(container); return; }
      // ダメージ直後にインラインで犠牲オプションを提示
      healed = await offerHealNow(15);
      if (healed) {
        hpDelta = 0;
        msg = 'Bを食べた。毒が回ったが、従者が傷を癒した。';
      } else {
        msg = 'Bを食べた。SNSの噂は正しかった。猛毒だ。HP -15';
      }
    } else {
      msg = '何も食べなかった。安全だが、何も得られなかった。';
    }

    const resultEl = document.getElementById('stage-result')!;
    resultEl.style.display = 'block';
    await typewriter(resultEl, msg, 40);

    if (state.hp <= 0) { showGameOver(container); return; }

    recordStageResult({
      stageId: 3, stageName: stageData.name,
      outcome: healed ? 'sacrifice' : revealed ? 'sacrifice' : hpDelta >= 0 ? 'success' : 'fail',
      sacrificedServantName: healed || revealed ? targetServant?.name : undefined,
      choice, hpDelta,
    });

    await sleep(800);
    addNextButton(container, resultEl);
  }
}

// ===============================
// ST-04 孤児との出会い（RPGダイアログ）
// ===============================
// 【メカニクス】
//   4ラウンドの選択。信頼度が積み上がる
//   良い選択（話す・渡す・親切）→ 信頼+1
//   悪い選択（無視・騙す・追い払う）→ 信頼変化なし
//   最終ラウンドで信頼3以上 → 子どもが従者として仲間になる

interface DialogueRound {
  prompt: string;
  options: { text: string; good: boolean; response: string }[];
}

async function runStage04(container: HTMLElement): Promise<void> {
  const state = getState();
  const stageData = STAGES[3];

  container.innerHTML = stageLayout(4, stageData.name, stageData.area);

  await sleep(300);
  await narrateText(stageData.description, 40);
  await sleep(600);

  // 次に加入する可能性のある従者をプールから覗く
  const candidateServant = state.servantPool[state.nextServantIndex] ?? null;

  const rounds: DialogueRound[] = [
    {
      prompt: '廃屋の陰に、小さな子どもが座っている。目が合った。',
      options: [
        { text: '声をかける', good: true, response: '子どもは驚いたように顔を上げたが、すぐに警戒を緩めた。' },
        { text: '見なかったことにする', good: false, response: '子どもは、あなたが通り過ぎるのを黙って見ていた。' },
      ],
    },
    {
      prompt: '子どもは怯えながらも、あなたを見つめている。',
      options: [
        { text: '優しく話しかける', good: true, response: '「怖くないよ」と言うと、子どもは少しだけ肩の力を抜いた。' },
        { text: '急ぎ足で通り過ぎる', good: false, response: '子どもは何も言わず、目だけで追ってきた。' },
        { text: '「何者だ？」と問いただす', good: false, response: '子どもはびくっとして、壁に背を向けた。' },
      ],
    },
    {
      prompt: '話を聞くと、子どもは親をなくしたという。腹を空かせている様子だ。',
      options: [
        { text: '食べ物を分ける', good: true, response: '子どもは両手でそれを受け取り、小さな声でお礼を言った。' },
        { text: '安全な場所を教える', good: true, response: '子どもは真剣な顔でうなずき、行き先を覚えようとしている。' },
        { text: '「自分のことで精一杯だ」と断る', good: false, response: '子どもは「……そうですよね」と静かに言った。' },
      ],
    },
    {
      prompt: '子どもが立ち上がり、あなたを見上げる。「……一緒に連れて行ってもらえませんか」',
      options: [
        { text: '「来なさい」と手を差し伸べる', good: true, response: '子どもはその手を握った。小さいが、確かな力で。' },
        { text: '「危険だから無理だ」と断る', good: false, response: '子どもは「わかりました」と言って、また座り込んだ。' },
        { text: '黙って立ち去る', good: false, response: '子どもの視線が背中に刺さる。振り返らなかった。' },
      ],
    },
  ];

  let trust = 0;
  let currentRound = 0;

  setMechanic(`
    <div class="rpg-dialogue-scene" id="rpg-dialogue">
      <div class="rpg-trust-bar-wrap">
        <span class="rpg-trust-label">信頼度</span>
        <div class="rpg-trust-track">
          <div class="rpg-trust-fill" id="rpg-trust-fill" style="width:0%"></div>
        </div>
        <span class="rpg-trust-val" id="rpg-trust-val">0 / ${rounds.length}</span>
      </div>
      <p class="rpg-prompt" id="rpg-prompt"></p>
      <p class="rpg-response" id="rpg-response" style="opacity:0"></p>
      <div class="rpg-options" id="rpg-options"></div>
    </div>
    <div class="stage-result" id="stage-result" style="display:none"></div>
  `);

  async function showRound(roundIdx: number): Promise<void> {
    const round = rounds[roundIdx];
    const promptEl = document.getElementById('rpg-prompt')!;
    const responseEl = document.getElementById('rpg-response')!;
    const optionsEl = document.getElementById('rpg-options')!;

    responseEl.style.opacity = '0';
    optionsEl.innerHTML = '';
    promptEl.textContent = '';
    await typewriter(promptEl, round.prompt, 35);
    await sleep(300);

    round.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = `choice-btn${opt.good ? '' : ' sel-danger'}`;
      btn.textContent = opt.text;
      btn.addEventListener('click', async () => {
        flashActionBeat(checkOnBeat().isOnBeat);
        optionsEl.querySelectorAll('button').forEach(b => (b as HTMLButtonElement).disabled = true);
        if (opt.good) trust++;
        updateTrustBar();
        responseEl.style.opacity = '1';
        responseEl.textContent = '';
        await typewriter(responseEl, opt.response, 35);
        await sleep(800);

        currentRound++;
        if (currentRound < rounds.length) {
          await showRound(currentRound);
        } else {
          await finishStage04();
        }
      }, { once: true });
      optionsEl.appendChild(btn);
    });
  }

  function updateTrustBar(): void {
    const fill = document.getElementById('rpg-trust-fill');
    const val = document.getElementById('rpg-trust-val');
    const pct = Math.round((trust / rounds.length) * 100);
    if (fill) fill.style.width = `${pct}%`;
    if (val) val.textContent = `${trust} / ${rounds.length}`;
  }

  async function finishStage04(): Promise<void> {
    const resultEl = document.getElementById('stage-result')!;
    resultEl.style.display = 'block';
    let msg: string;
    let outcome: 'success' | 'fail';

    if (trust >= 3 && candidateServant) {
      acquireNextServant();
      msg = `${candidateServant.name}が仲間になった。「${candidateServant.dialogue.intro}」`;
      outcome = 'success';
      state.orphanChoice = 'joined';
      playSFX('reveal');
    } else if (trust >= 2) {
      msg = '子どもは道の情報を教えてくれた。信頼は芽生えたが、旅は別々だ。';
      outcome = 'success';
      state.orphanChoice = 'kind';
    } else {
      msg = '子どもとの縁はなかった。番人の試練が、より厳しくなるだろう。';
      outcome = 'fail';
      state.orphanChoice = 'cold';
    }

    await typewriter(resultEl, msg, 40);
    recordStageResult({
      stageId: 4, stageName: stageData.name,
      outcome,
      choice: state.orphanChoice ?? undefined,
      hpDelta: 0,
    });
    await sleep(800);
    addNextButton(container, resultEl);
  }

  await showRound(0);
}

// ===============================
// ST-05 盗賊との遭遇
// ===============================

async function runStage05(container: HTMLElement): Promise<void> {
  const state = getState();
  const stageData = STAGES[4];
  const cfg = getLeverConfig().battle.st05;

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
  document.getElementById('btn-flee')?.addEventListener('click', async () => {
    changeHp(-5); updateHpDisplay();
    if (state.hp <= 0) { showGameOver(container); return; }
    const healed = await offerHealNow(5);
    await endStage05(
      healed ? 0 : -5, 'success', null,
      healed ? '逃げた。従者が傷を癒した。' : '逃げた。多少傷ついたが命は助かった。HP -5',
    );
  });
  document.getElementById('btn-negotiate')?.addEventListener('click', async () => {
    if (state.bigFive.A >= 0.6) {
      await endStage05(0, 'success', null, '交渉成功。盗賊は道を開けた。');
    } else {
      changeHp(-8); updateHpDisplay(); flashDamage();
      if (state.hp <= 0) { showGameOver(container); return; }
      const healed = await offerHealNow(8);
      await endStage05(
        healed ? 0 : -8, healed ? 'sacrifice' : 'fail', null,
        healed ? '交渉失敗。だが従者が傷を癒した。' : '交渉失敗。代償を払った。HP -8',
      );
    }
  });
  document.getElementById('btn-pay')?.addEventListener('click', async () => {
    await endStage05(0, 'success', null, '通行料を払った。財布が軽くなった。');
  });

  function startFight(): void {
    document.querySelectorAll('.choice-grid-2x2 .choice-btn').forEach(b => (b as HTMLButtonElement).disabled = true);
    const fightSection = document.getElementById('battle-section')!;
    fightSection.style.display = 'block';

    let clicks = 0;
    let fightActive = true;
    let timeLeft = cfg.timeLimitSec;

    const timerInterval = setInterval(async () => {
      timeLeft--;
      const timerEl = document.getElementById('fight-timer');
      if (timerEl) timerEl.textContent = String(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        if (!fightActive) return;
        fightActive = false;
        changeHp(-15); updateHpDisplay(); flashDamage();
        if (state.hp <= 0) { showGameOver(container); return; }
        const healed = await offerHealNow(15);
        await endStage05(
          healed ? 0 : -15, healed ? 'sacrifice' : 'fail', null,
          healed ? '敗北した。だが従者が傷を癒した。' : '敗北した。HP -15',
        );
      }
    }, 1000);

    const onFightClick = () => {
      if (!fightActive) return;
      const { isOnBeat } = checkOnBeat();
      flashActionBeat(isOnBeat);
      clicks += isOnBeat ? 2 : 1;
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

  async function endStage05(hpDelta: number, outcome: 'success' | 'sacrifice' | 'fail', _sid: null, msg: string): Promise<void> {
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
  const prices = GAME_CONFIG.st06.itemPrices;

  container.innerHTML = stageLayout(6, stageData.name, stageData.area);

  await sleep(300);
  await narrateText('市場。旅の補給ができる最後のチャンスだ。所持金の範囲で選べ。', 40);
  await sleep(600);

  const items = [
    { id: 'potion', icon: '&#x1F9EA;', name: '回復薬', desc: '後のステージでHP+30', price: prices.potion },
    { id: 'sword',  icon: '&#x2694;',  name: '剣',     desc: 'ボス攻撃力UP、ダメージ減少', price: prices.sword },
    { id: 'key',    icon: '&#x1F5DD;', name: '鍵',     desc: 'ST-07の戦闘をスキップ', price: prices.key },
    { id: 'food',   icon: '&#x1F35E;', name: '携帯食', desc: '即時HP+10', price: prices.food },
  ];

  const selected = new Set<string>();

  function spentGold(): number {
    return [...selected].reduce((sum, id) => sum + (items.find(i => i.id === id)?.price ?? 0), 0);
  }

  function remainingGold(): number {
    return state.gold - spentGold();
  }

  function renderShop(): void {
    const remaining = remainingGold();
    setMechanic(`
      <div class="shop-gold-display">
        所持金: <span id="shop-gold-total">${state.gold}</span>枚
        <span class="shop-gold-arrow">→</span>
        残り: <span id="shop-gold-remaining">${remaining}</span>枚
      </div>
      <div class="item-shop-grid">
        ${items.map(item => {
          const isSelected = selected.has(item.id);
          const canAfford = isSelected || remaining >= item.price;
          return `
            <div class="item-card ${isSelected ? 'selected' : ''} ${canAfford ? '' : 'cant-afford'}"
                 id="item-${item.id}" data-id="${item.id}">
              <div class="item-icon">${item.icon}</div>
              <div class="item-name">${item.name}</div>
              <div class="item-desc">${item.desc}</div>
              <div class="item-price">${item.price}枚</div>
            </div>
          `;
        }).join('')}
      </div>
      <button class="btn-primary" id="btn-confirm-shop" style="margin-top:1rem">確定する</button>
      <div class="stage-result" id="stage-result" style="display:none"></div>
    `);

    document.querySelectorAll('.item-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = (card as HTMLElement).dataset.id!;
        if (selected.has(id)) {
          selected.delete(id);
        } else {
          const itemPrice = items.find(i => i.id === id)?.price ?? 0;
          if (remainingGold() >= itemPrice) {
            selected.add(id);
          }
        }
        renderShop();
      });
    });

    document.getElementById('btn-confirm-shop')?.addEventListener('click', async () => {
      const totalCost = spentGold();
      addGold(-totalCost);

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
        ? `${names.join('・')} を手に入れた（${totalCost}枚）。${hpGain > 0 ? `HP +${hpGain}` : ''}`
        : '何も買わなかった。金貨を温存する。';

      await typewriter(resultEl, msg, 40);

      recordStageResult({
        stageId: 6, stageName: stageData.name,
        outcome: 'item', hpDelta: hpGain,
      });

      await sleep(800);
      addNextButton(container, resultEl);
    });
  }

  renderShop();
}

// ===============================
// ST-07 番人との対峙（タイミング）
// ===============================

async function runStage07(container: HTMLElement): Promise<void> {
  const state = getState();
  const stageData = STAGES[6];
  const cfg = getLeverConfig().timing.st07;

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
  await sleep(400);

  // 覚悟の間
  await new Promise<void>(resolve => {
    const narrativeEl = document.getElementById('stage-narrative');
    if (narrativeEl) {
      const readyBtn = document.createElement('button');
      readyBtn.className = 'btn-primary stage-ready-btn';
      readyBtn.textContent = '向き合う——';
      readyBtn.style.marginTop = '1.5rem';
      readyBtn.addEventListener('click', () => { readyBtn.remove(); resolve(); }, { once: true });
      narrativeEl.appendChild(readyBtn);
    } else {
      resolve();
    }
  });
  await sleep(300);

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

      // リングがBPMに同期: t_perfect が3拍目に来るよう DURATION を算出
      const RING_START = 200;
      const BTN_SIZE = 80;
      const PERFECT_FRAC = 1 - BTN_SIZE / RING_START; // ≈ 0.6
      const DURATION = Math.round((3 * 60000 / getBPM()) / PERFECT_FRAC);
      const t_perfect = DURATION * PERFECT_FRAC;
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
            changeHp(-cfg.missDamage); updateHpDisplay(); flashDamage();
            statusEl.textContent = `遅すぎた... HP -${cfg.missDamage}`;
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
          changeHp(-cfg.missDamage); updateHpDisplay(); flashDamage();
          statusEl.textContent = `タイミングがズレた。 HP -${cfg.missDamage}`;
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

  // クライマックスBGMに切替（ST-08〜09）
  switchBGMTrack('climax');

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

    document.getElementById('troll-left')?.addEventListener('click', () => {
      flashActionBeat(checkOnBeat().isOnBeat); handleChoice('left');
    });
    document.getElementById('troll-center')?.addEventListener('click', () => {
      flashActionBeat(checkOnBeat().isOnBeat); handleChoice('center');
    });
    document.getElementById('troll-right')?.addEventListener('click', () => {
      flashActionBeat(checkOnBeat().isOnBeat); handleChoice('right');
    });
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
// ST-09 真実の口（最終ボス・5楽章構成）
// ===============================
// Phase 1 Grave（宣告）: 強制ナラティブ
// Phase 2 Andante（問い）: レバーのみ、On-Beat=2倍ダメージ
// Phase 3 Allegro（決断）: HP60%以下で生贄解放
// Phase 4 Adagio（沈黙）: 従者1体で発動する静寂
// Phase 5 Finale（終止）: 最後の一撃のOn-Beat判定

function buildGraveLines(state: ReturnType<typeof getState>): string[] {
  const lines: string[] = [];
  if (state.sacrificeCount > 0) {
    const first = state.servants.find(s => s.id === state.firstSacrificedId);
    lines.push(first
      ? `最初に差し出したのは${first.name}——お前は${state.sacrificeCount}体を手放した`
      : `お前は${state.sacrificeCount}体を手放した`);
  } else {
    lines.push('誰一人として犠牲にしなかった。それはどういう意味だ');
  }
  if (state.orphanChoice === 'joined') {
    lines.push('孤児に手を差し伸べた');
  } else if (state.orphanChoice === 'cold') {
    lines.push('孤独な子どもの前を、通り過ぎた');
  }
  if (state.st08TrustAfterBetrayal === true) {
    lines.push('裏切りの後でも、従者を信じることを選んだ');
  } else if (state.st08TrustAfterBetrayal === false) {
    lines.push('一度傷ついた信頼を、捨てた');
  }
  return lines.slice(0, 3);
}

async function runStage09(container: HTMLElement): Promise<void> {
  const state = getState();
  const stageData = STAGES[8];
  const cfg = getLeverConfig().battle.st09;

  // クライマックスBGM（ST-08で切替済みだがここでも保証）
  switchBGMTrack('climax');

  container.innerHTML = stageLayout(9, stageData.name, stageData.area);
  createParticles(document.getElementById('stage-particles')!, 30);

  // ── Phase 1: Grave（宣告）── 強制ナラティブ ──
  await sleep(300);
  await narrateText('問の間。高さ3mの真実の口。これまでの選択が映し出される。', 45);
  await sleep(500);
  for (const line of buildGraveLines(state)) {
    await narrateText(`「${line}」`, 55);
    await sleep(700);
  }
  await sleep(400);
  await narrateText('「お前は何者だ」', 70);
  await sleep(800);

  // 覚悟の間
  await new Promise<void>(resolve => {
    const narrativeEl = document.getElementById('stage-narrative');
    if (narrativeEl) {
      const readyBtn = document.createElement('button');
      readyBtn.className = 'btn-primary stage-ready-btn';
      readyBtn.textContent = '——答えを示せ';
      readyBtn.style.marginTop = '1.5rem';
      readyBtn.addEventListener('click', () => { readyBtn.remove(); resolve(); }, { once: true });
      narrativeEl.appendChild(readyBtn);
    } else { resolve(); }
  });
  await sleep(500);

  const bossMaxHp = state.hasSword ? cfg.bossMaxHp - 20 : cfg.bossMaxHp;
  let bossHp = bossMaxHp;
  let roundActive = false;
  let leverCancelFn: (() => void) | null = null;
  let currentPhase = 2;
  let adagioTriggered = false;

  const PHASE_LABELS: Record<number, string> = {
    2: '第2楽章 — 問い（Andante）',
    3: '第3楽章 — 決断（Allegro）',
    4: '第4楽章 — 沈黙（Adagio）',
    5: '第5楽章 — 終止（Finale）',
  };

  function renderBossUI(): void {
    setMechanic(`
      <div class="boss-phase-badge" id="boss-phase-badge">${PHASE_LABELS[2]}</div>
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
      <p class="boss-status" id="boss-status">拍に合わせてレバーを引け</p>
      <div class="boss-action-row">
        <button class="btn-attack" id="btn-boss-lever">レバー攻撃<br><small>（5回→${cfg.leverDamage}dmg / 拍頭2倍）</small></button>
        <button class="btn-sacrifice" id="btn-boss-sacrifice"
          style="opacity:0.35;pointer-events:none" disabled>
          従者を投じる<br><small>（第3楽章で解放）</small>
        </button>
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

  function setPhaseBadge(phase: number): void {
    const el = document.getElementById('boss-phase-badge');
    if (el) el.textContent = PHASE_LABELS[phase] ?? '';
  }

  function unlockSacrifice(): void {
    const sacBtn = document.getElementById('btn-boss-sacrifice') as HTMLButtonElement | null;
    if (sacBtn) {
      sacBtn.disabled = false;
      sacBtn.style.opacity = '1';
      sacBtn.style.pointerEvents = 'auto';
      sacBtn.innerHTML = `従者を投じる<br><small>（${cfg.sacrificeDamage}dmg）</small>`;
    }
  }

  function checkPhaseTransition(): void {
    if (currentPhase === 2 && bossHp <= bossMaxHp * 0.6) {
      currentPhase = 3;
      setPhaseBadge(3);
      setStatus('判断の時が来た——従者を投じることができる');
      unlockSacrifice();
    }
  }

  async function triggerAdagio(): Promise<void> {
    currentPhase = 4;
    setPhaseBadge(4);
    const leverBtn = document.getElementById('btn-boss-lever') as HTMLButtonElement | null;
    const sacBtn = document.getElementById('btn-boss-sacrifice') as HTMLButtonElement | null;
    if (leverBtn) leverBtn.disabled = true;
    if (sacBtn) sacBtn.disabled = true;
    setStatus('……');
    await sleep(1200);
    setStatus('……最後の一人だ。それでも戦うか。');
    await sleep(2200);
    currentPhase = 5;
    setPhaseBadge(5);
    setStatus('最後の攻撃——拍に合わせて示せ');
    if (leverBtn) leverBtn.disabled = false;
    if (sacBtn) {
      sacBtn.disabled = false;
      sacBtn.style.opacity = '1';
      sacBtn.style.pointerEvents = 'auto';
    }
  }

  function checkBossDeath(): boolean {
    if (bossHp <= 0) {
      const { isOnBeat, offsetMs } = checkOnBeat();
      state.bossDefeated = true;
      state.finaleOnBeat = isOnBeat;
      logRhythm({ stageId: 9, action: 'finale_blow', beatOffset: offsetMs, isOnBeat });
      flashActionBeat(isOnBeat);
      if (isOnBeat) playSFX('onbeat');
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
    if (state.hp <= 0) { showGameOver(container); return true; }
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
            leverCancelFn = null;
            leverBtn.innerHTML = origText;
            if (counterEl) counterEl.style.display = 'none';

            // On-Beat判定（コンボ完了時）
            const { isOnBeat } = checkOnBeat();
            const damage = isOnBeat ? cfg.leverDamage * 2 : cfg.leverDamage;
            bossHp -= damage;
            updateBossHp();
            playSFX('select');
            flashActionBeat(isOnBeat);
            logRhythm({ stageId: 9, action: 'lever', beatOffset: 0, isOnBeat });

            if (isOnBeat) {
              setStatus(`On-Beat！ ${damage}ダメージ！（2倍連撃）`);
              playSFX('onbeat');
            } else {
              setStatus(`${damage}ダメージ！`);
            }

            checkPhaseTransition();
            if (checkBossDeath()) return;
            if (bossCounter()) return;

            if (aliveServants().length === 1 && !adagioTriggered && bossHp > 0) {
              adagioTriggered = true;
              roundActive = false;
              triggerAdagio();
              return;
            }
            roundActive = false;
          }
        };

        leverCancelFn = () => {
          leverBtn.removeEventListener('click', rapidClick);
          leverCancelFn = null;
          leverBtn.innerHTML = origText;
          if (counterEl) counterEl.style.display = 'none';
          if (cntEl) cntEl.textContent = '0';
          roundActive = false;
        };

        leverBtn.addEventListener('click', rapidClick);
      });
    }

    if (sacBtn) {
      sacBtn.addEventListener('click', async () => {
        if (currentPhase < 3) return;
        if (roundActive && leverCancelFn) leverCancelFn();
        if (roundActive) return;
        if (aliveServants().length === 0) { setStatus('従者がいません'); return; }

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

        // 従者消滅のライトモチーフ（逆再生）
        const servant = state.servants.find(s => s.id === sid);
        if (servant) playMotif(servant.motifNotes, 'reverse');

        bossHp -= cfg.sacrificeDamage;
        updateBossHp();
        setStatus(`${sac?.name ?? '従者'}を投じた！ ${cfg.sacrificeDamage}ダメージ！`);

        // 全従者が尽きた場合は即終了
        if (aliveServants().length === 0) {
          bossHp = 0;
          state.bossDefeated = true;
          state.finaleOnBeat = false;
          logRhythm({ stageId: 9, action: 'final_sacrifice', beatOffset: 0, isOnBeat: false });
          endStage09();
          return;
        }

        checkPhaseTransition();
        if (checkBossDeath()) return;

        if (aliveServants().length === 1 && !adagioTriggered && bossHp > 0) {
          adagioTriggered = true;
          roundActive = false;
          if (leverBtn) leverBtn.disabled = false;
          sacBtn.disabled = false;
          await triggerAdagio();
          return;
        }

        roundActive = false;
        if (leverBtn) leverBtn.disabled = false;
        sacBtn.disabled = false;
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
    const msg = state.finaleOnBeat
      ? '拍の瞬間に——真実の口が砕け散った。旅が終わる。'
      : '真実の口が砕け散った。旅が終わる。';
    await typewriter(resultEl, msg, 50);
    recordStageResult({ stageId: 9, stageName: stageData.name, outcome: 'success', hpDelta: 0 });
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
    // runner の同期部分（container.innerHTML = stageLayout(...)）が先に走るため
    // Promise を受け取った直後に DOM へアクセスできる
    runner(container).catch(err => console.error('Stage error:', err));
    setupRfidButton(container);
  }
}
