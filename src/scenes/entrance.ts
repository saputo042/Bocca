// BOCCA 入場シーン — 質問形式で従者を決定し命名する

import { SKILL_VESSELS } from '../data/personas';
import type { CustomPersona } from '../data/personas';
import { QUESTIONS } from '../data/questions';
import type { Question, QuestionOption } from '../data/questions';
import {
  navigateTo,
  setPersonas,
  addMBTIPoints,
  typewriter,
  createParticles,
  sleep,
} from '../utils/gameState';
import { playSFX } from '../utils/audio';

const REQUIRED_SELECT = 8; // 決定する器の数

// ===============================
// エントリポイント
// ===============================

export function renderEntranceScene(container: HTMLElement): void {
  // 各質問で選んだ選択肢を記録
  const answers: QuestionOption[] = [];
  let currentQ = 0;

  renderQuestionPhase();

  // ====== 質問フェーズ ======
  function renderQuestionPhase(): void {
    container.innerHTML = `
      <div class="scene scene-entrance" id="scene-entrance">
        <div class="particles-container" id="entrance-particles"></div>
        <div class="bg-overlay"></div>
        <div class="quiz-container">

          <!-- 進行バー -->
          <div class="quiz-progress-bar">
            <div class="quiz-progress-fill" id="quiz-progress-fill"
                 style="width:${(currentQ / QUESTIONS.length) * 100}%"></div>
          </div>
          <div class="quiz-progress-label" id="quiz-progress-label">
            ${currentQ + 1} / ${QUESTIONS.length}
          </div>

          <!-- 質問カード -->
          <div class="quiz-card-wrapper" id="quiz-card-wrapper">
            ${buildQuestionCard(QUESTIONS[currentQ])}
          </div>

        </div>
      </div>
    `;

    createParticles(document.getElementById('entrance-particles')!, 20);
    bindOptionButtons();
  }

  // ====== 質問カードHTML ======
  function buildQuestionCard(q: Question): string {
    return `
      <div class="quiz-card" id="quiz-card">
        <div class="quiz-q-label">Question ${q.id}</div>
        <div class="quiz-q-text" id="quiz-q-text">${q.text.replace(/\n/g, '<br>')}</div>
        ${q.subText ? `<div class="quiz-q-sub">${q.subText}</div>` : ''}
        <div class="quiz-options" id="quiz-options">
          ${q.options.map((opt, i) => `
            <button class="quiz-option-btn" data-opt-id="${opt.id}" id="qopt-${i}">
              <span class="quiz-option-label">${opt.label}</span>
              ${opt.subLabel ? `<span class="quiz-option-sub">${opt.subLabel}</span>` : ''}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ====== 選択肢ボタンのイベント設定 ======
  function bindOptionButtons(): void {
    document.querySelectorAll('.quiz-option-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const optId = btn.getAttribute('data-opt-id')!;
        const q = QUESTIONS[currentQ];
        const opt = q.options.find(o => o.id === optId)!;

        // 選択エフェクト
        btn.classList.add('quiz-option-selected');
        playSFX('select');
        await sleep(300);

        answers.push(opt);
        currentQ++;

        if (currentQ < QUESTIONS.length) {
          await transitionToNextQuestion();
        } else {
          await transitionToAnalysis();
        }
      });
    });
  }

  // ====== 次の質問へのアニメーション遷移 ======
  async function transitionToNextQuestion(): Promise<void> {
    const wrapper = document.getElementById('quiz-card-wrapper');
    if (!wrapper) return;

    // フェードアウト
    wrapper.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
    wrapper.style.opacity = '0';
    wrapper.style.transform = 'translateX(-30px)';
    await sleep(350);

    // プログレスバー更新
    const fill = document.getElementById('quiz-progress-fill');
    const label = document.getElementById('quiz-progress-label');
    if (fill) fill.style.width = `${(currentQ / QUESTIONS.length) * 100}%`;
    if (label) label.textContent = `${currentQ + 1} / ${QUESTIONS.length}`;

    // 新しいカードを差し込む
    wrapper.style.opacity = '0';
    wrapper.style.transform = 'translateX(30px)';
    wrapper.innerHTML = buildQuestionCard(QUESTIONS[currentQ]);

    // フェードイン
    await sleep(50);
    wrapper.style.opacity = '1';
    wrapper.style.transform = 'translateX(0)';

    bindOptionButtons();
  }

  // ====== 解析演出 ======
  async function transitionToAnalysis(): Promise<void> {
    container.innerHTML = `
      <div class="scene scene-entrance" id="scene-entrance">
        <div class="bg-overlay"></div>
        <div class="analysis-container">
          <div class="analysis-bocca">
            <div class="bocca-mouth">
              <div class="mouth-outer">
                <div class="mouth-inner"><div class="tongue"></div></div>
              </div>
              <div class="eye eye-left"></div>
              <div class="eye eye-right"></div>
            </div>
          </div>
          <p class="analysis-text" id="analysis-text"></p>
        </div>
      </div>
    `;

    const el = document.getElementById('analysis-text');
    if (el) {
      await sleep(400);
      await typewriter(el, '……魂の構造を、解析している', 50);
      await sleep(600);
      await typewriter(el, '……魂の構造を、解析している\nお前の中に眠る器が、浮かび上がってくる', 40);
      await sleep(800);
    }

    // 集計して器を決定
    const selectedIds = computeVessels(answers);
    await renderRevealPhase(selectedIds);
  }

  // ====== 集計ロジック ======
  function computeVessels(opts: QuestionOption[]): string[] {
    // 全器のスコアを合計
    const scores: Record<string, number> = {};
    for (const v of SKILL_VESSELS) scores[v.id] = 0;

    for (const opt of opts) {
      for (const [id, score] of Object.entries(opt.vesselScores)) {
        if (id in scores) scores[id] += score ?? 0;
      }
    }

    // スコア降順ソート → 上位8つ
    const sorted = Object.entries(scores)
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        return Math.random() - 0.5; // 同点はランダム
      });

    return sorted.slice(0, REQUIRED_SELECT).map(([id]) => id);
  }

  // ====== 器の出現演出 ======
  async function renderRevealPhase(selectedIds: string[]): Promise<void> {
    container.innerHTML = `
      <div class="scene scene-entrance" id="scene-entrance">
        <div class="particles-container" id="entrance-particles"></div>
        <div class="bg-overlay"></div>
        <div class="entrance-content">
          <div class="scene-header">
            <div class="scene-label">魂の器 · 選定完了</div>
            <h2 class="scene-title">あなたに宿る8つの器</h2>
            <p class="scene-desc">これがお前の内側に眠っていたものだ。\n迷宮はやがて、これらを削り取ろうとするだろう。</p>
          </div>
          <div class="vessels-reveal-grid" id="vessels-reveal-grid">
            ${selectedIds.map((id, i) => {
              const v = SKILL_VESSELS.find(v => v.id === id)!;
              return `
                <div class="vessel-reveal-card" data-idx="${i}" style="opacity:0;transform:translateY(24px)">
                  <div class="vessel-card-inner">
                    <div class="vessel-attr">${v.attributeEmoji}</div>
                    <div class="vessel-symbol">${v.symbol}</div>
                    <div class="vessel-name">${v.name}</div>
                    <div class="vessel-desc">${v.description}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          <div class="entrance-footer" id="reveal-footer" style="opacity:0">
            <button class="btn-primary btn-proceed" id="btn-to-naming">
              <span class="btn-icon">⚑</span>
              <span>従者に名を与えよ</span>
            </button>
          </div>
        </div>
      </div>
    `;

    createParticles(document.getElementById('entrance-particles')!, 25);

    // 1枚ずつカードを出現させる
    const cards = document.querySelectorAll<HTMLElement>('.vessel-reveal-card');
    for (let i = 0; i < cards.length; i++) {
      await sleep(160);
      const card = cards[i];
      card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }

    await sleep(400);
    const footer = document.getElementById('reveal-footer');
    if (footer) {
      footer.style.transition = 'opacity 0.6s ease';
      footer.style.opacity = '1';
    }

    document.getElementById('btn-to-naming')?.addEventListener('click', () => {
      renderNamingPhase(selectedIds);
    });
  }

  // ====== 命名フェーズ ======
  function renderNamingPhase(selectedIds: string[]): void {
    container.innerHTML = `
      <div class="scene scene-entrance" id="scene-entrance">
        <div class="particles-container" id="entrance-particles"></div>
        <div class="bg-overlay"></div>
        <div class="entrance-content">
          <div class="scene-header">
            <div class="scene-label">第一の扉 · 命名の儀</div>
            <h2 class="scene-title">従者に名を与えよ</h2>
            <p class="scene-desc">大切な人、信念、価値観——失いたくないもの、あるいは失ってきたもの。<br>それをそのまま、従者の名として刻め。</p>
          </div>
          <div class="naming-grid" id="naming-grid">
            ${selectedIds.map((id, i) => {
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
            }).join('')}
          </div>
          <div class="entrance-footer">
            <button class="btn-primary btn-proceed" id="btn-proceed">
              <span class="btn-icon">⚑</span>
              <span id="btn-label">従者を連れて、迷宮へ進む</span>
            </button>
          </div>
        </div>
      </div>
    `;

    createParticles(document.getElementById('entrance-particles')!, 30);

    // 入力バリデーション
    document.querySelectorAll('.naming-input').forEach(input => {
      input.addEventListener('input', checkAllNamed);
    });
    checkAllNamed();

    document.getElementById('btn-proceed')?.addEventListener('click', () => {
      confirmNaming(selectedIds);
    });
  }

  function checkAllNamed(): void {
    const inputs = document.querySelectorAll<HTMLInputElement>('.naming-input');
    const allFilled = Array.from(inputs).every(i => i.value.trim().length > 0);
    const btn = document.getElementById('btn-proceed') as HTMLButtonElement;
    if (btn) btn.disabled = !allFilled;
  }

  function confirmNaming(_selectedIds: string[]): void {
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
      // 器の typingHints を MBTI 初期値に反映
      addMBTIPoints(vessel.typingHints);
    });

    // 質問回答分の MBTI ポイントを反映
    for (const opt of answers) {
      addMBTIPoints(opt.mbtiDelta);
    }

    setPersonas(personas);
    playSFX('select');
    navigateTo('maze');
  }
}
