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
  motifNotes: number[]; // MIDI note numbers for leitmotif
  dialogue: {
    intro: string;
    rowing: string;
    pain: string;
    sacrifice: string;
  };
}

export const ALL_SERVANTS: TarotServant[] = [
  {
    id: 0, name: '愚者', englishName: 'The Fool', trait: '好奇心・無謀な挑戦',
    skill: '先駆け（未知の道を恐れず最初に歩む）',
    weights: { O:5, C:1, E:3, A:2, N:2 }, alive: true, resonance: 0,
    motifNotes: [60, 64, 67, 72],
    dialogue: {
      intro: 'やあ！どこに向かうかはわからないけど、一緒に行こう。それだけで十分だ',
      rowing: '漕げ漕げ！波がでかいほど楽しいだろ！',
      pain: 'いたっ……でも、まだ行ける！',
      sacrifice: '後悔なんてない。行きたい場所に向かっただけだから',
    },
  },
  {
    id: 1, name: '魔術師', englishName: 'The Magician', trait: '実行力・創造性',
    skill: '変換（手元の資源を最大限に活かす）',
    weights: { O:4, C:5, E:4, A:2, N:1 }, alive: true, resonance: 0,
    motifNotes: [62, 65, 69, 74],
    dialogue: {
      intro: 'すでに必要なものは揃っている。問題は、それを使えるかどうかだ',
      rowing: 'リズムを合わせろ。力ではなく、タイミングだ',
      pain: 'ぐっ……計算違いか',
      sacrifice: '道具が役割を果たした。それで十分だ',
    },
  },
  {
    id: 2, name: '女教皇', englishName: 'The High Priestess', trait: '直感・内省力',
    skill: '透視（言葉にならない真意を感じ取る）',
    weights: { O:5, C:2, E:1, A:3, N:3 }, alive: true, resonance: 0,
    motifNotes: [61, 65, 68, 73],
    dialogue: {
      intro: 'あなたのことは、会う前からわかっていた気がします',
      rowing: '水の流れに逆らわないで。感じて',
      pain: '……痛みも、意味がある',
      sacrifice: 'これが、わたしの見えていた結末です',
    },
  },
  {
    id: 3, name: '女帝', englishName: 'The Empress', trait: '包容力・感受性',
    skill: '包容（敵意を育てさせず心を開かせる）',
    weights: { O:3, C:3, E:3, A:5, N:2 }, alive: true, resonance: 0,
    motifNotes: [60, 64, 67, 69],
    dialogue: {
      intro: '怖くない。わたしがそばにいる限り、あなたは守られています',
      rowing: '一緒に漕げば、どんな流れも越えられる',
      pain: 'あなたを守るためなら、これくらい',
      sacrifice: '幸せになって。それだけを願っています',
    },
  },
  {
    id: 4, name: '皇帝', englishName: 'The Emperor', trait: '統率力・支配欲',
    skill: '統制（混乱を整理し主導権を握る）',
    weights: { O:2, C:5, E:5, A:1, N:2 }, alive: true, resonance: 0,
    motifNotes: [60, 63, 67, 72],
    dialogue: {
      intro: 'おまえが主人だというなら、証明してみせろ',
      rowing: '弱い漕ぎ方だ。もっと力を込めろ',
      pain: 'くっ……まだだ、まだ倒れる訳にはいかない',
      sacrifice: '……この命、預けよう。使ってみせろ',
    },
  },
  {
    id: 5, name: '法王', englishName: 'The Hierophant', trait: '従順・道徳への服従',
    skill: '聖約（約束の力を最大化し信頼を盾にする）',
    weights: { O:1, C:5, E:2, A:5, N:1 }, alive: true, resonance: 0,
    motifNotes: [62, 65, 67, 70],
    dialogue: {
      intro: '道には定めがある。あなたの歩む先に、祝福があらんことを',
      rowing: '祈りながら漕ぎなさい。心が定まれば、体もついてくる',
      pain: '……苦難もまた、試練。耐えましょう',
      sacrifice: 'これが聖約の完成。あなたの旅に、導きあれ',
    },
  },
  {
    id: 6, name: '恋人', englishName: 'The Lovers', trait: '共感・感情的選択',
    skill: '共鳴（他者の感情と同調し深いつながりを結ぶ）',
    weights: { O:3, C:2, E:4, A:5, N:3 }, alive: true, resonance: 0,
    motifNotes: [64, 68, 71, 76],
    dialogue: {
      intro: '初めて会った気がしない。どこかで繋がっていたのかも',
      rowing: 'ねえ、今どんな気持ち？……わかる、わたしも怖い',
      pain: '痛い……でも、傍にいたい',
      sacrifice: '好きな人のために諦めるのは、つらいことじゃないよ',
    },
  },
  {
    id: 7, name: '戦車', englishName: 'The Chariot', trait: '意志力・競争心',
    skill: '突進（迷いを断ち切り障害を突破する）',
    weights: { O:2, C:5, E:5, A:2, N:2 }, alive: true, resonance: 0,
    motifNotes: [60, 62, 65, 67],
    dialogue: {
      intro: '止まることはない。おまえも止まるな',
      rowing: '前だ！漕ぐのをやめるな！',
      pain: 'この程度で俺は止まらない！',
      sacrifice: '最後まで走り続けた。後悔はない',
    },
  },
  {
    id: 8, name: '力', englishName: 'Strength', trait: '内的強さ・忍耐',
    skill: '制御（極限状態でも冷静に最善を選ぶ）',
    weights: { O:3, C:4, E:3, A:3, N:1 }, alive: true, resonance: 0,
    motifNotes: [60, 64, 67, 71],
    dialogue: {
      intro: '荒れていいよ。わたしが受け止めるから',
      rowing: '焦らないで。ゆっくりでも前には進んでる',
      pain: '……平気。まだ、大丈夫',
      sacrifice: 'あなたが折れないなら、わたしが柱でいい',
    },
  },
  {
    id: 9, name: '隠者', englishName: 'The Hermit', trait: '孤独・内向き思考',
    skill: '孤灯（一人の状況でのみ発揮される判断力）',
    weights: { O:5, C:3, E:1, A:2, N:3 }, alive: true, resonance: 0,
    motifNotes: [57, 60, 64, 65],
    dialogue: {
      intro: '……来たか。長い間、待っていた',
      rowing: '方向は正しい。信じて漕ぎ続けよ',
      pain: '……一人なら、もっと早かったかもしれん',
      sacrifice: '孤独に生き、孤独に逝く。それが隠者の道',
    },
  },
  {
    id: 10, name: '運命の輪', englishName: 'Wheel of Fortune', trait: '柔軟性・運命への委任',
    skill: '転換（不利な状況を逆手に取る）',
    weights: { O:4, C:1, E:3, A:3, N:4 }, alive: true, resonance: 0,
    motifNotes: [62, 65, 69, 62],
    dialogue: {
      intro: '出会いに偶然はないよ。これも輪の一部',
      rowing: '流れに乗れ。逆らっても疲れるだけだ',
      pain: '回転が……狂ってきた',
      sacrifice: '輪は回る。これもまた、通過点に過ぎない',
    },
  },
  {
    id: 11, name: '正義', englishName: 'Justice', trait: '公正さ・論理的判断',
    skill: '裁定（最も合理的な判断を下す）',
    weights: { O:2, C:5, E:2, A:4, N:1 }, alive: true, resonance: 0,
    motifNotes: [62, 66, 69, 74],
    dialogue: {
      intro: '公正に評価しよう。あなたが何者かを',
      rowing: '一定のリズムを保て。揺れるな',
      pain: '……誤差の範囲内だ',
      sacrifice: 'すべての選択には代償がある。これが、その均衡',
    },
  },
  {
    id: 12, name: '吊された男', englishName: 'The Hanged Man', trait: '自己犠牲・視点の逆転',
    skill: '捧げ（自己犠牲で他者を救う力を最大化する）',
    weights: { O:4, C:2, E:2, A:5, N:4 }, alive: true, resonance: 0,
    motifNotes: [72, 69, 65, 62],
    dialogue: {
      intro: '逆さから見ると、世界は違う形をしている',
      rowing: 'その苦しさは、きっと何かを変える',
      pain: '痛みが深いほど、見えてくるものがある',
      sacrifice: 'わたしが捧げられることで、あなたは次へ行ける。それが喜びだ',
    },
  },
  {
    id: 13, name: '死神', englishName: 'Death', trait: '変容・手放す力',
    skill: '転生（過去を手放し新たな局面を切り開く）',
    weights: { O:4, C:1, E:3, A:2, N:1 }, alive: true, resonance: 0,
    motifNotes: [60, 63, 66, 69],
    dialogue: {
      intro: '終わりが来ることを、恐れているか',
      rowing: '止まれば沈む。前へ',
      pain: '……これが終わりか？　いや、まだだ',
      sacrifice: '死は変容だ。悲しむな',
    },
  },
  {
    id: 14, name: '節制', englishName: 'Temperance', trait: 'バランス・調和',
    skill: '均衡（対立する要素を調整し最適解を見つける）',
    weights: { O:3, C:5, E:2, A:5, N:1 }, alive: true, resonance: 0,
    motifNotes: [60, 64, 67, 64],
    dialogue: {
      intro: '急がなくていい。バランスを崩さなければ、きっと辿り着く',
      rowing: '左右均等に。偏りが船を傾ける',
      pain: '……少し、均衡が崩れてきた',
      sacrifice: '何事も過不足なく。これで、ちょうどよかった',
    },
  },
  {
    id: 15, name: '悪魔', englishName: 'The Devil', trait: '欲望・執着・本能',
    skill: '誘惑（相手の欲や弱点を見抜き利用する）',
    weights: { O:3, C:1, E:4, A:1, N:5 }, alive: true, resonance: 0,
    motifNotes: [59, 62, 65, 68],
    dialogue: {
      intro: '契約しようか？　きっと、損はさせない',
      rowing: '漕ぎ続けろ。欲しいものは向こう岸にある',
      pain: 'くく……やってくれるじゃないか',
      sacrifice: '面白かったよ。また次の生で会おう',
    },
  },
  {
    id: 16, name: '塔', englishName: 'The Tower', trait: '破壊衝動・突破力',
    skill: '崩壊（停滞した状況を意図的に壊す）',
    weights: { O:4, C:1, E:5, A:1, N:4 }, alive: true, resonance: 0,
    motifNotes: [72, 67, 62, 55],
    dialogue: {
      intro: '壊さなければ始まらないこともある。俺はその力だ',
      rowing: '叩き割れ！波でも何でも！',
      pain: 'ぐあっ……いいぞ、もっと来い！',
      sacrifice: '崩れながら前へ進む。それが俺のやり方だ',
    },
  },
  {
    id: 17, name: '星', englishName: 'The Star', trait: '希望・理想主義',
    skill: '灯台（絶望的な状況でも希望を示す）',
    weights: { O:5, C:2, E:3, A:4, N:1 }, alive: true, resonance: 0,
    motifNotes: [64, 67, 71, 76],
    dialogue: {
      intro: '暗いほど、星は輝く。あなたの旅も、同じはずだよ',
      rowing: 'もう少しだよ。あの光を目指して',
      pain: '痛い……でも、消えないよ',
      sacrifice: '灯台は嵐の中でも消えない。わたしも、同じ',
    },
  },
  {
    id: 18, name: '月', englishName: 'The Moon', trait: '不安・幻想・曖昧さ',
    skill: '幻惑（相手の認識を歪め虚実の境界を曖昧にする）',
    weights: { O:5, C:1, E:2, A:3, N:5 }, alive: true, resonance: 0,
    motifNotes: [61, 64, 68, 71],
    dialogue: {
      intro: '……あなたが見えているものが、本当にそこにあるかは、わからない',
      rowing: '暗い水面を信じて。見えなくても、底はある',
      pain: '現実と夢が……混ざってくる',
      sacrifice: '夢から覚める時が来た。さようなら',
    },
  },
  {
    id: 19, name: '太陽', englishName: 'The Sun', trait: '楽観性・外向性',
    skill: '輝照（周囲のモラルを高め行動力を引き出す）',
    weights: { O:3, C:3, E:5, A:4, N:1 }, alive: true, resonance: 0,
    motifNotes: [67, 71, 74, 79],
    dialogue: {
      intro: 'やあ！一緒に行こう！絶対うまくいくよ！',
      rowing: 'もっと元気に！笑いながら漕いで！',
      pain: 'うっ……でも、まだ笑えるよ！',
      sacrifice: 'みんなを照らせたなら、それでよかった！',
    },
  },
  {
    id: 20, name: '審判', englishName: 'Judgement', trait: '自己評価・責任感',
    skill: '覚醒（過去の選択の意味を把握し最善手を導く）',
    weights: { O:3, C:5, E:3, A:3, N:3 }, alive: true, resonance: 0,
    motifNotes: [65, 69, 72, 77],
    dialogue: {
      intro: '過去の選択が、今のあなたを作っている。覚悟はあるか',
      rowing: '一漕ぎ一漕ぎが、判決を積み上げる',
      pain: '……審かれる側になるとは',
      sacrifice: '審判は下された。わたしは受け入れる',
    },
  },
  {
    id: 21, name: '世界', englishName: 'The World', trait: '統合・完全性',
    skill: '全知（あらゆる状況で最適な対応を選べる適応力）',
    weights: { O:4, C:4, E:4, A:4, N:2 }, alive: true, resonance: 0,
    motifNotes: [60, 64, 67, 71, 74],
    dialogue: {
      intro: 'ここに至るまでの全てが、あなたを作ってきた',
      rowing: '全ての力を合わせれば、届かない場所はない',
      pain: '……統合が、乱れていく',
      sacrifice: '旅の終わりは、新しい始まりだ。あなたの世界を、完成させて',
    },
  },
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
