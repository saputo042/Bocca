// Big Five 性格診断データ

export interface Question {
  id: number;
  dimension: 'O' | 'C' | 'E' | 'A' | 'N';
  text: string;
  reversed: boolean;
}

export const QUESTIONS: Question[] = [
  { id: 1,  dimension: 'O', text: '新しい場所に行くと、まず隅々まで探索したくなる', reversed: false },
  { id: 2,  dimension: 'O', text: '型にはまらないアイデアや方法にワクワクする', reversed: false },
  { id: 3,  dimension: 'O', text: '美しいものや芸術作品に強く心を動かされる', reversed: false },
  { id: 4,  dimension: 'O', text: '物事を複数の視点から考えることが好きだ', reversed: false },
  { id: 5,  dimension: 'O', text: '未知のものより、慣れ親しんだものの方が安心する', reversed: true },
  { id: 6,  dimension: 'O', text: '空想や想像の世界に意識が向くことがよくある', reversed: false },
  { id: 7,  dimension: 'C', text: '行動する前に計画を立てることが多い', reversed: false },
  { id: 8,  dimension: 'C', text: '一度始めたことは、やり遂げるまで諦めない', reversed: false },
  { id: 9,  dimension: 'C', text: '締め切りや約束の時間を守ることに強くこだわる', reversed: false },
  { id: 10, dimension: 'C', text: '物や情報が整理されていないと落ち着かない', reversed: false },
  { id: 11, dimension: 'C', text: '衝動に任せて行動してしまうことが多い', reversed: true },
  { id: 12, dimension: 'C', text: '自分の行動の結果に責任を持つことを重要視している', reversed: false },
  { id: 13, dimension: 'E', text: '人と話しているとエネルギーが湧いてくる', reversed: false },
  { id: 14, dimension: 'E', text: '注目される場面では張り切れる方だ', reversed: false },
  { id: 15, dimension: 'E', text: '一人でいる時間の方が充電できると感じる', reversed: true },
  { id: 16, dimension: 'E', text: '初対面の人と話を始めるのが得意だ', reversed: false },
  { id: 17, dimension: 'A', text: '争いを避けるために、自分の意見を曲げることがある', reversed: false },
  { id: 18, dimension: 'A', text: '困っている人を見ると放っておけない', reversed: false },
  { id: 19, dimension: 'A', text: '自分が正しいと思えば、はっきり主張する方だ', reversed: true },
  { id: 20, dimension: 'A', text: '他者の気持ちや感情の変化に敏感に気づける', reversed: false },
  { id: 21, dimension: 'N', text: '不安や心配が頭から離れないことが多い', reversed: false },
  { id: 22, dimension: 'N', text: '小さな失敗でも長く引きずってしまう', reversed: false },
  { id: 23, dimension: 'N', text: 'ストレスの多い状況でも比較的冷静でいられる', reversed: true },
  { id: 24, dimension: 'N', text: '感情の起伏が激しい方だと思う', reversed: false },
];

export interface BigFiveScores {
  O: number; C: number; E: number; A: number; N: number;
}

export function calculateScores(answers: number[]): BigFiveScores {
  const raw: Record<string, number[]> = { O: [], C: [], E: [], A: [], N: [] };
  QUESTIONS.forEach((q, i) => {
    const val = q.reversed ? 6 - (answers[i] ?? 3) : (answers[i] ?? 3);
    raw[q.dimension].push(val);
  });
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  return {
    O: Math.max(0, Math.min(1, (sum(raw.O) - 6) / 24)),
    C: Math.max(0, Math.min(1, (sum(raw.C) - 6) / 24)),
    E: Math.max(0, Math.min(1, (sum(raw.E) - 4) / 16)),
    A: Math.max(0, Math.min(1, (sum(raw.A) - 4) / 16)),
    N: Math.max(0, Math.min(1, (sum(raw.N) - 4) / 16)),
  };
}

// Alias for backward compatibility with code that uses computeBigFive
export { calculateScores as computeBigFive };
