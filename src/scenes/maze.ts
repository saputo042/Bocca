// BOCCA 迷宮シーン（追跡 → 収束）

import { getPersonaById } from '../data/personas';
import {
  navigateTo,
  getGameState,
  recordSacrifice,
  setLastStanding,
  typewriter,
  createParticles,
  sleep,
} from '../utils/gameState';
import { playAmbienceForScene, playSFX } from '../utils/audio';

// 各ターンの問い（段階的に苛烈になっていく）
const PROMPTS = [
  {
    phase: 'mountain',
    text: '迷宮の最初の分岐。暗い道が二手に分かれる。\n道を塞ぐ何かが問う——「誰かを置いていけ。でなければ全員が戻れなくなる。」',
    urgency: 1,
  },
  {
    phase: 'mountain',
    text: '深く進むほど、空気が重くなる。\n床が抜け落ちた先に、橋がある。橋は一人分の重さしか耐えられない。\n「誰を渡らせ、誰を残すか。」',
    urgency: 2,
  },
  {
    phase: 'city',
    text: '遺跡から都市へ。\n高層ビルの谷間で、何かがあなたを追い始めた。\n足を引っ張る存在を、手放さなければならない。「誰が、あなたの重荷か。」',
    urgency: 3,
  },
  {
    phase: 'city',
    text: 'もう後戻りはできない。\n前には一つの扉。扉の前に立つ者だけが通れる。\n残りはここに置いていく。「最後まで連れていくのは誰か。今、決めろ。」',
    urgency: 4,
  },
];

