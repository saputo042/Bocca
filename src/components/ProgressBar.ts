// BOCCA — コンポーネント: ProgressBar（数字なし・ビジュアルプログレス）

export interface ProgressStep {
  eventId: number;
  stage: 'forest' | 'city' | 'ruins';
  isCompleted: boolean;
  isCurrent: boolean;
  isEmotion: boolean; // 感情選択ターン
}

export function buildProgressBar(steps: ProgressStep[]): string {
  const stageIcons: Record<string, string> = {
    forest: '🌲',
    city: '🌆',
    ruins: '👁️',
  };

  const stepDots = steps.map((step) => {
    const cls = step.isCurrent ? 'progress-dot current'
      : step.isCompleted ? 'progress-dot completed'
      : 'progress-dot upcoming';
    const emotionCls = step.isEmotion ? ' emotion-dot' : '';
    return `<span class="${cls}${emotionCls}" title="${stageIcons[step.stage]}"></span>`;
  }).join('');

  // ステージラベルの位置計算
  const forestEnd = steps.filter(s => s.stage === 'forest').length;
  const cityEnd = forestEnd + steps.filter(s => s.stage === 'city').length;
  const total = steps.length;

  const forestPct = (forestEnd / total) * 100;
  const cityPct = (cityEnd / total) * 100;

  return `
    <div class="progress-bar-container" id="progress-bar">
      <div class="progress-stage-labels">
        <span class="progress-stage-label" style="left:${forestPct/2}%">🌲 森</span>
        <span class="progress-stage-label" style="left:${(forestPct + cityPct)/2}%">🌆 都市</span>
        <span class="progress-stage-label" style="left:${(cityPct + 100)/2}%">👁️ 遺跡</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width:${getCompletedPct(steps)}%"></div>
        <div class="progress-dots">${stepDots}</div>
      </div>
      <div class="progress-bocca-icon">👁️</div>
    </div>
  `;
}

function getCompletedPct(steps: ProgressStep[]): number {
  const completed = steps.filter(s => s.isCompleted).length;
  return (completed / steps.length) * 100;
}

/** 現在のゲーム状態からProgressStepを構築 */
export function buildProgressSteps(
  currentStep: number,
  totalSteps: number,
  showEmotion: boolean[]
): ProgressStep[] {
  const stages: ('forest' | 'city' | 'ruins')[] = [];
  for (let i = 0; i < totalSteps; i++) {
    stages.push(i < 4 ? 'forest' : i < 8 ? 'city' : 'ruins');
  }

  const steps: ProgressStep[] = [];
  for (let i = 0; i < totalSteps; i++) {
    // メインイベント
    steps.push({
      eventId: i,
      stage: stages[i],
      isCompleted: i < currentStep,
      isCurrent: i === currentStep,
      isEmotion: false,
    });
    // 感情選択ターン（showEmotionがtrueの場合）
    if (showEmotion[i]) {
      steps.push({
        eventId: i,
        stage: stages[i],
        isCompleted: i < currentStep,
        isCurrent: false,
        isEmotion: true,
      });
    }
  }
  return steps;
}
