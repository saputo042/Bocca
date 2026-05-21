// BOCCA 音楽システム（BGM + SFX + ライトモチーフ連携）

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let bgmAudio: HTMLAudioElement | null = null;
let currentTrack: 'normal' | 'climax' | null = null;

const BGM_TRACKS = {
  normal: '/assets/music/Sound_Wave.mp3',  // ST-01〜07
  climax: '/assets/music/Party_Killer.mp3', // ST-08〜09
} as const;

// ── 初期化 ──────────────────────────────────────────────────

function initAudio(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.3;
    masterGain.connect(audioContext.destination);
  }
  return audioContext;
}

/** BGM の <audio> 要素を返す（rhythm.ts で拍計算に使用）*/
export function getBgmAudio(): HTMLAudioElement | null {
  return bgmAudio;
}

export function getAudioContext(): AudioContext | null {
  return audioContext;
}

export function getMasterGain(): GainNode | null {
  return masterGain;
}

// ── BGM制御 ──────────────────────────────────────────────────

export type AmbienceTheme = 'title' | 'ruins' | 'mountain' | 'city' | 'space';

/** シーンに合わせてBGMを開始（通常トラック）*/
export function playAmbienceForScene(_theme: AmbienceTheme): void {
  _ensureBGMTrack('normal');
}

/** BGMトラックを切り替える */
export function switchBGMTrack(track: 'normal' | 'climax'): void {
  if (currentTrack === track) return;
  _ensureBGMTrack(track);
}

function _ensureBGMTrack(track: 'normal' | 'climax'): void {
  const src = BGM_TRACKS[track];

  if (!bgmAudio) {
    bgmAudio = new Audio(src);
    bgmAudio.loop = true;
    bgmAudio.volume = 0.45;
    currentTrack = track;
  } else if (currentTrack !== track) {
    const wasPlaying = !bgmAudio.paused;
    bgmAudio.pause();
    bgmAudio.src = src;
    bgmAudio.load();
    currentTrack = track;
    if (wasPlaying) {
      bgmAudio.play().catch(() => {});
    }
  }

  // rhythm.ts へ BPM情報を渡す（遅延インポートで循環依存を避ける）
  import('./rhythm').then(({ initRhythm, TRACK_BPM, startBeatIndicator }) => {
    if (bgmAudio) {
      initRhythm(bgmAudio, TRACK_BPM[track]);
      startBeatIndicator();
    }
  });

  if (bgmAudio.paused) {
    bgmAudio.play().catch(e => {
      console.warn('BGM autoplay blocked:', e);
    });
  }
}

// ── SFX ──────────────────────────────────────────────────────

export function playSFX(type: 'select' | 'sacrifice' | 'reveal' | 'onbeat'): void {
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
        osc.connect(gain);
        gain.connect(masterGain!);
        break;

      case 'sacrifice': {
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

        const noiseBufferSize = ctx.sampleRate * 1.0;
        const noiseBuffer = ctx.createBuffer(1, noiseBufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBufferSize; i++) output[i] = Math.random() * 2 - 1;
        const noiseNode = ctx.createBufferSource();
        const noiseFilter = ctx.createBiquadFilter();
        const noiseGain = ctx.createGain();
        noiseNode.buffer = noiseBuffer;
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.value = 300;
        noiseGain.gain.setValueAtTime(0.001, ctx.currentTime);
        noiseGain.gain.setValueAtTime(0.8, ctx.currentTime + 0.8);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        noiseNode.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(masterGain!);
        noiseNode.start(ctx.currentTime + 0.5);
        noiseNode.stop(ctx.currentTime + 1.5);
        return;
      }

      case 'reveal':
        osc.frequency.value = 528;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
        osc.start();
        osc.stop(ctx.currentTime + 2);
        osc.connect(gain);
        gain.connect(masterGain!);
        break;

      case 'onbeat':
        // On-Beat成功音（短く明るい）
        osc.frequency.value = 880;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(masterGain!);
        break;
    }
  } catch {
    // 無音フォールバック
  }
}

export function stopAllAudio(): void {
  // BGMは継続（stopAllAudioはSFXのみ対象）
}

export function setVolume(volume: number): void {
  const safe = Math.max(0, Math.min(1, volume));
  if (masterGain) masterGain.gain.value = safe;
  if (bgmAudio) bgmAudio.volume = safe;
}
