// BOCCA — コンポーネント: EmotionPicker（行動後感情選択UI）

import { EMOTION_CHOICES } from '../data/scenarioData';
import { recordEmotion, sleep } from '../utils/gameState';

export function renderEmotionPicker(
  _container: HTMLElement,
  eventId: number,
  eventTitle: string,
  actionTaken: string,
  emotionPrompt: string,
  onComplete: () => void
): void {
  const choicesHTML = EMOTION_CHOICES.map(c => `
    <button class="emotion-btn" id="emotion-${c.id}" data-id="${c.id}">
      <span class="emotion-btn-label">${c.label}</span>
      <span class="emotion-btn-sub">${c.subLabel}</span>
    </button>
  `).join('');

  // コンテナに感情選択UIを追加（オーバーレイとして）
  const overlay = document.createElement('div');
  overlay.className = 'emotion-overlay';
  overlay.id = 'emotion-overlay';
  overlay.innerHTML = `
    <div class="emotion-panel">
      <div class="emotion-eyeicon">👁️</div>
      <p class="emotion-prompt">${emotionPrompt}</p>
      <div class="emotion-note">正直に選んでください。これはあなたの感情を診断します。</div>
      <div class="emotion-choices">
        ${choicesHTML}
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // フェードイン
  requestAnimationFrame(() => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.4s ease';
    requestAnimationFrame(() => { overlay.style.opacity = '1'; });
  });

  EMOTION_CHOICES.forEach(c => {
    document.getElementById(`emotion-${c.id}`)?.addEventListener('click', async () => {
      // 選択ハイライト
      document.querySelectorAll('.emotion-btn').forEach(b => b.classList.remove('selected'));
      document.getElementById(`emotion-${c.id}`)?.classList.add('selected');

      await sleep(400);

      // ログ記録
      recordEmotion({
        eventId,
        eventTitle,
        actionTaken,
        emotionChoice: c.id,
        diagDelta: c.diagDelta,
      });

      // フェードアウトして次へ
      overlay.style.opacity = '0';
      await sleep(400);
      overlay.remove();
      onComplete();
    });
  });
}
