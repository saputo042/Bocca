// Bucca 診断シーン（Big Five 24問クイズ）

import { navigateTo, setServants, setBigFive, sleep, typewriter } from '../utils/gameState';
import { QUESTIONS, calculateScores } from '../data/bigfive';
import { selectServants } from '../data/tarot';

const LABELS = [
  { value: 1, text: 'まったくそう思わない' },
  { value: 2, text: 'そう思わない' },
  { value: 3, text: 'どちらでもない' },
  { value: 4, text: 'そう思う' },
  { value: 5, text: 'とてもそう思う' },
];

export function renderDiagnosisScene(container: HTMLElement): void {
  const isDebug = location.search.includes('debug=1') || location.hash.includes('debug');

  container.innerHTML = `
    <div class="scene scene-diagnosis" id="scene-diagnosis">
      <div class="bg-overlay"></div>
      <div class="diagnosis-wrapper">
        <div class="diagnosis-header">
          <h2 class="diagnosis-title">性格診断</h2>
          <div class="diagnosis-progress-bar">
            <div class="diagnosis-progress-fill" id="diag-progress-fill" style="width:0%"></div>
          </div>
          <div class="diagnosis-progress-text" id="diag-progress-text">1 / 24</div>
        </div>
        ${isDebug ? `
          <div class="debug-quick-btns">
            <button class="debug-btn" id="btn-debug-random">ランダム回答</button>
            <button class="debug-btn" id="btn-debug-all3">全問3で回答</button>
          </div>
        ` : ''}
        <div class="diagnosis-card" id="diag-card">
          <p class="diagnosis-question" id="diag-question"></p>
          <div class="diagnosis-answers" id="diag-answers"></div>
        </div>
      </div>
    </div>
  `;

  const answers: number[] = [];
  let currentIndex = 0;
  let transitioning = false;

  if (isDebug) {
    document.getElementById('btn-debug-random')?.addEventListener('click', () => {
      const randomAnswers = QUESTIONS.map(() => Math.floor(Math.random() * 5) + 1);
      finishDiagnosis(randomAnswers);
    });
    document.getElementById('btn-debug-all3')?.addEventListener('click', () => {
      const allThree = QUESTIONS.map(() => 3);
      finishDiagnosis(allThree);
    });
  }

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

  async function finishDiagnosis(finalAnswers: number[]): Promise<void> {
    const card = document.getElementById('diag-card')!;
    const progressFill = document.getElementById('diag-progress-fill')!;
    const progressText = document.getElementById('diag-progress-text')!;

    progressFill.style.width = '100%';
    progressText.textContent = '24 / 24';

    card.innerHTML = '<div class="diagnosis-analyzing"><p class="analyzing-text" id="analyzing-text"></p></div>';
    const analyzingText = document.getElementById('analyzing-text')!;

    await typewriter(analyzingText, '解析中...', 80);
    await sleep(400);
    await typewriter(analyzingText, '解析中......あなたの性格パターンを読み取っています', 40);
    await sleep(600);
    await typewriter(analyzingText, '従者の選定が始まる', 60);
    await sleep(800);

    const scores = calculateScores(finalAnswers);
    setBigFive(scores);

    const servants = selectServants(scores);
    setServants(servants);

    navigateTo('servantReveal');
  }

  renderQuestion(0);
}
