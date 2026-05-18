// Bucca メインエントリーポイント

import './styles/main.css';
import { setSceneChangeCallback, getCurrentScene, type Scene } from './utils/gameState';
import { renderTitleScene } from './scenes/title';
import { renderDiagnosisScene } from './scenes/diagnosis';
import { renderServantRevealScene } from './scenes/servantReveal';
import { renderStageScene } from './scenes/stage';
import { renderFinaleScene } from './scenes/finale';
import { initDebugPanel } from './debug/panel';

// メインコンテナ
const app = document.getElementById('app')!;

// シーンレンダラーマップ
const sceneRenderers: Record<Scene, (container: HTMLElement) => void> = {
  title: renderTitleScene,
  diagnosis: renderDiagnosisScene,
  servantReveal: renderServantRevealScene,
  stage: renderStageScene,
  finale: renderFinaleScene,
};

// シーン切り替えハンドラ
function handleSceneChange(scene: Scene): void {
  app.style.opacity = '0';
  app.style.transition = 'opacity 0.5s ease';

  setTimeout(() => {
    app.innerHTML = '';
    const renderer = sceneRenderers[scene];
    if (renderer) {
      renderer(app);
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        app.style.opacity = '1';
      });
    });
  }, 500);
}

// シーン切り替えコールバックを登録
setSceneChangeCallback(handleSceneChange);

// デバッグパネル初期化
initDebugPanel();

// 初期シーンをレンダリング
const initialScene = getCurrentScene();
const initialRenderer = sceneRenderers[initialScene];
if (initialRenderer) {
  initialRenderer(app);
}
