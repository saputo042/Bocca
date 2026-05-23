// BOCCA 鼓動システム — 拍同期 & ビートインジケーター

export interface RhythmLogEntry {
  stageId: number;
  action: string;
  beatOffset: number; // 最寄りの拍からの距離（ms）
  isOnBeat: boolean;
}

// BPM設定（実際のトラックに合わせて調整可）
export const TRACK_BPM = {
  normal: 120,  // Sound_Wave.mp3 (ST-01〜07)
  climax: 128,  // Party_Killer.mp3 (ST-08〜09)
} as const;

const BEAT_WINDOW_MS = 150; // On-Beat判定 ±150ms

let _bpm = 120;
let _bgmEl: HTMLAudioElement | null = null;
let _indicatorRafId = 0;
let _indicatorActive = false;

// ── 初期化 ──────────────────────────────────────────────────

export function initRhythm(bgmEl: HTMLAudioElement, bpm: number): void {
  _bgmEl = bgmEl;
  _bpm = bpm;
}

export function setBPM(bpm: number): void {
  _bpm = bpm;
}

export function getBPM(): number {
  return _bpm;
}

// ── 拍計算 ──────────────────────────────────────────────────

/** 現在の拍フェーズ（0〜1）。BGM停止中は0を返す */
export function getBeatPhase(): number {
  if (!_bgmEl || _bgmEl.paused) return 0;
  const beatSec = 60 / _bpm;
  return (_bgmEl.currentTime % beatSec) / beatSec;
}

/** 最寄りの拍からの距離（ms）。BGM停止中は999を返す */
function nearestBeatOffsetMs(): number {
  if (!_bgmEl || _bgmEl.paused) return 999;
  const beatSec = 60 / _bpm;
  const phase = _bgmEl.currentTime % beatSec;
  return Math.min(phase, beatSec - phase) * 1000;
}

/** On-Beat判定 */
export function checkOnBeat(): { isOnBeat: boolean; offsetMs: number } {
  const offsetMs = nearestBeatOffsetMs();
  return { isOnBeat: offsetMs <= BEAT_WINDOW_MS, offsetMs };
}

// ── ビートインジケーター（画面左下の鼓動HUD）──────────────

// SVG r=22 の円周 = 2π×22 ≈ 138.23
const BEAT_RING_CIRC = 138.23;

export function startBeatIndicator(): void {
  if (_indicatorActive) return;
  _indicatorActive = true;

  let el = document.getElementById('beat-indicator');
  if (!el) {
    el = document.createElement('div');
    el.id = 'beat-indicator';
    el.innerHTML = `
      <div id="beat-orb-wrap">
        <svg id="beat-ring-svg" viewBox="0 0 56 56" width="56" height="56">
          <circle cx="28" cy="28" r="22" fill="none"
                  stroke="rgba(201,162,39,0.12)" stroke-width="4"/>
          <circle id="beat-ring-fill" cx="28" cy="28" r="22" fill="none"
                  stroke="rgba(201,162,39,0.78)" stroke-width="4"
                  stroke-linecap="round"
                  stroke-dasharray="${BEAT_RING_CIRC}"
                  stroke-dashoffset="${BEAT_RING_CIRC}"/>
        </svg>
        <div id="beat-core"></div>
      </div>
      <div id="beat-grade"></div>`;
    document.body.appendChild(el);
  }

  let prevPhase = 0;

  function tick(): void {
    if (!_indicatorActive) return;
    const phase = getBeatPhase();

    const fillEl = document.getElementById('beat-ring-fill');
    if (fillEl) {
      fillEl.setAttribute(
        'stroke-dashoffset',
        (BEAT_RING_CIRC * (1 - phase)).toFixed(2),
      );
    }

    if (prevPhase > 0.85 && phase < 0.15) {
      _pulseIndicator();
    }
    prevPhase = phase;
    _indicatorRafId = requestAnimationFrame(tick);
  }
  _indicatorRafId = requestAnimationFrame(tick);
}

export function stopBeatIndicator(): void {
  _indicatorActive = false;
  cancelAnimationFrame(_indicatorRafId);
  document.getElementById('beat-indicator')?.remove();
}

function _pulseIndicator(): void {
  const el = document.getElementById('beat-indicator');
  if (!el) return;
  el.classList.add('beat-pulse');
  setTimeout(() => el.classList.remove('beat-pulse'), 120);
}

/** アクション時のOn-Beat/Off-Beatフラッシュ演出 */
export function flashActionBeat(isOnBeat: boolean): void {
  showRhythmGrade(isOnBeat ? 'PERFECT' : 'MISS');
}

/** ボタン押下タイミングのグレードをHUDに表示 */
export function showRhythmGrade(grade: 'PERFECT' | 'GOOD' | 'MISS'): void {
  const el = document.getElementById('beat-grade');
  if (!el) return;
  el.className = '';
  el.textContent = grade;
  void (el as HTMLElement).offsetWidth; // reflow でアニメーションをリセット
  el.classList.add(
    'grade-show',
    grade === 'PERFECT' ? 'grade-perfect' : grade === 'MISS' ? 'grade-miss' : 'grade-good',
  );
}

// ── ライトモチーフ合成（Web Audio API）──────────────────────

type MotifMode = 'normal' | 'minor' | 'reverse';

let _audioCtx: AudioContext | null = null;
let _masterGain: GainNode | null = null;

export function initMotifAudio(ctx: AudioContext, masterGain: GainNode): void {
  _audioCtx = ctx;
  _masterGain = masterGain;
}

function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** 従者のライトモチーフを再生 */
export function playMotif(notes: number[], mode: MotifMode = 'normal'): void {
  if (!_audioCtx || !_masterGain) return;

  let playNotes = [...notes];

  if (mode === 'minor') {
    // 短調化: 各音を短調3度下げる (-3 半音)
    playNotes = playNotes.map(n => n - 3);
  } else if (mode === 'reverse') {
    // 逆再生（減速フェード）
    playNotes = [...playNotes].reverse();
  }

  const noteDuration = mode === 'reverse' ? 0.35 : 0.22;
  const ctx = _audioCtx;
  const gain = _masterGain;

  playNotes.forEach((midi, i) => {
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();
    const startTime = ctx.currentTime + i * noteDuration;

    osc.type = 'sine';
    osc.frequency.value = midiToHz(midi);

    const vol = mode === 'reverse'
      ? 0.12 * (1 - i / playNotes.length)
      : 0.12;

    noteGain.gain.setValueAtTime(vol, startTime);
    noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration * 0.9);

    osc.connect(noteGain);
    noteGain.connect(gain);
    osc.start(startTime);
    osc.stop(startTime + noteDuration);
  });
}
