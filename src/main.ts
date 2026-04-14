// BOCCA メインエントリーポイント

import './styles/main.css';
import { setSceneChangeCallback, getCurrentScene, type Scene } from './utils/gameState';
import { renderTitleScene } from './scenes/title';
import { renderEntranceScene } from './scenes/entrance';
import { renderMazeScene } from './scenes/maze';
import { renderFinaleScene } from './scenes/finale';

// メインコンテナ
const app = document.getElementById('app')!;

// シーンレンダラーマップ
const sceneRenderers: Record<Scene, (container: HTMLElement) => void> = {
  title: renderTitleScene,
  entrance: renderEntranceScene,
  maze: renderMazeScene,
  finale: renderFinaleScene,
};

// シーン切り替えハンドラ
function handleSceneChange(scene: Scene): void {
  // フェードアウト
  app.style.opacity = '0';
  app.style.transition = 'opacity 0.5s ease';

  setTimeout(() => {
    // コンテナをクリアして新シーンをレンダリング
    app.innerHTML = '';
    const renderer = sceneRenderers[scene];
    if (renderer) {
      renderer(app);
    }

    // フェードイン
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        app.style.opacity = '1';
      });
    });
  }, 500);
}

// シーン切り替えコールバックを登録
setSceneChangeCallback(handleSceneChange);

// 初期シーンをレンダリング
const initialScene = getCurrentScene();
const initialRenderer = sceneRenderers[initialScene];
if (initialRenderer) {
  initialRenderer(app);
}
