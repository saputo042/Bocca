// ST-03, ST-04, ST-08 選択ミニゲーム

export interface MushroomResult {
  choice: 'a' | 'b' | 'none';
  revealed: boolean;
}

export function runMushroomSelection(
  container: HTMLElement,
  timeoutSec: number,
  revealCallback?: (onReveal: () => void) => void
): Promise<MushroomResult> {
  return new Promise(resolve => {
    let revealed = false;
    let choiceMade = false;
    let seconds = timeoutSec;

    container.innerHTML = `
      <div class="minigame-overlay">
        <div class="selection-timer-ring" id="sel-timer">
          <span id="sel-countdown">${timeoutSec}</span>
        </div>
        <div class="selection-mushroom-grid">
          <button class="choice-btn choice-btn-large" id="sel-a">
            <span class="choice-icon">&#x1F344;</span>
            <span class="choice-label">A を食べる</span>
            <small class="choice-desc">赤紫・毒々しい見た目</small>
          </button>
          <button class="choice-btn choice-btn-large" id="sel-b">
            <span class="choice-icon">&#x1F344;</span>
            <span class="choice-label">B を食べる</span>
            <small class="choice-desc">普通の見た目・SNS噂</small>
          </button>
          <button class="choice-btn choice-btn-neutral" id="sel-none">
            食べない
          </button>
        </div>
        <div class="servant-hint-text" id="sel-hint" style="display:none"></div>
      </div>
    `;

    if (revealCallback) {
      revealCallback(() => {
        if (revealed) return;
        revealed = true;
        const hintEl = document.getElementById('sel-hint');
        if (hintEl) {
          hintEl.style.display = 'block';
          hintEl.textContent = '透視の結果: Aは安全。Bは毒だ。';
          hintEl.style.color = '#C9A227';
        }
      });
    }

    const countdownId = setInterval(() => {
      seconds--;
      const el = document.getElementById('sel-countdown');
      if (el) el.textContent = String(seconds);
      if (seconds <= 0) {
        clearInterval(countdownId);
        if (!choiceMade) finish('none');
      }
    }, 1000);

    function finish(choice: 'a' | 'b' | 'none'): void {
      choiceMade = true;
      clearInterval(countdownId);
      resolve({ choice, revealed });
    }

    document.getElementById('sel-a')?.addEventListener('click', () => { if (!choiceMade) finish('a'); });
    document.getElementById('sel-b')?.addEventListener('click', () => { if (!choiceMade) finish('b'); });
    document.getElementById('sel-none')?.addEventListener('click', () => { if (!choiceMade) finish('none'); });
  });
}

export type OrphanChoice = 'talk' | 'money' | 'guide' | 'ignore';

export function runOrphanSelection(
  container: HTMLElement,
  timeoutSec: number
): Promise<OrphanChoice> {
  return new Promise(resolve => {
    let seconds = timeoutSec;
    let choiceMade = false;

    container.innerHTML = `
      <div class="minigame-overlay">
        <div class="selection-timer-ring" id="sel-timer">
          <span id="sel-countdown">${timeoutSec}</span>
        </div>
        <p class="selection-prompt">子どもが近づいてくる——どうする？</p>
        <div class="choice-grid-2x2">
          <button class="choice-btn" id="sel-talk">話しかける</button>
          <button class="choice-btn" id="sel-money">お金を渡す</button>
          <button class="choice-btn" id="sel-guide">案内してもらう</button>
          <button class="choice-btn sel-danger" id="sel-ignore">無視する</button>
        </div>
      </div>
    `;

    const countdownId = setInterval(() => {
      seconds--;
      const el = document.getElementById('sel-countdown');
      if (el) el.textContent = String(seconds);
      if (seconds <= 0) {
        clearInterval(countdownId);
        if (!choiceMade) finish('ignore');
      }
    }, 1000);

    function finish(choice: OrphanChoice): void {
      choiceMade = true;
      clearInterval(countdownId);
      resolve(choice);
    }

    document.getElementById('sel-talk')?.addEventListener('click', () => { if (!choiceMade) finish('talk'); });
    document.getElementById('sel-money')?.addEventListener('click', () => { if (!choiceMade) finish('money'); });
    document.getElementById('sel-guide')?.addEventListener('click', () => { if (!choiceMade) finish('guide'); });
    document.getElementById('sel-ignore')?.addEventListener('click', () => { if (!choiceMade) finish('ignore'); });
  });
}

