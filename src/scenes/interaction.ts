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
        <p class="drag-hint">従者カードをドラッグして、供物台に落としてください</p>
        <div class="drag-servants" id="drag-servants">
          ${alive.map(p => {
            const vessel = SKILL_VESSELS.find(v => v.id === p.skillId);
            return `
              <div class="drag-servant-card" id="dsc-${p.customName}" data-name="${p.customName}" draggable="true">
                <div class="dsc-symbol">${vessel?.symbol || '?'}</div>
                <div class="dsc-name">${p.customName}</div>
                <div class="dsc-skill">${vessel?.name || ''}</div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="drag-target-zone" id="drag-target">
          <div class="drag-target-inner">
            <div class="drag-target-icon">💀</div>
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
