// BOCCA 雰囲気音システム（Web Audio API）

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let bgmAudio: HTMLAudioElement | null = null;
let currentAmbience: AudioBufferSourceNode | null = null;
let droneNodes: OscillatorNode[] = [];

// AudioContextの初期化（ユーザーインタラクション後に呼ぶ）
function initAudio(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.3;
    masterGain.connect(audioContext.destination);
  }
  return audioContext;
}

// シーン別の雰囲気音
export type AmbienceTheme = 'title' | 'ruins' | 'mountain' | 'city' | 'space';

export function playAmbienceForScene(_theme: AmbienceTheme): void {
  // 以前のプロシージャル音源を停止
  stopAllAudio();

  // 提供されたMP3を背景BGMとしてループ再生
  if (!bgmAudio) {
    bgmAudio = new Audio('/assets/music/呪いの継承.mp3');
    bgmAudio.loop = true;
    bgmAudio.volume = 0.5; // 必要に応じて音量を調整
  }

  // 再生されていない場合のみ再生開始（ブラウザの自動再生ブロックに備えてcatch）
  if (bgmAudio.paused) {
    bgmAudio.play().catch(e => {
      console.warn('BGMの自動再生がブラウザにブロックされました（ユーザー操作後に再生されます）:', e);
    });
  }
}



// ボタンクリック音
export function playSFX(type: 'select' | 'sacrifice' | 'reveal'): void {
  try {
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    switch (type) {
      case 'select':
        osc.frequency.value = 440;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
        break;
      case 'sacrifice':
        // ベースの重低音（下降するサイン波）
        // オシレーターとゲインをローカルに再定義して独立させる
        {
          const suckOsc = ctx.createOscillator();
          const suckGain = ctx.createGain();
          
          suckOsc.type = 'sine';
          suckOsc.frequency.setValueAtTime(150, ctx.currentTime);
          suckOsc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.6);
          suckGain.gain.setValueAtTime(0.5, ctx.currentTime);
          suckGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
          
          suckOsc.connect(suckGain);
          suckGain.connect(masterGain!);
          suckOsc.start();
          suckOsc.stop(ctx.currentTime + 0.8);

          // 咀嚼/捕食のノイズ音（ガチャッ/ドスン）
          const noiseBufferSize = ctx.sampleRate * 1.0;
          const noiseBuffer = ctx.createBuffer(1, noiseBufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < noiseBufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
          }
          const noiseNode = ctx.createBufferSource();
          const noiseFilter = ctx.createBiquadFilter();
          const noiseGain = ctx.createGain();
          
          noiseNode.buffer = noiseBuffer;
          noiseFilter.type = 'lowpass';
          noiseFilter.frequency.value = 300; // 低い音だけ残す
          
          noiseGain.gain.setValueAtTime(0.001, ctx.currentTime);
          noiseGain.gain.setValueAtTime(0.8, ctx.currentTime + 0.8); // カードが吸い込まれた瞬間に最大
          noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
          
          noiseNode.connect(noiseFilter);
          noiseFilter.connect(noiseGain);
          noiseGain.connect(masterGain!);
          noiseNode.start(ctx.currentTime + 0.5);
          noiseNode.stop(ctx.currentTime + 1.5);
        }
        break;
      case 'reveal':
        osc.frequency.value = 528;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
        osc.start();
        osc.stop(ctx.currentTime + 2);
        break;
    }

    osc.connect(gain);
    gain.connect(masterGain!);
  } catch (e) {
    // 無音
  }
}

export function stopAllAudio(): void {
  // プロシージャル音源の停止
  droneNodes.forEach(node => {
    try { node.stop(); } catch (e) { /* 既に停止済み */ }
  });
  droneNodes = [];

  if (currentAmbience) {
    try { currentAmbience.stop(); } catch (e) { /* 既に停止済み */ }
    currentAmbience = null;
  }
  
  // MP3のBGMを停止（もし必要なら）
  // if (bgmAudio) {
  //   bgmAudio.pause();
  //   bgmAudio.currentTime = 0;
  // }
}

export function setVolume(volume: number): void {
  const safeVolume = Math.max(0, Math.min(1, volume));
  if (masterGain) {
    masterGain.gain.value = safeVolume;
  }
  if (bgmAudio) {
    bgmAudio.volume = safeVolume;
  }
}