export function renderMazeScene(container: HTMLElement): void {
  const state = getGameState();
  let remainingPersonas = [...state.selectedPersonas];
  let currentTurn = 0;
  let turnStartTime = 0;

  // 初期シーン（山）から開始
  playAmbienceForScene('mountain');

  function renderTurn(): void {
    if (remainingPersonas.length <= 1) {
      // 最後の一体 → 終幕へ
      setLastStanding(remainingPersonas[0] || '');
      playAmbienceForScene('space');
      navigateTo('finale');
      return;
    }

    const promptData = PROMPTS[Math.min(currentTurn, PROMPTS.length - 1)];
    const urgency = promptData.urgency;
    const isCity = promptData.phase === 'city';

    if (currentTurn === 2) {
      // 都市シーンへ移行
      playAmbienceForScene('city');
    }

    turnStartTime = Date.now();

    container.innerHTML = `
      <div class="scene scene-maze ${isCity ? 'scene-city' : 'scene-mountain'}" id="scene-maze">
        <div class="particles-container" id="maze-particles"></div>
        <div class="bg-overlay urgency-${urgency}"></div>

        <div class="maze-hud">
          <div class="hud-phase">${isCity ? '第三の試練 · 都会' : '第二の試練 · 山'}</div>
          <div class="hud-remaining">残りの魂: ${remainingPersonas.length}</div>
          <div class="maze-progress">
            ${'●'.repeat(currentTurn)}${'○'.repeat(Math.max(0, PROMPTS.length - currentTurn))}
          </div>
        </div>

        <div class="maze-content">
          <div class="maze-prompt-container">
            <div class="maze-prompt-icon">⧖</div>
            <p class="maze-prompt" id="maze-prompt"></p>
          </div>

          <div class="maze-question">
            <h3 class="maze-qtext">誰を——差し出すか。</h3>
          </div>

          <div class="maze-personas" id="maze-personas">
            ${remainingPersonas.map(id => {
              const p = getPersonaById(id);
              if (!p) return '';
              return `
                <div class="maze-persona-card" data-id="${id}">
                  <div class="maze-persona-inner">
                    <div class="maze-symbol">${p.symbol}</div>
                    <div class="maze-name">${p.name}</div>
                    <div class="maze-subtitle">${p.subtitle}</div>
                    <div class="maze-persona-desc">${p.description}</div>
                    <button class="btn-sacrifice" data-id="${id}">
                      犠牲にする
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="tension-bar">
          <div class="tension-fill" style="width: ${(urgency / 4) * 100}%"></div>
        </div>

        <div class="maze-bocca-container" id="maze-bocca">
          <div class="bocca-mouth">
            <div class="mouth-outer">
              <div class="mouth-inner">
                <div class="tongue"></div>
              </div>
            </div>
            <div class="eye eye-left"></div>
            <div class="eye eye-right"></div>
          </div>
        </div>
      </div>
    `;

    createParticles(document.getElementById('maze-particles')!, 20);

    // プロンプトテキストをタイプライター表示
    const promptEl = document.getElementById('maze-prompt');
    if (promptEl) {
      sleep(200).then(() => typewriter(promptEl, promptData.text, 35));
    }

    // カードフェードイン
    const cards = document.querySelectorAll('.maze-persona-card');
    cards.forEach((card, i) => {
      const el = card as HTMLElement;
      el.style.opacity = '0';
      el.style.transform = 'scale(0.9)';
      el.style.transition = 'opacity 0.5s, transform 0.5s';
      setTimeout(() => {
        el.style.opacity = '1';
        el.style.transform = 'scale(1)';
      }, 300 + i * 100);
    });

    // 犠牲ボタンのイベント
    document.querySelectorAll('.btn-sacrifice').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sacrificedId = btn.getAttribute('data-id')!;
        handleSacrifice(sacrificedId);
      });
    });

    // カードクリックでも選択可能
    document.querySelectorAll('.maze-persona-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id')!;
        handleSacrifice(id);
      });
    });
  }

  function handleSacrifice(sacrificedId: string): void {
    const decisionTimeMs = Date.now() - turnStartTime;
    const promptData = PROMPTS[Math.min(currentTurn, PROMPTS.length - 1)];

    // 犠牲カードと口の要素を取得
    const sacrificedCard = document.querySelector(`.maze-persona-card[data-id="${sacrificedId}"]`) as HTMLElement;
    const boccaContainer = document.getElementById('maze-bocca');

    if (sacrificedCard && boccaContainer) {
      // 他のカードを薄くし、イベントを無効化
      document.querySelectorAll('.maze-persona-card').forEach(card => {
        const el = card as HTMLElement;
        el.style.pointerEvents = 'none';
        if (card.getAttribute('data-id') !== sacrificedId) {
          el.style.opacity = '0.3';
        }
      });

      // 真実の口を中央に出現させる
      boccaContainer.classList.add('active');

      // カードの現在座標を取得
      const rect = sacrificedCard.getBoundingClientRect();
      
      // absolute(fixed)にして元の位置に固定
      sacrificedCard.style.position = 'fixed';
      sacrificedCard.style.left = `${rect.left}px`;
      sacrificedCard.style.top = `${rect.top}px`;
      sacrificedCard.style.width = `${rect.width}px`;
      sacrificedCard.style.height = `${rect.height}px`;
      sacrificedCard.style.margin = '0';
      sacrificedCard.classList.add('being-sacrificed');

      // 画面中央（口の座標）への移動距離を計算
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const dx = centerX - (rect.left + rect.width / 2);
      const dy = centerY - (rect.top + rect.height / 2);

      // 吸い込み音を鳴らす
      playSFX('sacrifice');

      // 少し遅れてアニメーション実行（口が開いてから吸い込む）
      setTimeout(() => {
        sacrificedCard.style.transition = 'all 0.8s cubic-bezier(0.55, 0.085, 0.68, 0.53)';
        sacrificedCard.style.transform = `translate(${dx}px, ${dy}px) scale(0)`;
        sacrificedCard.style.opacity = '0';
        sacrificedCard.style.filter = 'brightness(2) contrast(1.5)';
      }, 150);

      // 吸い込み完了後、口を閉じて消す
      setTimeout(() => {
        boccaContainer.classList.remove('active');
      }, 950);
    }

    // 口が消え終わってから次のターンへ（1.5秒後）
    sleep(1500).then(() => {
      remainingPersonas = remainingPersonas.filter(id => id !== sacrificedId);

      recordSacrifice({
        turn: currentTurn,
        sacrificed: sacrificedId,
        remaining: [...remainingPersonas],
        prompt: promptData.text,
        decisionTimeMs,
      });

      currentTurn++;
      renderTurn();
    });
  }

  // 最初のターンをレンダリング
  renderTurn();
}
