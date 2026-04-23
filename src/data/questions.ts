// BOCCA — 従者決定クイズデータ
// 7問の質問と、各選択肢が加点するvesselスコア・mbtiDeltaを定義

import type { MBTIScores } from '../utils/gameState';

// ===============================
// 型定義
// ===============================

export interface QuestionOption {
  id: string;
  label: string;
  subLabel?: string;                              // 選択肢の補足テキスト
  vesselScores: Partial<Record<string, number>>;  // vessel.id → 加点スコア
  mbtiDelta: Partial<MBTIScores>;
}

export interface Question {
  id: number;
  text: string;                // メイン質問文
  subText?: string;            // 補足テキスト（任意）
  options: QuestionOption[];
}

// ===============================
// 全7問 質問データ
// ===============================

export const QUESTIONS: Question[] = [

  // ─── Q1: 夜、眠れないとき ───
  {
    id: 1,
    text: '夜、眠れないとき\nあなたは何を考えている？',
    options: [
      {
        id: 'a',
        label: '誰かのこと',
        subLabel: '心配、後悔、恋しさ——誰かの顔が浮かぶ',
        vesselScores: {
          empathy: 2, guardian: 2, devotion: 2, obsession: 1,
        },
        mbtiDelta: { F: 2, I: 1 },
      },
      {
        id: 'b',
        label: '自分の将来や計画',
        subLabel: '次に何をすべきか、頭が止まらない',
        vesselScores: {
          analysis: 2, authority: 2, calculation: 2, endurance: 1,
        },
        mbtiDelta: { T: 2, J: 1 },
      },
      {
        id: 'c',
        label: 'ただ——分からない',
        subLabel: '形のない不安や、名前のつけられない感情',
        vesselScores: {
          intuition: 2, creation: 2, transcendence: 2, madness: 1,
        },
        mbtiDelta: { N: 2, P: 1 },
      },
      {
        id: 'd',
        label: '何も考えていない（ただ、目が覚めている）',
        subLabel: '思考ではなく、感覚だけがある',
        vesselScores: {
          stealth: 2, endurance: 2, breakthrough: 1, projection: 1,
        },
        mbtiDelta: { S: 2, I: 1 },
      },
    ],
  },

  // ─── Q2: 窮地に立たされたとき ───
  {
    id: 2,
    text: '窮地に立たされたとき\nあなたはどう動く？',
    options: [
      {
        id: 'a',
        label: '誰かに話す・相談する',
        subLabel: '一人では抱えきれない。言葉にすることで整理する',
        vesselScores: {
          empathy: 2, charm: 2, guardian: 1, devotion: 1,
        },
        mbtiDelta: { E: 2, F: 1 },
      },
      {
        id: 'b',
        label: '一人で考え抜く',
        subLabel: '静かな場所で、全てを自分の頭の中で処理する',
        vesselScores: {
          analysis: 2, stealth: 2, calculation: 2, projection: 1,
        },
        mbtiDelta: { I: 2, T: 1 },
      },
      {
        id: 'c',
        label: 'とにかく動く・行動する',
        subLabel: '考えすぎている暇はない。まず動いて突破する',
        vesselScores: {
          breakthrough: 2, authority: 2, madness: 2, intuition: 1,
        },
        mbtiDelta: { E: 1, P: 1 },
      },
      {
        id: 'd',
        label: '状況を観察・分析する',
        subLabel: '感情を切り離し、全体像を把握してから判断する',
        vesselScores: {
          analysis: 2, intuition: 2, transcendence: 2, endurance: 1,
        },
        mbtiDelta: { N: 1, I: 1 },
      },
    ],
  },

  // ─── Q3: 最も怖いもの ───
  {
    id: 3,
    text: 'あなたが最も恐れているものは\nどれに近い？',
    options: [
      {
        id: 'a',
        label: '誰かを傷つけること',
        subLabel: '自分の言葉や行動が、誰かを壊してしまうこと',
        vesselScores: {
          empathy: 2, devotion: 2, guardian: 2, obsession: 1,
        },
        mbtiDelta: { F: 2, I: 1 },
      },
      {
        id: 'b',
        label: '孤独になること',
        subLabel: '誰にも必要とされず、ただ一人になること',
        vesselScores: {
          charm: 2, guardian: 1, obsession: 2, devotion: 1,
        },
        mbtiDelta: { E: 1, F: 1 },
      },
      {
        id: 'c',
        label: '失敗・恥をかくこと',
        subLabel: '間違えること、弱さを見せること、笑われること',
        vesselScores: {
          authority: 2, endurance: 2, projection: 2, analysis: 1,
        },
        mbtiDelta: { T: 1, J: 1 },
      },
      {
        id: 'd',
        label: '大切なものを失うこと',
        subLabel: '手の届かないところへ、消えていくこと',
        vesselScores: {
          obsession: 2, devotion: 2, guardian: 2, breakthrough: 1,
        },
        mbtiDelta: { F: 1, J: 1 },
      },
    ],
  },

  // ─── Q4: 旅に持っていくもの ───
  {
    id: 4,
    text: '長い旅に出るとしたら\nあなたは何を持っていく？',
    subText: '一つしか選べない。',
    options: [
      {
        id: 'a',
        label: '武器',
        subLabel: '自分と仲間を守るための力。備えなければ何も守れない',
        vesselScores: {
          breakthrough: 2, authority: 2, madness: 1, endurance: 1,
        },
        mbtiDelta: { T: 1, E: 1 },
      },
      {
        id: 'b',
        label: '知識・地図・記録',
        subLabel: '知ることが生存の鍵だ。情報のない旅は盲目と同じ',
        vesselScores: {
          analysis: 2, calculation: 2, intuition: 2, projection: 1,
        },
        mbtiDelta: { N: 1, T: 1 },
      },
      {
        id: 'c',
        label: '食料・医薬品',
        subLabel: '生きていることが全ての前提だ。まず生き延びる',
        vesselScores: {
          guardian: 2, endurance: 2, devotion: 2, stealth: 1,
        },
        mbtiDelta: { S: 1, J: 1 },
      },
      {
        id: 'd',
        label: '大切な人の形見・思い出の品',
        subLabel: 'それがある限り、自分が自分でいられる',
        vesselScores: {
          obsession: 2, empathy: 2, charm: 2, transcendence: 1,
        },
        mbtiDelta: { F: 1, I: 1 },
      },
    ],
  },

  // ─── Q5: 傷つけられたとき ───
  {
    id: 5,
    text: '誰かに深く傷つけられたとき\nあなたは——',
    options: [
      {
        id: 'a',
        label: '仕返しを考える',
        subLabel: '同じ痛みを相手に与えることを、頭の中で繰り返す',
        vesselScores: {
          projection: 2, authority: 2, breakthrough: 2, madness: 1,
        },
        mbtiDelta: { T: 2, E: 1 },
      },
      {
        id: 'b',
        label: '許そうとする',
        subLabel: '憎しみを持ち続けることへの疲れを知っている',
        vesselScores: {
          empathy: 2, devotion: 2, transcendence: 1, obsession: 1,
        },
        mbtiDelta: { F: 2, I: 1 },
      },
      {
        id: 'c',
        label: '距離を置く',
        subLabel: '関わり続けることが一番の消耗だと知っている',
        vesselScores: {
          stealth: 2, endurance: 2, analysis: 1, transcendence: 1,
        },
        mbtiDelta: { I: 2, T: 1 },
      },
      {
        id: 'd',
        label: 'なかったことにする',
        subLabel: '傷はある。だが感じないようにすることが得意だ',
        vesselScores: {
          endurance: 2, stealth: 1, calculation: 2, guardian: 1,
        },
        mbtiDelta: { S: 1, J: 1 },
      },
    ],
  },

  // ─── Q6: 欲しい力 ───
  {
    id: 6,
    text: 'もし一つ、力を手に入れられるなら\nどれを選ぶ？',
    options: [
      {
        id: 'a',
        label: '圧倒的な支配力',
        subLabel: 'あらゆる場で頂点に立ち、誰もが従う存在になる',
        vesselScores: {
          authority: 3, breakthrough: 2, madness: 1,
        },
        mbtiDelta: { E: 2, T: 1, J: 1 },
      },
      {
        id: 'b',
        label: '完璧な知性・分析力',
        subLabel: '全ての真実を見抜き、誰よりも正確な判断ができる',
        vesselScores: {
          analysis: 3, calculation: 2, intuition: 1,
        },
        mbtiDelta: { N: 1, T: 2, J: 1 },
      },
      {
        id: 'c',
        label: '誰にも見つからない力',
        subLabel: '完全に気配を消し、影の中で自由に動ける',
        vesselScores: {
          stealth: 3, transcendence: 2, projection: 1,
        },
        mbtiDelta: { I: 2, P: 1 },
      },
      {
        id: 'd',
        label: '人の感情を動かす力',
        subLabel: '言葉と存在だけで、人を引き寄せ、動かす',
        vesselScores: {
          charm: 3, empathy: 2, obsession: 1,
        },
        mbtiDelta: { E: 1, F: 2, P: 1 },
      },
    ],
  },

  // ─── Q7: 旅の終わりに残したいもの ───
  {
    id: 7,
    text: '全てが終わったとき\nあなたに残っていてほしいのは？',
    options: [
      {
        id: 'a',
        label: '揺るぎない信念',
        subLabel: 'どんな圧力にも砕けなかった、自分の芯',
        vesselScores: {
          endurance: 3, guardian: 2, authority: 1, breakthrough: 1,
        },
        mbtiDelta: { J: 2, I: 1 },
      },
      {
        id: 'b',
        label: '大切な誰か',
        subLabel: '自分以外の存在が、そこに生きていること',
        vesselScores: {
          guardian: 3, empathy: 2, devotion: 2, obsession: 1,
        },
        mbtiDelta: { F: 2, E: 1 },
      },
      {
        id: 'c',
        label: '真実・答え',
        subLabel: '全ての疑問に、自分なりの答えを持てていること',
        vesselScores: {
          analysis: 2, intuition: 2, transcendence: 2, creation: 1,
        },
        mbtiDelta: { N: 2, T: 1 },
      },
      {
        id: 'd',
        label: '縛られない自由',
        subLabel: '何にも、誰にも、支配されていないこと',
        vesselScores: {
          transcendence: 3, madness: 2, creation: 2, stealth: 1,
        },
        mbtiDelta: { P: 2, N: 1 },
      },
    ],
  },
];
