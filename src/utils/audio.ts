// BOCCA 雰囲気音システム（Web Audio API）

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
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

// ドローン音生成（雰囲気音のベース）
function createDroneSound(frequency: number, type: OscillatorType = 'sine'): OscillatorNode {
  const ctx = initAudio();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filterNode = ctx.createBiquadFilter();

  oscillator.type = type;
  oscillator.frequency.value = frequency;

  filterNode.type = 'lowpass';
  filterNode.frequency.value = 800;

  gainNode.gain.value = 0.05;

  oscillator.connect(filterNode);
  filterNode.connect(gainNode);
  gainNode.connect(masterGain!);

  return oscillator;
}

// シーン別の雰囲気音
export type AmbienceTheme = 'title' | 'ruins' | 'mountain' | 'city' | 'space';

export function playAmbienceForScene(theme: AmbienceTheme): void {
  stopAllAudio();

  try {
    const ctx = initAudio();

    switch (theme) {
      case 'title':
      case 'ruins':
        // 古代遺跡：低いドローン＋不規則なハーモニクス
        playRuinsAmbience(ctx);
        break;
      case 'mountain':
        // 山：風の音のような高周波ノイズ＋緊張感
        playMountainAmbience(ctx);
        break;
      case 'city':
        // 都会：パルス音＋不安定な音景
        playCityAmbience(ctx);
        break;
      case 'space':
        // 宇宙：深い静寂＋遠いシンセ
        playSpaceAmbience(ctx);
        break;
    }
  } catch (e) {
    // AudioContextが使えない環境では無音
    console.warn('雰囲気音の再生に失敗しました:', e);
  }
}

function playRuinsAmbience(ctx: AudioContext): void {
  // 基音: 55Hz（低いA）
  const base = createDroneSound(55, 'sine');
  // 倍音: 110Hz
  const harmonic1 = createDroneSound(110, 'sine');
  // 少しデチューン: 82.5Hz（不協和）
  const harmonic2 = createDroneSound(82.5, 'triangle');

  droneNodes = [base, harmonic1, harmonic2];
  droneNodes.forEach(node => node.start());

  // ゆっくりとしたLFOで揺らぎを加える
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.1;
  lfoGain.gain.value = 5;
  lfo.connect(lfoGain);
  lfoGain.connect(base.frequency);
  lfo.start();
  droneNodes.push(lfo);
}

function playMountainAmbience(ctx: AudioContext): void {
  // 緊張感のある高音
  const base1 = createDroneSound(146.83, 'sawtooth'); // D3
  const base2 = createDroneSound(155.56, 'sine'); // Eb3（不協和）

  // ノイズ的な風の音
  const bufferSize = ctx.sampleRate * 2;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const whiteNoise = ctx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;
  whiteNoise.loop = true;

  const filterNode = ctx.createBiquadFilter();
  filterNode.type = 'bandpass';
  filterNode.frequency.value = 400;
  filterNode.Q.value = 0.5;

  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.02;

  whiteNoise.connect(filterNode);
  filterNode.connect(noiseGain);
  noiseGain.connect(masterGain!);
  whiteNoise.start();

  droneNodes = [base1, base2];
  droneNodes.forEach(node => node.start());
}

function playCityAmbience(_ctx: AudioContext): void {
  // パルス音（都市の脈動）
  const pulse = createDroneSound(80, 'square');
  const high = createDroneSound(320, 'sine');

  // ランダムなクリック音で不安感を演出
  function scheduleClick() {
    if (!audioContext) return;
    const clickTime = audioContext.currentTime + Math.random() * 3 + 0.5;
    const clickOsc = audioContext.createOscillator();
    const clickGain = audioContext.createGain();
    clickOsc.frequency.value = Math.random() * 1000 + 500;
    clickGain.gain.setValueAtTime(0.1, clickTime);
    clickGain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.05);
    clickOsc.connect(clickGain);
    clickGain.connect(masterGain!);
    clickOsc.start(clickTime);
    clickOsc.stop(clickTime + 0.1);

    setTimeout(scheduleClick, Math.random() * 2000 + 500);
  }

  droneNodes = [pulse, high];
  droneNodes.forEach(node => node.start());
  scheduleClick();
}

function playSpaceAmbience(ctx: AudioContext): void {
  // 深い宇宙の音：非常に低いドローン
  const deep1 = createDroneSound(27.5, 'sine'); // A0
  const deep2 = createDroneSound(41.2, 'sine'); // E1
  const shimmer = createDroneSound(880, 'sine'); // 高いA

  const shimmerGain = ctx.createGain();
  shimmerGain.gain.value = 0.01;
  shimmer.connect(shimmerGain);
  shimmerGain.connect(masterGain!);

  droneNodes = [deep1, deep2, shimmer];
  droneNodes.forEach(node => node.start());
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
  droneNodes.forEach(node => {
    try { node.stop(); } catch (e) { /* 既に停止済み */ }
  });
  droneNodes = [];

  if (currentAmbience) {
    try { currentAmbience.stop(); } catch (e) { /* 既に停止済み */ }
    currentAmbience = null;
  }
}

export function setVolume(volume: number): void {
  if (masterGain) {
    masterGain.gain.value = Math.max(0, Math.min(1, volume));
  }
}
