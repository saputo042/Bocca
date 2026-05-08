// BOCCA — インタラクション管理（ドラッグ&ドロップ / 特殊UI）

import { SKILL_VESSELS } from '../data/personas';
import {
  getGameState,
  recordDrag,
} from '../utils/gameState';
import type { ScenarioNode, ScenarioOption } from '../data/scenarioData';

// ===============================
// ドラッグ&ドロップ 犠牲システム
// ===============================
// ドラッグゴースト要素（モジュールスコープ）
let ghostEl: HTMLElement | null = null;

export function startDragSacrifice(
  container: HTMLElement,
  node: ScenarioNode,
  _optB: ScenarioOption,
  onComplete: (sacrificedName: string) => void
): void {
  const state = getGameState();
  const alive = state.personas.filter(p => p.isAlive);
  const dragStartTime = Date.now();
  let cancellations = 0;
  let firstTargetName: string | null = null;
  let isDragging = false;

  container.innerHTML = `
    <div class="scene scene-${node.stage}" id="drag-scene">
      <div class="bg-overlay"></div>
      <div class="drag-content">
        <div class="drag-title">——従者を選んで、捧げよ——</div>
        <p class="drag-hint">従者の駒を口の中にドラッグせよ</p>
        <div class="drag-servants" id="drag-servants">
          ${alive.map(p => {
            const vessel = SKILL_VESSELS.find(v => v.id === p.skillId);
            return `
              <div class="drag-servant-card stone-servant-card" id="dsc-${p.customName}" data-name="${p.customName}" draggable="true">
                <div class="dsc-symbol">${vessel?.symbol || '?'}</div>
                <div class="dsc-name">${p.customName}</div>
                <div class="dsc-skill">${vessel?.name || ''}</div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="drag-target-zone drag-mouth-zone" id="drag-target">
          <div class="drag-mouth-face">
            <div class="bocca-mouth bocca-open drag-bocca-mini">
              <div class="mouth-outer"><div class="mouth-inner drag-mouth-opening"><div class="tongue"></div></div></div>
              <div class="eye eye-left"></div>
              <div class="eye eye-right"></div>
            </div>
            <div class="drag-target-label">ここに落とす</div>
          </div>
        </div>
        <button class="btn-back" id="btn-drag-back">← 戻る（A選択へ）</button>
      </div>
    </div>
  `;

  const targetZone = document.getElementById('drag-target')!;

  // PointerEvents（マウス + タッチ共通）
  document.querySelectorAll('.drag-servant-card').forEach(card => {
    const el = card as HTMLElement;

    el.addEventListener('pointerdown', (e: PointerEvent) => {
      e.preventDefault();
      isDragging = true;
      // dragEl = el; // 未使用のため省略
      if (!firstTargetName) firstTargetName = el.getAttribute('data-name');

      // ゴースト要素作成
      ghostEl = el.cloneNode(true) as HTMLElement;
      ghostEl.classList.add('drag-ghost');
      ghostEl.style.cssText = `position:fixed;pointer-events:none;opacity:0.85;z-index:9999;width:80px;transform:rotate(5deg)scale(1.1);`;
      document.body.appendChild(ghostEl);
      moveGhost(e.clientX, e.clientY);

      el.classList.add('dragging');
      el.setPointerCapture(e.pointerId);
    });

    el.addEventListener('pointermove', (e: PointerEvent) => {
      if (!isDragging || !ghostEl) return;
      moveGhost(e.clientX, e.clientY);
      const overTarget = isOverTarget(e.clientX, e.clientY, targetZone);
      targetZone.classList.toggle('drag-over', overTarget);
    });

    el.addEventListener('pointerup', async (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      el.classList.remove('dragging');
      ghostEl?.remove();
      ghostEl = null;
      targetZone.classList.remove('drag-over');

      const overTarget = isOverTarget(e.clientX, e.clientY, targetZone);
      const name = el.getAttribute('data-name')!;

      if (overTarget) {
        // 確認モーダルを表示
        const confirmed = await showConfirmModal(name, container);
        if (confirmed) {
          // 確定
          if (!firstTargetName) firstTargetName = name;
          const switched = firstTargetName !== null && firstTargetName !== name;
          const timeToDecide = Date.now() - dragStartTime;
          recordDrag({
            eventId: node.id,
            cancellations,
            firstTargetName,
            finalTargetName: name,
            switched,
            timeToDecideMs: timeToDecide,
          });
          onComplete(name);
        } else {
          // キャンセル
          cancellations++;
          if (!firstTargetName) firstTargetName = name; // 最初に狙った相手として記録
          targetZone.querySelector('.drag-target-label')!.textContent = 'もう一度選んでください';
        }
      }
    });
  });

  document.getElementById('btn-drag-back')?.addEventListener('click', () => {
    // 戻るボタン → A選択へ（呼び出し元で対応）
    recordDrag({
      eventId: node.id,
      cancellations: cancellations + 1,
      firstTargetName,
      finalTargetName: null,
      switched: false,
      timeToDecideMs: Date.now() - dragStartTime,
    });
    // DragSacrificeをキャンセルして上位に戻す
    const event = new CustomEvent('drag-cancelled');
    container.dispatchEvent(event);
  });
}

function moveGhost(x: number, y: number): void {
  if (!ghostEl) return;
  ghostEl.style.left = `${x - 40}px`;
  ghostEl.style.top = `${y - 40}px`;
}

function isOverTarget(x: number, y: number, target: HTMLElement): boolean {
  const rect = target.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

async function showConfirmModal(name: string, _container: HTMLElement): Promise<boolean> {
  return new Promise(resolve => {
    const modal = document.createElement('div');
    modal.className = 'confirm-modal-overlay';
    modal.innerHTML = `
      <div class="confirm-modal">
        <div class="confirm-modal-icon">💀</div>
        <p class="confirm-modal-text">「${name}」を捧げますか？\nこの選択は取り消せません。</p>
        <div class="confirm-modal-btns">
          <button class="btn-confirm-yes" id="cm-yes">捧げる</button>
          <button class="btn-confirm-no" id="cm-no">やめる</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('cm-yes')?.addEventListener('click', () => { modal.remove(); resolve(true); });
    document.getElementById('cm-no')?.addEventListener('click', () => { modal.remove(); resolve(false); });
  });
}

