// BOCCA 入場シーン — 16の器から8つを選択し自由命名

import { SKILL_VESSELS } from '../data/personas';
import type { CustomPersona } from '../data/personas';
import {
  navigateTo,
  setPersonas,
  addMBTIPoints,
  typewriter,
  createParticles,
  sleep,
} from '../utils/gameState';
import { playSFX } from '../utils/audio';

const REQUIRED_SELECT = 8; // 選ぶ数

export function renderEntranceScene(container: HTMLElement): void {
  const selectedIds: string[] = []; // 選んだ器のID（順序つき）
  let namingPhase = false;           // 命名フェーズか否か

  container.innerHTML = `
    <div class="scene scene-entrance" id="scene-entrance">
      <div class="particles-container" id="entrance-particles"></div>
      <div class="bg-overlay"></div>
      <div class="entrance-content">

        <!-- ヘッダー -->
        <div class="scene-header">
          <div class="scene-label">第一の扉 · 魂の選択</div>
          <h2 class="scene-title" id="entrance-title"></h2>
          <p class="scene-desc" id="entrance-desc"></p>
        </div>

        <!-- 選択カウンター -->
        <div class="selection-info" id="select-info">
          <span id="select-count">0</span> / ${REQUIRED_SELECT} の器を選択中
          <span class="select-hint">（ちょうど${REQUIRED_SELECT}つ選ぶこと）</span>
        </div>

        <!-- 器グリッド（選択フェーズ） -->
        <div class="vessels-grid" id="vessels-grid">
          ${SKILL_VESSELS.map(v => `
            <div class="vessel-card" data-id="${v.id}" id="vcard-${v.id}">
              <div class="vessel-card-inner">
                <div class="vessel-attr">${v.attributeEmoji}</div>
                <div class="vessel-symbol">${v.symbol}</div>
                <div class="vessel-name">${v.name}</div>
                <div class="vessel-desc">${v.description}</div>
                <div class="vessel-select-overlay">
                  <span class="check-icon">✓</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- 命名フォームエリア（命名フェーズで表示） -->
        <div id="naming-phase" class="hidden">
          <div class="naming-header">
            <h3 class="naming-title">あなたが選んだ8つの器に、名前をつけよ</h3>
            <p class="naming-desc">大切な人、信念、価値観——失いたくないもの、あるいは失ってきたもの。<br>それをそのまま、従者の名として刻め。</p>
          </div>
          <div class="naming-grid" id="naming-grid"></div>
        </div>

        <!-- フッターボタン -->
        <div class="entrance-footer">
          <button class="btn-primary btn-proceed" id="btn-proceed" disabled>
            <span class="btn-icon">⚑</span>
            <span id="btn-label">命名フェーズへ進む</span>
          </button>
        </div>

      </div>
    </div>
  `;

  createParticles(document.getElementById('entrance-particles')!, 30);
  runEntranceAnimation();

  // ====== 器の選択ロジック ======
  document.querySelectorAll('.vessel-card').forEach(card => {
    card.addEventListener('click', () => {
      if (namingPhase) return;
      const id = card.getAttribute('data-id')!;
      const idx = selectedIds.indexOf(id);

      if (idx !== -1) {
        // 選択解除
        selectedIds.splice(idx, 1);
        card.classList.remove('selected');
        playSFX('select');
      } else if (selectedIds.length < REQUIRED_SELECT) {
        // 選択追加
        selectedIds.push(id);
        card.classList.add('selected');
        playSFX('select');
      } else {
        card.classList.add('shake');
        setTimeout(() => card.classList.remove('shake'), 400);
      }

      // カウント更新
      const el = document.getElementById('select-count');
      if (el) el.textContent = String(selectedIds.length);

      // ボタン制御
      const btn = document.getElementById('btn-proceed') as HTMLButtonElement;
      if (btn) btn.disabled = selectedIds.length !== REQUIRED_SELECT;
    });
  });

  // ====== 命名フェーズへ移行ボタン ======
  document.getElementById('btn-proceed')?.addEventListener('click', () => {
    if (!namingPhase) {
      if (selectedIds.length === REQUIRED_SELECT) switchToNamingPhase();
    } else {
      confirmNaming();
    }
  });

  function switchToNamingPhase(): void {
    namingPhase = true;

    // グリッドを非表示
    const grid = document.getElementById('vessels-grid');
    const info = document.getElementById('select-info');
    if (grid) grid.classList.add('hidden');
    if (info) info.classList.add('hidden');

    // タイトル更新
    const title = document.getElementById('entrance-title');
    if (title) title.textContent = '従者に名を与えよ';

    const desc = document.getElementById('entrance-desc');
    if (desc) desc.textContent = '';

    // 命名フォームを生成
    const namingPhaseEl = document.getElementById('naming-phase');
    const namingGrid = document.getElementById('naming-grid');
    if (namingPhaseEl) namingPhaseEl.classList.remove('hidden');
    if (namingGrid) {
      namingGrid.innerHTML = selectedIds.map((id, i) => {
        const vessel = SKILL_VESSELS.find(v => v.id === id)!;
        return `
          <div class="naming-card">
            <div class="naming-vessel-info">
              <span class="naming-symbol">${vessel.symbol}</span>
              <span class="naming-vessel-name">${vessel.name}</span>
              <span class="naming-attr-badge">${vessel.attributeEmoji}</span>
            </div>
            <input
              type="text"
              class="naming-input"
              id="name-input-${i}"
              placeholder="${vessel.defaultName}"
              value="${vessel.defaultName}"
              maxlength="10"
              data-skill-id="${id}"
            />
            <div class="naming-hint">この【${vessel.name}】の器に宿る、あなたの価値観とは？</div>
          </div>
        `;
      }).join('');
    }

    // ボタン更新
    const btn = document.getElementById('btn-proceed') as HTMLButtonElement;
    const btnLabel = document.getElementById('btn-label');
    if (btn) btn.disabled = false;
    if (btnLabel) btnLabel.textContent = '従者を連れて、迷宮へ進む';

    // 入力チェック（全員に名前が入っているかリアルタイム監視）
    document.querySelectorAll('.naming-input').forEach(input => {
      input.addEventListener('input', checkAllNamed);
    });
    checkAllNamed();
  }

  function checkAllNamed(): void {
    const inputs = document.querySelectorAll<HTMLInputElement>('.naming-input');
    const allFilled = Array.from(inputs).every(i => i.value.trim().length > 0);
    const btn = document.getElementById('btn-proceed') as HTMLButtonElement;
    if (btn) btn.disabled = !allFilled;
  }

  function confirmNaming(): void {
    const inputs = document.querySelectorAll<HTMLInputElement>('.naming-input');
    const personas: CustomPersona[] = [];

    inputs.forEach(input => {
      const skillId = input.getAttribute('data-skill-id')!;
      const customName = input.value.trim();
      const vessel = SKILL_VESSELS.find(v => v.id === skillId)!;
      personas.push({
        skillId,
        customName,
        isAlive: true,
        debuffs: [],
      });
      // 選択した器の種類をMBTI初期スコアへ反映
      addMBTIPoints(vessel.typingHints);
    });

    setPersonas(personas);
    playSFX('select');
    navigateTo('maze');
  }
}

async function runEntranceAnimation(): Promise<void> {
  await sleep(300);
  const title = document.getElementById('entrance-title');
  if (title) await typewriter(title, '16の器から8つを選べ', 70);
  await sleep(400);
  const desc = document.getElementById('entrance-desc');
  if (desc) {
    desc.style.opacity = '0';
    desc.style.transition = 'opacity 0.8s';
    desc.textContent = 'これらはお前の一部だ。失いたくないもの、大切にしてきたもの——\nその名を持つ魂を、8体選んで携えよ。\n迷宮はやがて、お前にそれを捨てるよう迫るだろう。';
    requestAnimationFrame(() => requestAnimationFrame(() => { desc.style.opacity = '1'; }));
  }
  await sleep(500);
  const cards = document.querySelectorAll('.vessel-card');
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i] as HTMLElement;
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.4s, transform 0.4s';
    setTimeout(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, i * 40);
  }
}
