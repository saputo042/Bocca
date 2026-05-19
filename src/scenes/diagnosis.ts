// Bucca 診断シーン

import { navigateTo, initServantPool, acquireNextServant, setBigFive, sleep, typewriter } from '../utils/gameState';
import { QUESTIONS, calculateScores, type BigFiveScores } from '../data/bigfive';
import { selectServants } from '../data/tarot';

const LABELS = [
  { value: 1, text: 'まったくそう思わない' },
  { value: 2, text: 'そう思わない' },
  { value: 3, text: 'どちらでもない' },
  { value: 4, text: 'そう思う' },
  { value: 5, text: 'とてもそう思う' },
];

const DIMENSIONS: { key: keyof BigFiveScores; label: string; desc: string }[] = [
  { key: 'O', label: '開放性 (O)', desc: '好奇心・創造性・新規性' },
  { key: 'C', label: '誠実性 (C)', desc: '計画性・責任感・自己規律' },
  { key: 'E', label: '外向性 (E)', desc: '社交性・活動性・ポジティブ' },
  { key: 'A', label: '協調性 (A)', desc: '共感・親切心・他者への配慮' },
  { key: 'N', label: '神経症傾向 (N)', desc: '不安・敏感さ・感情的不安定' },
];

export function renderDiagnosisScene(container: HTMLElement): void {
  const isDebug = location.search.includes('debug=1') || location.hash.includes('debug');

  container.innerHTML = `
    <div class="scene scene-diagnosis" id="scene-diagnosis">
      <div class="bg-overlay"></div>
      <div class="diagnosis-wrapper" id="diag-wrapper">
        <div id="diag-content"></div>
      </div>
    </div>
  `;

  showModeSelect();

  // ──────────────────────────────
  // 選択画面: 診断 or 直接入力
  // ──────────────────────────────
  function showModeSelect(): void {
    const content = document.getElementById('diag-content')!;
    content.innerHTML = `
      <div class="diag-mode-select">
        <h2 class="diagnosis-title">審判の間</h2>
        <p class="diag-mode-subtitle">従者を召喚するために、あなたの性格を明かさなければならない。</p>

        <div class="diag-mode-cards">
          <button class="diag-mode-card" id="btn-mode-quiz">
            <span class="diag-mode-icon">&#x2753;</span>
            <span class="diag-mode-name">診断を受ける</span>
            <span class="diag-mode-desc">24問の設問に答えて<br>性格を測定する</span>
          </button>
          <button class="diag-mode-card" id="btn-mode-input">
            <span class="diag-mode-icon">&#x270F;</span>
            <span class="diag-mode-name">結果を入力する</span>
            <span class="diag-mode-desc">既にビッグファイブの<br>診断結果を持っている</span>
          </button>
        </div>

        ${isDebug ? `
          <div class="debug-quick-btns" style="margin-top:1.5rem">
            <button class="debug-btn" id="btn-debug-random">ランダム回答</button>
            <button class="debug-btn" id="btn-debug-all3">全問3で回答</button>
          </div>
        ` : ''}
      </div>
    `;

    document.getElementById('btn-mode-quiz')?.addEventListener('click', () => showQuiz());
    document.getElementById('btn-mode-input')?.addEventListener('click', () => showDirectInput());

    if (isDebug) {
      document.getElementById('btn-debug-random')?.addEventListener('click', () => {
        finishDiagnosis(QUESTIONS.map(() => Math.floor(Math.random() * 5) + 1));
      });
      document.getElementById('btn-debug-all3')?.addEventListener('click', () => {
        finishDiagnosis(QUESTIONS.map(() => 3));
      });
    }
  }

  // ──────────────────────────────
  // 直接入力モード
  // ──────────────────────────────
  function showDirectInput(): void {
    const content = document.getElementById('diag-content')!;
    content.innerHTML = `
      <div class="diag-input-screen">
        <h2 class="diagnosis-title">スコアを入力</h2>
        <p class="diag-input-subtitle">各次元のスコアを0〜100で入力してください。</p>

        <div class="diag-input-list" id="diag-input-list">
          ${DIMENSIONS.map(d => `
            <div class="diag-input-row">
              <div class="diag-input-labels">
                <span class="diag-input-dim">${d.label}</span>
                <span class="diag-input-dim-desc">${d.desc}</span>
              </div>
              <div class="diag-input-controls">
                <input
                  type="range" min="0" max="100" value="50" step="1"
                  class="diag-slider" id="slider-${d.key}"
                  oninput="document.getElementById('val-${d.key}').textContent=this.value"
                />
                <span class="diag-slider-val" id="val-${d.key}">50</span>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="diag-input-actions">
          <button class="btn-secondary" id="btn-back-mode">← 戻る</button>
          <button class="btn-primary" id="btn-confirm-input">この結果で召喚する</button>
        </div>
      </div>
    `;

    document.getElementById('btn-back-mode')?.addEventListener('click', () => showModeSelect());

    document.getElementById('btn-confirm-input')?.addEventListener('click', () => {
      const scores: BigFiveScores = { O: 0, C: 0, E: 0, A: 0, N: 0 };
      DIMENSIONS.forEach(d => {
        const slider = document.getElementById(`slider-${d.key}`) as HTMLInputElement | null;
        scores[d.key] = slider ? parseInt(slider.value, 10) / 100 : 0.5;
      });
      finishWithScores(scores);
    });
  }

  // ──────────────────────────────
  // 24問クイズモード
  // ──────────────────────────────
  function showQuiz(): void {
    const content = document.getElementById('diag-content')!;
    content.innerHTML = `
      <div class="diagnosis-header">
        <h2 class="diagnosis-title">性格診断</h2>
        <div class="diagnosis-progress-bar">
          <div class="diagnosis-progress-fill" id="diag-progress-fill" style="width:0%"></div>
        </div>
        <div class="diagnosis-progress-text" id="diag-progress-text">1 / 24</div>
      </div>
      <div class="diagnosis-card" id="diag-card">
        <p class="diagnosis-question" id="diag-question"></p>
        <div class="diagnosis-answers" id="diag-answers"></div>
      </div>
      <button class="btn-back-quiz" id="btn-back-quiz">← 戻る</button>
    `;

    document.getElementById('btn-back-quiz')?.addEventListener('click', () => showModeSelect());

    const answers: number[] = [];
    let currentIndex = 0;
    let transitioning = false;

    function renderQuestion(index: number): void {
      const q = QUESTIONS[index];
      const questionEl = document.getElementById('diag-question')!;
      const answersEl = document.getElementById('diag-answers')!;
      const progressFill = document.getElementById('diag-progress-fill')!;
      const progressText = document.getElementById('diag-progress-text')!;

      progressFill.style.width = `${(index / 24) * 100}%`;
      progressText.textContent = `${index + 1} / 24`;

      questionEl.textContent = '';
      answersEl.innerHTML = '';

      requestAnimationFrame(() => {
        typewriter(questionEl, `Q${String(q.id).padStart(2, '0')}. ${q.text}`, 30);
      });

      LABELS.forEach(label => {
        const btn = document.createElement('button');
        btn.className = 'diag-answer-btn';
        btn.dataset.value = String(label.value);
        btn.innerHTML = `<span class="diag-answer-num">${label.value}</span><span class="diag-answer-text">${label.text}</span>`;
        btn.addEventListener('click', () => {
          if (transitioning) return;
          transitioning = true;
          document.querySelectorAll('.diag-answer-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          answers[index] = label.value;
          setTimeout(() => {
            currentIndex++;
            transitioning = false;
            if (currentIndex >= 24) {
              finishDiagnosis(answers);
            } else {
              renderQuestion(currentIndex);
            }
          }, 300);
        });
        answersEl.appendChild(btn);
      });
    }

    renderQuestion(0);
  }

  // ──────────────────────────────
  // 完了処理
  // ──────────────────────────────
  async function finishDiagnosis(finalAnswers: number[]): Promise<void> {
    const scores = calculateScores(finalAnswers);
    await finishWithScores(scores);
  }

  async function finishWithScores(scores: BigFiveScores): Promise<void> {
    const content = document.getElementById('diag-content')!;

    const progressFill = document.getElementById('diag-progress-fill');
    if (progressFill) progressFill.style.width = '100%';

    content.innerHTML = `<div class="diagnosis-analyzing"><p class="analyzing-text" id="analyzing-text"></p></div>`;
    const analyzingText = document.getElementById('analyzing-text')!;

    await typewriter(analyzingText, '解析中...', 80);
    await sleep(400);
    await typewriter(analyzingText, '解析中......あなたの性格パターンを読み取っています', 40);
    await sleep(600);
    await typewriter(analyzingText, '従者の選定が始まる', 60);
    await sleep(800);

    setBigFive(scores);
    const pool = selectServants(scores);
    initServantPool(pool);
    acquireNextServant(); // 共鳴度1位を初期従者として取得
    navigateTo('servantReveal');
  }
}