export type TrolleyPath = 'left' | 'center' | 'right';

export interface TrolleyForkResult {
  choices: TrolleyPath[];
  totalDamage: number;
  betrayalAccepted: boolean;
}

export function runTrolleySelection(
  container: HTMLElement,
  advisorName: string,
  revealAll: boolean
): Promise<TrolleyForkResult> {
  return new Promise(resolve => {
    // Fork 1: correct=left, advice=left (correct)
    // Fork 2: correct=right, advice=left (betrayal)
    // Fork 3: correct=left, advice=left (correct again)
    const correctPaths: TrolleyPath[] = ['left', 'right', 'left'];
    const servantAdvice: TrolleyPath[] = ['left', 'left', 'left'];

    const choices: TrolleyPath[] = [];
    let totalDamage = 0;
    let currentFork = 0;
    let betrayalAccepted = false;

    function renderFork(): void {
      const advice = revealAll ? correctPaths[currentFork] : servantAdvice[currentFork];
      const adviceLabel = advice === 'left' ? '左' : advice === 'right' ? '右' : '中央';
      const correctLabel = correctPaths[currentFork] === 'left' ? '左' : correctPaths[currentFork] === 'right' ? '右' : '中央';

      container.innerHTML = `
        <div class="minigame-overlay">
          <p class="trolley-fork-label">第${currentFork + 1}分岐</p>
          <p class="servant-hint-text">
            ${revealAll
              ? `<span style="color:#C9A227">正解は「${correctLabel}」だ</span>`
              : `従者 <strong>${advisorName}</strong>：「${adviceLabel}へ行け」`
            }
          </p>
          <div class="trolley-path-btns">
            <button class="choice-btn" id="troll-left">← 左</button>
            <button class="choice-btn" id="troll-center">↑ 中央</button>
            <button class="choice-btn" id="troll-right">右 →</button>
          </div>
          <div class="trolley-betrayal-overlay" id="betray-overlay" style="display:none">
            <p id="betray-text" style="color:#ef4444"></p>
          </div>
        </div>
      `;

      document.getElementById('troll-left')?.addEventListener('click', () => handleChoice('left'));
      document.getElementById('troll-center')?.addEventListener('click', () => handleChoice('center'));
      document.getElementById('troll-right')?.addEventListener('click', () => handleChoice('right'));
    }

    async function handleChoice(path: TrolleyPath): Promise<void> {
      // Disable all buttons
      ['troll-left', 'troll-center', 'troll-right'].forEach(id => {
        const btn = document.getElementById(id) as HTMLButtonElement | null;
        if (btn) btn.disabled = true;
      });

      choices.push(path);
      const correct = correctPaths[currentFork];
      const isCorrect = revealAll || path === correct;

      // Fork 2 betrayal event
      if (currentFork === 1 && !revealAll && path === 'left') {
        betrayalAccepted = true;
        const overlay = document.getElementById('betray-overlay')!;
        overlay.style.display = 'block';
        const textEl = document.getElementById('betray-text')!;
        textEl.textContent = '従者が……嘘をついた。トロッコが崖に向かっている！';
        totalDamage += 20;

        await new Promise<void>(r => setTimeout(r, 2000));

        // Show servant pleading
        overlay.innerHTML = `
          <p style="color:#C9A227;font-style:italic">
            「……信じてくれ。次は必ず正しい道を示す。」<br>
            <small style="color:#a89a7a">従者が懇願している</small>
          </p>
        `;
        await new Promise<void>(r => setTimeout(r, 1500));
      } else if (!isCorrect) {
        totalDamage += 10;
      }

      currentFork++;
      if (currentFork >= 3) {
        resolve({ choices, totalDamage, betrayalAccepted });
      } else {
        await new Promise<void>(r => setTimeout(r, 500));
        renderFork();
      }
    }

    renderFork();
  });
}