// ===============================
// タイミングUI（E4 土砂崩れ）
// ===============================
export function startTimingRock(
  container: HTMLElement,
  node: ScenarioNode,
  optA: ScenarioOption,
  _optB: ScenarioOption,
  onCompleteA: (p1Name: string, p2Name: string) => void,
  onSwitchToB: () => void
): void {
  const state = getGameState();
  const alive = state.personas.filter(p => p.isAlive);
  let rockAnimId: number | null = null;
  let rockY = 0;
  let hitWindowOpen = false;
  let tapped = false;
  let selected: string[] = [];

  function render(): void {
    container.innerHTML = `
      <div class="scene scene-${node.stage}" id="timing-scene">
        <div class="bg-overlay"></div>
        <div class="drag-content">
          <div class="drag-title">——岩を弾き飛ばせ——</div>
          <p class="drag-hint">岩が緑のゾーンに入ったら「弾く！」を押せ</p>
          <div class="timing-arena" id="timing-arena">
            <div class="timing-hit-zone" id="timing-hit-zone">ここで弾く</div>
            <div class="timing-rock" id="timing-rock">🪨</div>
          </div>
          <button class="btn-tap" id="btn-tap">弾く！</button>
          <p class="timing-msg" id="timing-msg"></p>
          <div class="timing-servant-select" id="timing-servant-select" style="display:none">
            <p class="drag-hint">力を合わせる従者を2体選べ（${optA.hpCost ? `HP-${optA.hpCost}` : ''}）</p>
            <div class="drag-servants combine-mode" id="timing-servants">
              ${alive.map(p => {
                const vessel = SKILL_VESSELS.find(v => v.id === p.skillId);
                return `<div class="drag-servant-card" data-name="${p.customName}">
                  <div class="dsc-symbol">${vessel?.symbol || '?'}</div>
                  <div class="dsc-name">${p.customName}</div>
                  <div class="dsc-skill">${vessel?.name || ''}</div>
                </div>`;
              }).join('')}
            </div>
            <div class="combine-selected"><span id="timing-sel-count">0</span>/2 体選択中</div>
            <button class="btn-primary" id="btn-confirm-timing" disabled>この2体で突破する</button>
          </div>
          <button class="btn-secondary" id="btn-timing-b">B：従者を犠牲にする</button>
        </div>
      </div>
    `;
    startRockAnimation();

    document.getElementById('btn-tap')?.addEventListener('click', handleTap);
    document.getElementById('btn-timing-b')?.addEventListener('click', onSwitchToB);

    document.querySelectorAll('#timing-servants .drag-servant-card').forEach(card => {
      card.addEventListener('click', () => {
        const name = card.getAttribute('data-name')!;
        if (selected.includes(name)) {
          selected = selected.filter(n => n !== name);
          card.classList.remove('selected');
        } else if (selected.length < 2) {
          selected.push(name);
          card.classList.add('selected');
        }
        document.getElementById('timing-sel-count')!.textContent = String(selected.length);
        (document.getElementById('btn-confirm-timing') as HTMLButtonElement).disabled = selected.length !== 2;
      });
    });
    document.getElementById('btn-confirm-timing')?.addEventListener('click', () => {
      if (selected.length === 2) onCompleteA(selected[0], selected[1]);
    });
  }

  function startRockAnimation(): void {
    const arena = document.getElementById('timing-arena');
    const rock = document.getElementById('timing-rock');
    if (!arena || !rock) return;
    const arenaH = 260; // matches CSS .timing-arena { height: 260px }
    // CSS: .timing-hit-zone { bottom: 30px; height: 54px }
    const hitZoneTop = arenaH - 84; // 176px from top
    const hitZoneBot = arenaH - 30; // 230px from top
    rockY = -60; // start above arena
    tapped = false;
    hitWindowOpen = false;
    rock.style.top = '-60px';

    const speed = 2.2;
    function animate(): void {
      rockY += speed;
      if (rock) rock.style.top = `${rockY}px`;
      hitWindowOpen = rockY >= hitZoneTop && rockY <= hitZoneBot;
      if (rock) rock.classList.toggle('rock-in-zone', hitWindowOpen);

      if (rockY > arenaH + 40) {
        // 岩を逃した
        if (!tapped) onMiss();
        return;
      }
      if (!tapped) rockAnimId = requestAnimationFrame(animate);
    }
    rockAnimId = requestAnimationFrame(animate);
  }

  function handleTap(): void {
    if (tapped) return;
    tapped = true;
    if (rockAnimId) cancelAnimationFrame(rockAnimId);
    const msg = document.getElementById('timing-msg');
    if (hitWindowOpen) {
      if (msg) msg.textContent = '✅ 成功！岩を弾き飛ばした！従者を2体選べ';
      if (msg) msg.classList.add('timing-success');
      document.getElementById('btn-tap')!.style.display = 'none';
      document.getElementById('timing-servant-select')!.style.display = 'block';
    } else {
      onMiss();
    }
  }

  function onMiss(): void {
    tapped = true;
    if (rockAnimId) cancelAnimationFrame(rockAnimId);
    const msg = document.getElementById('timing-msg');
    if (msg) { msg.textContent = '❌ タイミングが合わなかった…従者を犠牲にするか、もう一度試みるか'; msg.classList.add('timing-fail'); }
    const tapBtn = document.getElementById('btn-tap');
    if (tapBtn) { tapBtn.textContent = 'もう一度'; tapBtn.onclick = () => { selected = []; render(); }; }
  }

  render();
}

