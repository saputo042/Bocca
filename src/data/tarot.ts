// タロット従者データ

import type { BigFiveScores } from './bigfive';

export interface TarotServant {
  id: number;
  name: string;
  englishName: string;
  trait: string;
  skill: string;
  weights: { O: number; C: number; E: number; A: number; N: number };
  alive: boolean;
  resonance: number;
}

export const ALL_SERVANTS: TarotServant[] = [
  { id: 0,  name: '愚者',      englishName: 'The Fool',           trait: '好奇心・無謀な挑戦',   skill: '先駆け（未知の道を恐れず最初に歩む）',             weights: { O:5, C:1, E:3, A:2, N:2 }, alive: true, resonance: 0 },
  { id: 1,  name: '魔術師',    englishName: 'The Magician',       trait: '実行力・創造性',       skill: '変換（手元の資源を最大限に活かす）',               weights: { O:4, C:5, E:4, A:2, N:1 }, alive: true, resonance: 0 },
  { id: 2,  name: '女教皇',    englishName: 'The High Priestess', trait: '直感・内省力',         skill: '透視（言葉にならない真意を感じ取る）',             weights: { O:5, C:2, E:1, A:3, N:3 }, alive: true, resonance: 0 },
  { id: 3,  name: '女帝',      englishName: 'The Empress',        trait: '包容力・感受性',       skill: '包容（敵意を育てさせず心を開かせる）',             weights: { O:3, C:3, E:3, A:5, N:2 }, alive: true, resonance: 0 },
  { id: 4,  name: '皇帝',      englishName: 'The Emperor',        trait: '統率力・支配欲',       skill: '統制（混乱を整理し主導権を握る）',                 weights: { O:2, C:5, E:5, A:1, N:2 }, alive: true, resonance: 0 },
  { id: 5,  name: '法王',      englishName: 'The Hierophant',     trait: '従順・道徳への服従',   skill: '聖約（約束の力を最大化し信頼を盾にする）',         weights: { O:1, C:5, E:2, A:5, N:1 }, alive: true, resonance: 0 },
  { id: 6,  name: '恋人',      englishName: 'The Lovers',         trait: '共感・感情的選択',     skill: '共鳴（他者の感情と同調し深いつながりを結ぶ）',     weights: { O:3, C:2, E:4, A:5, N:3 }, alive: true, resonance: 0 },
  { id: 7,  name: '戦車',      englishName: 'The Chariot',        trait: '意志力・競争心',       skill: '突進（迷いを断ち切り障害を突破する）',             weights: { O:2, C:5, E:5, A:2, N:2 }, alive: true, resonance: 0 },
  { id: 8,  name: '力',        englishName: 'Strength',           trait: '内的強さ・忍耐',       skill: '制御（極限状態でも冷静に最善を選ぶ）',             weights: { O:3, C:4, E:3, A:3, N:1 }, alive: true, resonance: 0 },
  { id: 9,  name: '隠者',      englishName: 'The Hermit',         trait: '孤独・内向き思考',     skill: '孤灯（一人の状況でのみ発揮される判断力）',         weights: { O:5, C:3, E:1, A:2, N:3 }, alive: true, resonance: 0 },
  { id: 10, name: '運命の輪',  englishName: 'Wheel of Fortune',   trait: '柔軟性・運命への委任', skill: '転換（不利な状況を逆手に取る）',                   weights: { O:4, C:1, E:3, A:3, N:4 }, alive: true, resonance: 0 },
  { id: 11, name: '正義',      englishName: 'Justice',            trait: '公正さ・論理的判断',   skill: '裁定（最も合理的な判断を下す）',                   weights: { O:2, C:5, E:2, A:4, N:1 }, alive: true, resonance: 0 },
  { id: 12, name: '吊された男',englishName: 'The Hanged Man',     trait: '自己犠牲・視点の逆転', skill: '捧げ（自己犠牲で他者を救う力を最大化する）',       weights: { O:4, C:2, E:2, A:5, N:4 }, alive: true, resonance: 0 },
  { id: 13, name: '死神',      englishName: 'Death',              trait: '変容・手放す力',       skill: '転生（過去を手放し新たな局面を切り開く）',         weights: { O:4, C:1, E:3, A:2, N:1 }, alive: true, resonance: 0 },
  { id: 14, name: '節制',      englishName: 'Temperance',         trait: 'バランス・調和',       skill: '均衡（対立する要素を調整し最適解を見つける）',     weights: { O:3, C:5, E:2, A:5, N:1 }, alive: true, resonance: 0 },
  { id: 15, name: '悪魔',      englishName: 'The Devil',          trait: '欲望・執着・本能',     skill: '誘惑（相手の欲や弱点を見抜き利用する）',           weights: { O:3, C:1, E:4, A:1, N:5 }, alive: true, resonance: 0 },
  { id: 16, name: '塔',        englishName: 'The Tower',          trait: '破壊衝動・突破力',     skill: '崩壊（停滞した状況を意図的に壊す）',               weights: { O:4, C:1, E:5, A:1, N:4 }, alive: true, resonance: 0 },
  { id: 17, name: '星',        englishName: 'The Star',           trait: '希望・理想主義',       skill: '灯台（絶望的な状況でも希望を示す）',               weights: { O:5, C:2, E:3, A:4, N:1 }, alive: true, resonance: 0 },
  { id: 18, name: '月',        englishName: 'The Moon',           trait: '不安・幻想・曖昧さ',   skill: '幻惑（相手の認識を歪め虚実の境界を曖昧にする）',   weights: { O:5, C:1, E:2, A:3, N:5 }, alive: true, resonance: 0 },
  { id: 19, name: '太陽',      englishName: 'The Sun',            trait: '楽観性・外向性',       skill: '輝照（周囲のモラルを高め行動力を引き出す）',       weights: { O:3, C:3, E:5, A:4, N:1 }, alive: true, resonance: 0 },
  { id: 20, name: '審判',      englishName: 'Judgement',          trait: '自己評価・責任感',     skill: '覚醒（過去の選択の意味を把握し最善手を導く）',     weights: { O:3, C:5, E:3, A:3, N:3 }, alive: true, resonance: 0 },
  { id: 21, name: '世界',      englishName: 'The World',          trait: '統合・完全性',         skill: '全知（あらゆる状況で最適な対応を選べる適応力）',   weights: { O:4, C:4, E:4, A:4, N:2 }, alive: true, resonance: 0 },
];

export function selectServants(scores: BigFiveScores): TarotServant[] {
  return ALL_SERVANTS
    .map(s => ({
      ...s,
      alive: true,
      resonance: scores.O * s.weights.O + scores.C * s.weights.C +
                 scores.E * s.weights.E + scores.A * s.weights.A + scores.N * s.weights.N,
    }))
    .sort((a, b) => b.resonance !== a.resonance ? b.resonance - a.resonance : a.id - b.id)
    .slice(0, 8);
}

export function findByDimension(
  servants: TarotServant[],
  dim: keyof TarotServant['weights'],
  selector: 'max' | 'min'
): TarotServant | null {
  const alive = servants.filter(s => s.alive);
  if (alive.length === 0) return null;
  return alive.reduce((best, s) =>
    selector === 'max'
      ? s.weights[dim] > best.weights[dim] ? s : best
      : s.weights[dim] < best.weights[dim] ? s : best
  );
}

export const TAROT_SYMBOLS = ['0','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI'];
