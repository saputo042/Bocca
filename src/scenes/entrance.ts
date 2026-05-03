// BOCCA — 入場シーン v2（5問クイズ / 6体従者）

import { SKILL_VESSELS } from '../data/personas';
import type { CustomPersona } from '../data/personas';
import { QUESTIONS } from '../data/questions';
import type { QuestionOption } from '../data/questions';
import {
  navigateTo,
  setPersonas,
  addDiagScores,
  typewriter,
  createParticles,
  sleep,
} from '../utils/gameState';
import { playSFX } from '../utils/audio';

const REQUIRED_SELECT = 6; // 6体従者に変更

export function renderEntranceScene(container: HTMLElement): void {
  const answers: QuestionOption[] = [];
  let currentQ = 0;

  renderQuestionPhase();

  function renderQuestionPhase(): void {
    container.innerHTML = `
      <div class="scene scene-entrance" id="scene-entrance">
        <div class="particles-container" id="entrance-particles"></div>
        <div class="bg-overlay"></div>
        <div class="quiz-container">
          <div class="quiz-progress-bar">
            <div class="quiz-progress-fill" id="quiz-progress-fill" style="width:${(currentQ/QUESTIONS.length)*100}%"></div>
          </div>
          <div class="quiz-progress-label" id="quiz-progress-label">${currentQ+1} / ${QUESTIONS.length}</div>
          <div class="quiz-card-wrapper" id="quiz-card-wrapper">
            ${buildQuestionCard(currentQ)}
          </div>
        </div>
      </div>
    `;
    createParticles(document.getElementById('entrance-particles')!, 20);
    bindOptionButtons();
  }

  function buildQuestionCard(idx: number): string {
    const q = QUESTIONS[idx];
    return `
      <div class="quiz-card" id="quiz-card">
        <div class="quiz-q-label">Question ${q.id} / ${QUESTIONS.length}</div>
        <div class="quiz-q-text">${q.text.replace(/\n/g, '<br>')}</div>
        ${q.subText ? `<div class="quiz-q-sub">${q.subText}</div>` : ''}
        <div class="quiz-options">
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

  function bindOptionButtons(): void {
    document.querySelectorAll('.quiz-option-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const optId = btn.getAttribute('data-opt-id')!;
        const q = QUESTIONS[currentQ];
        const opt = q.options.find(o => o.id === optId)!;
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

  async function transitionToNextQuestion(): Promise<void> {
    const wrapper = document.getElementById('quiz-card-wrapper');
    if (!wrapper) return;
    wrapper.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
    wrapper.style.opacity = '0';
    wrapper.style.transform = 'translateX(-30px)';
    await sleep(350);
    const fill = document.getElementById('quiz-progress-fill');
    const label = document.getElementById('quiz-progress-label');
    if (fill) fill.style.width = `${(currentQ/QUESTIONS.length)*100}%`;
    if (label) label.textContent = `${currentQ+1} / ${QUESTIONS.length}`;
    wrapper.style.opacity = '0';
    wrapper.style.transform = 'translateX(30px)';
    wrapper.innerHTML = buildQuestionCard(currentQ);
    await sleep(50);
    wrapper.style.opacity = '1';
    wrapper.style.transform = 'translateX(0)';
    bindOptionButtons();
  }

  async function transitionToAnalysis(): Promise<void> {
    container.innerHTML = `
      <div class="scene scene-entrance">
        <div class="bg-overlay"></div>
        <div class="analysis-container">
          <div class="analysis-bocca">
            <div class="bocca-mouth">
              <div class="mouth-outer"><div class="mouth-inner"><div class="tongue"></div></div></div>
              <div class="eye eye-left"></div><div class="eye eye-right"></div>
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
    const selectedIds = computeVessels(answers);
    await renderRevealPhase(selectedIds);
  }

  function computeVessels(opts: QuestionOption[]): string[] {
    const scores: Record<string, number> = {};
    for (const v of SKILL_VESSELS) scores[v.id] = 0;
    for (const opt of opts) {
      for (const [id, score] of Object.entries(opt.vesselScores)) {
        if (id in scores) scores[id] += score ?? 0;
      }
    }
    return Object.entries(scores)
      .sort((a, b) => b[1] !== a[1] ? b[1] - a[1] : Math.random() - 0.5)
      .slice(0, REQUIRED_SELECT)
      .map(([id]) => id);
  }

  async function renderRevealPhase(selectedIds: string[]): Promise<void> {
    container.innerHTML = `
      <div class="scene scene-entrance">
        <div class="particles-container" id="entrance-particles"></div>
        <div class="bg-overlay"></div>
        <div class="entrance-content">
          <div class="scene-header">
            <div class="scene-label">魂の器 · 選定完了</div>
            <h2 class="scene-title">あなたに宿る6つの器</h2>
            <p class="scene-desc">これがお前の内側に眠っていたものだ。\n迷宮はやがて、これらを削り取ろうとするだろう。</p>
          </div>
          <div class="vessels-reveal-grid" id="vessels-reveal-grid">
            ${selectedIds.map((id, _i) => {
              const v = SKILL_VESSELS.find(v => v.id === id)!;
              return `
                <div class="vessel-reveal-card" style="opacity:0;transform:translateY(24px)">
                  <div class="vessel-card-inner">
                    <div class="vessel-attr">${v.attributeEmoji}</div>
                    <div class="vessel-symbol">${v.symbol}</div>
                    <div class="vessel-name">${v.name}</div>
                    <div class="vessel-desc">${v.description}</div>
                    <div class="vessel-skill">⚔️ ${v.battleSkill.name}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          <div class="entrance-footer" id="reveal-footer" style="opacity:0">
            <button class="btn-primary btn-proceed" id="btn-to-naming">⚑ 従者に名を与えよ</button>
          </div>
        </div>
      </div>
    `;
    createParticles(document.getElementById('entrance-particles')!, 25);
    const cards = document.querySelectorAll<HTMLElement>('.vessel-reveal-card');
    for (let i = 0; i < cards.length; i++) {
      await sleep(160);
      cards[i].style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      cards[i].style.opacity = '1';
      cards[i].style.transform = 'translateY(0)';
    }
    await sleep(400);
    const footer = document.getElementById('reveal-footer');
    if (footer) { footer.style.transition = 'opacity 0.6s ease'; footer.style.opacity = '1'; }
    document.getElementById('btn-to-naming')?.addEventListener('click', () => renderNamingPhase(selectedIds));
  }

  function renderNamingPhase(selectedIds: string[]): void {
    container.innerHTML = `
      <div class="scene scene-entrance">
        <div class="particles-container" id="entrance-particles"></div>
        <div class="bg-overlay"></div>
        <div class="entrance-content">
          <div class="scene-header">
            <div class="scene-label">第一の扉 · 命名の儀</div>
            <h2 class="scene-title">従者に名を与えよ</h2>
            <p class="scene-desc">大切な人、信念、価値観——失いたくないもの、あるいは失ってきたもの。<br>それをそのまま、従者の名として刻め。</p>
          </div>
          <div class="naming-grid">
            ${selectedIds.map((id, i) => {
              const vessel = SKILL_VESSELS.find(v => v.id === id)!;
              return `
                <div class="naming-card">
                  <div class="naming-vessel-info">
                    <span class="naming-symbol">${vessel.symbol}</span>
                    <span class="naming-vessel-name">${vessel.name}</span>
                    <span class="naming-attr-badge">${vessel.attributeEmoji}</span>
                  </div>
                  <div class="naming-skill-hint">スキル: ${vessel.battleSkill.name} — ${vessel.battleSkill.description}</div>
                  <input type="text" class="naming-input" id="name-input-${i}"
                    placeholder="${vessel.defaultName}" value="${vessel.defaultName}"
                    maxlength="10" data-skill-id="${id}" />
                  <div class="naming-hint">この【${vessel.name}】の器に宿る、あなたの価値観とは？</div>
                </div>
              `;
            }).join('')}
          </div>
          <div class="entrance-footer">
            <button class="btn-primary btn-proceed" id="btn-proceed">⚑ 従者を連れて、迷宮へ進む</button>
          </div>
        </div>
      </div>
    `;
    createParticles(document.getElementById('entrance-particles')!, 30);
    document.querySelectorAll('.naming-input').forEach(i => i.addEventListener('input', checkAllNamed));
    checkAllNamed();
    document.getElementById('btn-proceed')?.addEventListener('click', () => confirmNaming(selectedIds));
  }

  function checkAllNamed(): void {
    const inputs = document.querySelectorAll<HTMLInputElement>('.naming-input');
    const allFilled = Array.from(inputs).every(i => i.value.trim().length > 0);
    (document.getElementById('btn-proceed') as HTMLButtonElement).disabled = !allFilled;
  }

  function confirmNaming(_selectedIds: string[]): void {
    const inputs = document.querySelectorAll<HTMLInputElement>('.naming-input');
    const personas: CustomPersona[] = [];
    inputs.forEach(input => {
      const skillId = input.getAttribute('data-skill-id')!;
      const customName = input.value.trim();
      const vessel = SKILL_VESSELS.find(v => v.id === skillId)!;
      personas.push({ skillId, customName, isAlive: true, debuffs: [] });
      addDiagScores(vessel.typingHints);
    });
    for (const opt of answers) addDiagScores(opt.diagDelta);
    setPersonas(personas);
    playSFX('select');
    navigateTo('maze');
  }
}