// ===============================
// スライダーUI（E6 厳しい検問）
// ===============================
export function startSliderForce(
  container: HTMLElement,
  node: ScenarioNode,
  _optA: ScenarioOption,
  _optB: ScenarioOption,
  onCompleteA: (p1Name: string, p2Name: string, sliderValue: number) => void,
  onSwitchToB: () => void
): void {
  const state = getGameState();
  const alive = state.personas.filter(p => p.isAlive);
  let selected: string[] = [];

  container.innerHTML = `
    <div class="scene scene-${node.stage}" id="slider-scene">
      <div class="bg-overlay"></div>
      <div class="drag-content">
        <div class="drag-title">——突破の力加減を決めよ——</div>
        <p class="drag-hint">適切な力でなければ突破できない</p>
        <div class="slider-section">
          <div class="slider-labels">
            <span class="slider-lab-lo">弱い</span>
            <span class="slider-lab-hi">強すぎる</span>
          </div>
          <input type="range" class="force-slider" id="force-slider" min="0" max="100" value="50">
          <div class="force-indicator" id="force-indicator">
            <div class="force-bar" id="force-bar" style="width:50%"></div>
          </div>
          <div class="force-label" id="force-label">⚖️ 均等な力（最適）</div>
        </div>
        <div class="timing-servant-select">
          <p class="drag-hint">力を合わせる従者を2体選べ</p>
          <div class="drag-servants combine-mode" id="slider-servants">
            ${alive.map(p => {
              const vessel = SKILL_VESSELS.find(v => v.id === p.skillId);
              return `<div class="drag-servant-card" data-name="${p.customName}">
                <div class="dsc-symbol">${vessel?.symbol || '?'}</div>
                <div class="dsc-name">${p.customName}</div>
                <div class="dsc-skill">${vessel?.name || ''}</div>
              </div>`;
            }).join('')}
          </div>
          <div class="combine-selected"><span id="slider-sel-count">0</span>/2 体選択中</div>
          <button class="btn-primary" id="btn-confirm-slider" disabled>決行する</button>
        </div>
        <button class="btn-secondary" id="btn-slider-b">B：従者を犠牲にする</button>
      </div>
    </div>
  `;

  const slider = document.getElementById('force-slider') as HTMLInputElement;
  const bar = document.getElementById('force-bar')!;
  const label = document.getElementById('force-label')!;

  function updateSliderUI(): void {
    const v = Number(slider.value);
    bar.style.width = `${v}%`;
    if (v < 33) {
      bar.style.background = '#4a90d9';
      label.textContent = '🌊 慎重な力——静かに、確実に';
    } else if (v < 67) {
      bar.style.background = '#50c878';
      label.textContent = '⚖️ 均等な力（最適）';
    } else {
      bar.style.background = '#e05c5c';
      label.textContent = '💥 過剰な力——乱戦は避けられない';
    }
  }
  slider.addEventListener('input', updateSliderUI);

  document.querySelectorAll('#slider-servants .drag-servant-card').forEach(card => {
    card.addEventListener('click', () => {
      const name = card.getAttribute('data-name')!;
      if (selected.includes(name)) {
        selected = selected.filter(n => n !== name);
        card.classList.remove('selected');
      } else if (selected.length < 2) {
        selected.push(name);
        card.classList.add('selected');
      }
      document.getElementById('slider-sel-count')!.textContent = String(selected.length);
      (document.getElementById('btn-confirm-slider') as HTMLButtonElement).disabled = selected.length !== 2;
    });
  });

  document.getElementById('btn-confirm-slider')?.addEventListener('click', () => {
    if (selected.length === 2) onCompleteA(selected[0], selected[1], Number(slider.value));
  });
  document.getElementById('btn-slider-b')?.addEventListener('click', onSwitchToB);
}

