// BOCCA — 従者決定クイズデータ v2（5問 / 5軸DiagnosisScores対応）

import type { DiagnosisScores } from '../utils/gameState';

export interface QuestionOption {
  id: string;
  label: string;
  subLabel?: string;
  vesselScores: Partial<Record<string, number>>;
  diagDelta: Partial<DiagnosisScores>;
}

export interface Question {
  id: number;
  text: string;
  subText?: string;
  options: QuestionOption[];
}

export const QUESTIONS: Question[] = [

  // Q1: 窮地に立たされたとき
  {
    id: 1,
    text: '窮地に立たされたとき\nあなたはどう動く？',
    options: [
      {
        id: 'a',
        label: '誰かに話す・力を借りる',
        subLabel: '一人では抱えきれない。言葉にすることで整理する',
        vesselScores: { empathy: 2, charm: 2, guardian: 1 },
        diagDelta: { social: 2, rational: -1 },
      },
      {
        id: 'b',
        label: '一人で考え抜く',
        subLabel: '静かな場所で、全てを自分の頭の中で処理する',
        vesselScores: { analysis: 2, stealth: 2, calculation: 1 },
        diagDelta: { rational: 2, social: -1 },
      },
      {
        id: 'c',
        label: 'とにかく動く・行動する',
        subLabel: '考えすぎている暇はない。まず動いて突破する',
        vesselScores: { breakthrough: 2, madness: 2, intuition: 1 },
        diagDelta: { risk: 2, rational: -1 },
      },
      {
        id: 'd',
        label: '状況を観察・分析してから判断する',
        subLabel: '感情を切り離し、全体像を把握してから動く',
        vesselScores: { analysis: 2, endurance: 2, transcendence: 1 },
        diagDelta: { rational: 2, risk: -1 },
      },
    ],
  },

  // Q2: 最も恐れているもの
  {
    id: 2,
    text: 'あなたが最も恐れているのは\nどれに近い？',
    options: [
      {
        id: 'a',
        label: '誰かを傷つけること',
        subLabel: '自分の行動が、誰かの心や体を壊してしまうこと',
        vesselScores: { empathy: 2, devotion: 2, guardian: 1 },
        diagDelta: { social: 2, selfpreserve: -1 },
      },
      {
        id: 'b',
        label: '大切なものを失うこと',
        subLabel: '手の届かないところへ、消えていくこと',
        vesselScores: { obsession: 2, guardian: 2, devotion: 1 },
        diagDelta: { selfpreserve: -1, expectation: 1 },
      },
      {
        id: 'c',
        label: '失敗・恥をかくこと',
        subLabel: '間違えること、弱さを見せること、笑われること',
        vesselScores: { authority: 2, endurance: 2, projection: 1 },
        diagDelta: { rational: 1, selfpreserve: 1 },
      },
      {
        id: 'd',
        label: '自分が誰かに利用されること',
        subLabel: 'コントロールを失い、他者の駒になること',
        vesselScores: { stealth: 2, calculation: 2, transcendence: 1 },
        diagDelta: { rational: 1, social: -1 },
      },
    ],
  },

  // Q3: 傷つけられたとき
  {
    id: 3,
    text: '誰かに深く傷つけられたとき\nあなたは——',
    options: [
      {
        id: 'a',
        label: '仕返しを考える',
        subLabel: '同じ痛みを相手に与えることを、頭の中で繰り返す',
        vesselScores: { projection: 2, authority: 2, breakthrough: 1 },
        diagDelta: { rational: 2, selfpreserve: 1 },
      },
      {
        id: 'b',
        label: '許そうとする',
        subLabel: '憎しみを持ち続けることへの疲れを知っている',
        vesselScores: { empathy: 2, devotion: 2, transcendence: 1 },
        diagDelta: { social: 2, selfpreserve: -1 },
      },
      {
        id: 'c',
        label: '距離を置く',
        subLabel: '関わり続けることが一番の消耗だと知っている',
        vesselScores: { stealth: 2, endurance: 2, transcendence: 1 },
        diagDelta: { rational: 1, social: -1 },
      },
      {
        id: 'd',
        label: 'なかったことにする',
        subLabel: '傷はある。だが感じないようにすることが得意だ',
        vesselScores: { endurance: 2, calculation: 2, projection: 1 },
        diagDelta: { rational: 1, expectation: -1 },
      },
    ],
  },

  // Q4: 旅に持っていくもの
  {
    id: 4,
    text: '長い旅に出るとしたら\nあなたは何を持っていく？',
    subText: '一つしか選べない。',
    options: [
      {
        id: 'a',
        label: '武器',
        subLabel: '自分と仲間を守るための力。備えなければ何も守れない',
        vesselScores: { breakthrough: 2, authority: 2, madness: 1 },
        diagDelta: { risk: 1, selfpreserve: 1 },
      },
      {
        id: 'b',
        label: '知識・地図・記録',
        subLabel: '知ることが生存の鍵だ。情報のない旅は盲目と同じ',
        vesselScores: { analysis: 2, calculation: 2, intuition: 1 },
        diagDelta: { rational: 2 },
      },
      {
        id: 'c',
        label: '食料・医薬品',
        subLabel: '生きていることが全ての前提だ。まず生き延びる',
        vesselScores: { guardian: 2, endurance: 2, devotion: 1 },
        diagDelta: { risk: -1, social: 1 },
      },
      {
        id: 'd',
        label: '大切な人の形見・思い出の品',
        subLabel: 'それがある限り、自分が自分でいられる',
        vesselScores: { obsession: 2, empathy: 2, charm: 1 },
        diagDelta: { social: 1, expectation: 1 },
      },
    ],
  },

  // Q5: 欲しい力
  {
    id: 5,
    text: 'もし一つ、力を手に入れられるなら\nどれを選ぶ？',
    options: [
      {
        id: 'a',
        label: '圧倒的な支配力',
        subLabel: 'あらゆる場で頂点に立ち、誰もが従う存在になる',
        vesselScores: { authority: 3, breakthrough: 2, projection: 1 },
        diagDelta: { rational: 1, selfpreserve: 2 },
      },
      {
        id: 'b',
        label: '完璧な知性・分析力',
        subLabel: '全ての真実を見抜き、誰よりも正確な判断ができる',
        vesselScores: { analysis: 3, calculation: 2, intuition: 1 },
        diagDelta: { rational: 3 },
      },
      {
        id: 'c',
        label: '誰にも見つからない力',
        subLabel: '完全に気配を消し、影の中で自由に動ける',
        vesselScores: { stealth: 3, transcendence: 2, projection: 1 },
        diagDelta: { rational: 1, social: -2 },
      },
      {
        id: 'd',
        label: '人の感情を動かす力',
        subLabel: '言葉と存在だけで、人を引き寄せ、動かす',
        vesselScores: { charm: 3, empathy: 2, obsession: 1 },
        diagDelta: { social: 2, risk: 1 },
      },
    ],
  },
];
