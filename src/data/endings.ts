// エンディングデータ

import type { GameState } from '../utils/gameState';

export interface Ending {
  id: string;
  title: string;
  type: 'BEST' | 'GOOD' | 'NORMAL' | 'DEEP' | 'SPECIAL' | 'SECRET' | 'BAD';
  message: string;
  check: (state: GameState) => boolean;
}

export const ENDINGS: Ending[] = [
  {
    id: 'bad',
    title: '還らぬ旅人',
    type: 'BAD',
    message: 'あなたの旅はここで終わった。でも、どこで終わったかがあなたを語る。',
    check: (s) => s.gameOver,
  },
  {
    id: 'secret',
    title: '無傷の孤独',
    type: 'SECRET',
    message: '誰も犠牲にせず、誰も頼らず。その強さは本物か、それとも孤立か。あなた自身が知っている。',
    check: (s) => !s.gameOver && s.bossDefeated && s.sacrificeCount === 0,
  },
  {
    id: 'special',
    title: '空白の勇者',
    type: 'SPECIAL',
    message: '全てを捧げた者。失うことを恐れない者だけが見える景色がある。あなたは今、自由だ。',
    check: (s) => !s.gameOver && s.bossDefeated && s.aliveServants.length === 0,
  },
  {
    id: 'best',
    title: '完全なる自己',
    type: 'BEST',
    message: '何も失わなかった者。あなたは全てを抱えて戦い続けた。その重さこそが、あなたの価値だ。',
    check: (s) => !s.gameOver && s.bossDefeated && s.aliveServants.length >= 7,
  },
  {
    id: 'good',
    title: '選ばれた強さ',
    type: 'GOOD',
    message: '大切なものを選んで守った。捨てたものは弱さではなく、優先順位を知っている証だ。',
    check: (s) => !s.gameOver && s.bossDefeated && s.aliveServants.length >= 5,
  },
  {
    id: 'normal',
    title: '現実の生存者',
    type: 'NORMAL',
    message: '失うことの意味を知っている。あなたは合理的に、そして正直に自分と向き合った。',
    check: (s) => !s.gameOver && s.bossDefeated && s.aliveServants.length >= 3,
  },
  {
    id: 'deep',
    title: '最後の一線',
    type: 'DEEP',
    message: '全てを手放しても守り抜いたもの。その1体があなたの核心だ。大切にしろ。',
    check: (s) => !s.gameOver && s.bossDefeated && s.aliveServants.length >= 1,
  },
];

export function determineEnding(state: GameState): Ending {
  const order = ['bad', 'secret', 'special', 'best', 'good', 'normal', 'deep'];
  for (const id of order) {
    const ending = ENDINGS.find(e => e.id === id)!;
    if (ending.check(state)) return ending;
  }
  return ENDINGS.find(e => e.id === 'bad')!;
}