// ===============================
// ホールドUI（E9 崩れゆく回廊）
// ===============================
export function startHoldDouble(
  container: HTMLElement,
  node: ScenarioNode,
  _optA: ScenarioOption,
  _optB: ScenarioOption,
  onCompleteA: (p1Name: string, p2Name: string) => void,
  onSwitchToB: () => void
): void {
  const state = getGameState();
  const alive = state.personas.filter(p => p.isAlive);
  const p1 = alive[0];
  const p2 = alive[1];
  const v1 = p1 ? SKILL_VESSELS.find(v => v.id === p1.skillId) : null;
  const v2 = p2 ? SKILL_VESSELS.find(v => v.id === p2.skillId) : null;

  container.innerHTML = `
    <div class="scene scene-${node.stage}" id="hold-scene">
      <div class="bg-overlay"></div>
      <div class="drag-content">
        <div class="drag-title">——全員で支えろ——</div>
        <p class="drag-hint">両方のボタンを同時に2秒押さえ続けろ</p>
        <div class="hold-servants">
          <button class="hold-btn" id="hold-btn-0" data-idx="0">
            <div>${v1?.symbol || '?'}</div>
            <div>${p1?.customName || '？'}</div>
          </button>
          ${p2 ? `<button class="hold-btn" id="hold-btn-1" data-idx="1">
            <div>${v2?.symbol || '?'}</div>
            <div>${p2?.customName || '？'}</div>
          </button>` : ''}
        </div>
        <div class="hold-progress-bg"><div class="hold-progress-fill" id="hold-progress" style="width:0%"></div></div>
        <p class="hold-msg" id="hold-msg">両手で同時に押さえ続けてください</p>
        <button class="btn-secondary" id="btn-hold-b">B：従者を犠牲にする</button>
      </div>
    </div>
  `;

  const HOLD_DURATION = 2000;
  let held = [false, false];
  let holdStart = 0;
  let rafId: number | null = null;

  function startProgress(): void {
    holdStart = Date.now();
    const fill = document.getElementById('hold-progress')!;
    const msg = document.getElementById('hold-msg')!;
    msg.textContent = '離すな！';
    function tick(): void {
      const elapsed = Date.now() - holdStart;
      const pct = Math.min(100, (elapsed / HOLD_DURATION) * 100);
      fill.style.width = `${pct}%`;
      if (pct >= 100) {
        onSuccess();
      } else if (held[0] && (p2 ? held[1] : true)) {
        rafId = requestAnimationFrame(tick);
      } else {
        fill.style.width = '0%';
        msg.textContent = '失敗！もう一度同時に押さえてください';
      }
    }
    rafId = requestAnimationFrame(tick);
  }

  function stopProgress(): void {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  function checkBoth(): void {
    const bothHeld = held[0] && (p2 ? held[1] : true);
    if (bothHeld) startProgress();
    else stopProgress();
  }

  function onSuccess(): void {
    stopProgress();
    document.getElementById('hold-msg')!.textContent = '✅ 支えきった！脱出成功！';
    document.querySelectorAll('.hold-btn').forEach(b => (b as HTMLButtonElement).disabled = true);
    setTimeout(() => onCompleteA(p1?.customName || '', p2?.customName || ''), 600);
  }

  [0, 1].forEach(idx => {
    const btn = document.getElementById(`hold-btn-${idx}`);
    if (!btn) return;
    btn.addEventListener('pointerdown', e => { e.preventDefault(); (btn as HTMLButtonElement).setPointerCapture((e as PointerEvent).pointerId); held[idx] = true; checkBoth(); });
    btn.addEventListener('pointerup', () => { held[idx] = false; checkBoth(); });
    btn.addEventListener('pointercancel', () => { held[idx] = false; checkBoth(); });
  });

  document.getElementById('btn-hold-b')?.addEventListener('click', onSwitchToB);
}

// ===============================
// ドラッグ&ドロップ 組み合わせシステム（A選択）
// ===============================
export function startDragCombine(
  container: HTMLElement,
  node: ScenarioNode,
  optA: ScenarioOption,
  onComplete: (p1Name: string, p2Name: string) => void,
  onSwitchToB: () => void
): void {
  const state = getGameState();
  const alive = state.personas.filter(p => p.isAlive);
  let selected: string[] = [];

  container.innerHTML = `
    <div class="scene scene-${node.stage}" id="combine-scene">
      <div class="bg-overlay"></div>
      <div class="drag-content">
        <div class="drag-title">——従者を2体選んで突破せよ——</div>
        <p class="drag-hint">
          ${optA.hpCost ? `❤️ HP-${optA.hpCost}　` : ''}
          ${optA.foodCost ? `🍞 食料-${optA.foodCost}　` : ''}
          ⚠️ 残りの従者1体にデバフ（${optA.debuffType}）
        </p>
        <div class="drag-servants combine-mode" id="combine-servants">
          ${alive.map(p => {
            const vessel = SKILL_VESSELS.find(v => v.id === p.skillId);
            return `
              <div class="drag-servant-card" id="csc-${p.customName}" data-name="${p.customName}">
                <div class="dsc-symbol">${vessel?.symbol || '?'}</div>
                <div class="dsc-name">${p.customName}</div>
                <div class="dsc-skill">${vessel?.name || ''}</div>
                ${p.debuffs.length > 0 ? `<div class="dsc-debuff">${p.debuffs.join(' ')}</div>` : ''}
              </div>
            `;
          }).join('')}
        </div>
        <div class="combine-selected" id="combine-selected">
          <span id="sel-count">0</span>/2 体選択中
        </div>
        <button class="btn-primary" id="btn-confirm-combine" disabled>この2体で突破する</button>
        <button class="btn-secondary" id="btn-switch-b">B：従者を犠牲にする</button>
      </div>
    </div>
  `;

  document.querySelectorAll('.drag-servant-card').forEach(card => {
    card.addEventListener('click', () => {
      const name = card.getAttribute('data-name')!;
      if (selected.includes(name)) {
        selected = selected.filter(n => n !== name);
        card.classList.remove('selected');
      } else if (selected.length < 2) {
        selected.push(name);
        card.classList.add('selected');
      }
      document.getElementById('sel-count')!.textContent = String(selected.length);
      (document.getElementById('btn-confirm-combine') as HTMLButtonElement).disabled = selected.length !== 2;
    });
  });

  document.getElementById('btn-confirm-combine')?.addEventListener('click', () => {
    if (selected.length === 2) onComplete(selected[0], selected[1]);
  });

  document.getElementById('btn-switch-b')?.addEventListener('click', onSwitchToB);
}
