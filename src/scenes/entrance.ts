// BOCCA 入場シーン（ペルソナ選択）

import { PERSONAS } from '../data/personas';
import {
  navigateTo,
  setSelectedPersonas,
  typewriter,
  createParticles,
  sleep,
} from '../utils/gameState';
import { playSFX } from '../utils/audio';

const MIN_SELECT = 3;
const MAX_SELECT = 5;

export function renderEntranceScene(container: HTMLElement): void {
  const selectedIds = new Set<string>();

  container.innerHTML = `
    <div class="scene scene-entrance" id="scene-entrance">
      <div class="particles-container" id="entrance-particles"></div>
      <div class="bg-overlay"></div>
      <div class="entrance-content">
        <div class="scene-header">
          <div class="scene-label">第一の門 · 遺跡</div>
          <h2 class="scene-title" id="entrance-title"></h2>
          <p class="scene-desc" id="entrance-desc"></p>
        </div>

        <div class="selection-info">
          <span id="select-count">0</span> / ${MAX_SELECT} 体を選択中
          <span class="select-hint">（最低${MIN_SELECT}体）</span>
        </div>

        <div class="personas-grid" id="personas-grid">
          ${PERSONAS.map(p => `
            <div class="persona-card" data-id="${p.id}" id="card-${p.id}">
              <div class="persona-card-inner">
                <div class="persona-symbol">${p.symbol}</div>
                <div class="persona-name">${p.name}</div>
                <div class="persona-subtitle">${p.subtitle}</div>
                <div class="persona-desc">${p.description}</div>
                <div class="persona-aspects">
                  <div class="aspect positive">
                    <span class="aspect-label">光</span>
                    <span>${p.positive}</span>
                  </div>
                  <div class="aspect negative">
                    <span class="aspect-label">影</span>
                    <span>${p.negative}</span>
                  </div>
                </div>
                <div class="persona-select-overlay">
                  <span class="check-icon">✓</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="entrance-footer">
          <p class="footer-text">あなたの中に潜む魂を選んでください。<br>これらはあなたの一部——かつて生きていたのかもしれない。</p>
          <button class="btn-primary btn-proceed" id="btn-proceed" disabled>
            <span class="btn-icon">⚑</span>
            迷宮へ進む
          </button>
        </div>
      </div>
    </div>
  `;

  // パーティクル
  createParticles(document.getElementById('entrance-particles')!, 30);

  // テキストアニメーション
  runEntranceAnimation();

  // カード選択ロジック
  document.querySelectorAll('.persona-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-id')!;

      if (selectedIds.has(id)) {
        // 選択解除
        selectedIds.delete(id);
        card.classList.remove('selected');
        playSFX('select');
      } else if (selectedIds.size < MAX_SELECT) {
        // 選択追加
        selectedIds.add(id);
        card.classList.add('selected');
        playSFX('select');
      } else {
        // 最大数に達している場合は震えアニメーション
        card.classList.add('shake');
        setTimeout(() => card.classList.remove('shake'), 400);
      }

      // カウント更新
      const countEl = document.getElementById('select-count');
      if (countEl) countEl.textContent = String(selectedIds.size);

      // ボタン状態更新
      const proceedBtn = document.getElementById('btn-proceed') as HTMLButtonElement;
      if (proceedBtn) {
        proceedBtn.disabled = selectedIds.size < MIN_SELECT;
      }
    });
  });

  // 進むボタン
  document.getElementById('btn-proceed')?.addEventListener('click', () => {
    if (selectedIds.size >= MIN_SELECT) {
      setSelectedPersonas([...selectedIds]);
      navigateTo('maze');
    }
  });
}

async function runEntranceAnimation(): Promise<void> {
  await sleep(300);

  const title = document.getElementById('entrance-title');
  if (title) {
    await typewriter(title, '魂の駒を選べ', 80);
  }

  await sleep(400);

  const desc = document.getElementById('entrance-desc');
  if (desc) {
    desc.style.opacity = '0';
    desc.style.transition = 'opacity 0.8s';
    desc.textContent = 'これから迷宮に入る。あなたは複数の魂を携えて進む。\nしかし迷宮は、あなたに選択を迫る——誰を差し出すかを。';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        desc.style.opacity = '1';
      });
    });
  }

  await sleep(500);

  // カードを順番にフェードイン
  const cards = document.querySelectorAll('.persona-card');
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i] as HTMLElement;
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.4s, transform 0.4s';

    setTimeout(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, i * 60);
  }
}
