// BOCCA — コンポーネント: RadarChart（5軸レーダーチャート SVG）

import type { DiagnosisScores } from '../utils/gameState';

const AXES: { key: keyof DiagnosisScores; label: string }[] = [
  { key: 'rational',     label: '合理性' },
  { key: 'risk',         label: 'リスク志向' },
  { key: 'social',       label: '協調性' },
  { key: 'expectation',  label: '期待応答' },
  { key: 'selfpreserve', label: '自己保全' },
];

const MAX_VAL = 10; // 各軸の最大表示値（-10〜+10を0〜1に正規化）
const CENTER = 120;
const RADIUS = 90;
const SVG_SIZE = 240;

function polarToXY(angleRad: number, r: number): { x: number; y: number } {
  return {
    x: CENTER + r * Math.cos(angleRad - Math.PI / 2),
    y: CENTER + r * Math.sin(angleRad - Math.PI / 2),
  };
}

function normalize(val: number): number {
  // -MAX_VAL〜+MAX_VAL を 0〜1 に
  return Math.max(0, Math.min(1, (val + MAX_VAL) / (MAX_VAL * 2)));
}

export function buildRadarChartSVG(scores: DiagnosisScores): string {
  const n = AXES.length;
  const angleStep = (Math.PI * 2) / n;

  // グリッド（3段）
  let gridLines = '';
  for (let ring = 1; ring <= 3; ring++) {
    const r = RADIUS * (ring / 3);
    const points = AXES.map((_, i) => {
      const { x, y } = polarToXY(angleStep * i, r);
      return `${x},${y}`;
    }).join(' ');
    gridLines += `<polygon points="${points}" class="radar-grid" />`;
  }

  // 軸線
  let axisLines = AXES.map((_, i) => {
    const { x, y } = polarToXY(angleStep * i, RADIUS);
    return `<line x1="${CENTER}" y1="${CENTER}" x2="${x}" y2="${y}" class="radar-axis" />`;
  }).join('');

  // スコアポリゴン
  const scorePoints = AXES.map((axis, i) => {
    const norm = normalize(scores[axis.key]);
    const { x, y } = polarToXY(angleStep * i, RADIUS * norm);
    return `${x},${y}`;
  }).join(' ');

  // ラベル
  let labels = AXES.map((axis, i) => {
    const { x, y } = polarToXY(angleStep * i, RADIUS + 20);
    const anchor = x < CENTER - 5 ? 'end' : x > CENTER + 5 ? 'start' : 'middle';
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" class="radar-label">${axis.label}</text>`;
  }).join('');

  // スコア値ドット
  let dots = AXES.map((axis, i) => {
    const norm = normalize(scores[axis.key]);
    const { x, y } = polarToXY(angleStep * i, RADIUS * norm);
    return `<circle cx="${x}" cy="${y}" r="4" class="radar-dot" />`;
  }).join('');

  return `
    <svg viewBox="0 0 ${SVG_SIZE} ${SVG_SIZE}" class="radar-chart">
      ${gridLines}
      ${axisLines}
      <polygon points="${scorePoints}" class="radar-score" />
      ${dots}
      ${labels}
    </svg>
  `;
}

/** 5軸スコアの説明テキストを生成 */
export function buildAxesDescription(scores: DiagnosisScores): string {
  return AXES.map(axis => {
    const val = scores[axis.key];
    const bar = val >= 0
      ? `<span class="axis-bar positive" style="width:${Math.min(100, val * 10)}%"></span>`
      : `<span class="axis-bar negative" style="width:${Math.min(100, Math.abs(val) * 10)}%"></span>`;
    const direction = val >= 0 ? '+' : '';
    return `
      <div class="axis-row">
        <span class="axis-name">${axis.label}</span>
        <div class="axis-track">${bar}</div>
        <span class="axis-val">${direction}${val.toFixed(1)}</span>
      </div>
    `;
  }).join('');
}
