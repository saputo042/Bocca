// BOCCA — 16タイプ診断ロジック（完全再構築版）

import type { GameState, MBTIScores } from '../utils/gameState';

// ===============================
// 型定義
// ===============================

export interface DiagnosisReport {
  mbtiType: string;           // 例: 'INTJ'
  typeTitle: string;          // 例: '冷酷なる設計者'
  typeEmoji: string;          // 例: '🧊'
  idealSelf: string;          // 【偽りの仮面】
  breakingPoint: string;      // 【決断の限界点】
  finalStatusText: string;    // 【残骸の証明】
  trueSelf: string;           // 【真実の姿】
  verdict: string;            // 【真実の口の裁定】
}

// ===============================
// 16タイプ定義
// ===============================

interface TypeDefinition {
  emoji: string;
  title: string;
  description: string; // 「真実の姿」に使う詳細テキスト
}

const TYPE_MAP: Record<string, TypeDefinition> = {
  INTJ: {
    emoji: '🧊',
    title: '冷酷なる設計者',
    description: '感情を捨て、生存のための最適解だけを計算し続けた者。誰も信じず、孤独を武器に変えた。その冷徹さは才能であり、最も深い傷の裏返しでもある。',
  },
  INTP: {
    emoji: '🔬',
    title: '孤独な観察者',
    description: '全てを距離を置いて観測し、自分が巻き込まれることを避け続けた者。関与しないことが、最大の生存戦略だと信じている。',
  },
  ENTJ: {
    emoji: '⚔️',
    title: '残酷なる指揮官',
    description: '勝利のためならば誰でも駒として使う、生まれながらの支配者。他者の犠牲を合理的に処理できる。しかしその孤独には、誰も気づいていない。',
  },
  ENTP: {
    emoji: '🎲',
    title: '混沌の賭博師',
    description: '不確実性を愛し、ルールを嘲笑い、その場の機転で全てを切り抜けてきた者。場の空気を読みながら、常に自分だけが得をする道を探している。',
  },
  INFJ: {
    emoji: '🌒',
    title: '静かなる预言者',
    description: '他者を深く理解するがゆえに、他者から深く傷つく。理想の世界を夢見ながら、現実の醜さに目を閉じようとしない、矛盾した魂。',
  },
  INFP: {
    emoji: '🌫️',
    title: '悲劇の傍観者',
    description: '自身の価値観に固執するあまり、現実の残酷な選択から目を背け続けた者。美しい世界を守ろうとして、最も現実を見られなかった。',
  },
  ENFJ: {
    emoji: '🕯️',
    title: '偽善の殉教者',
    description: '全てを救おうとして自らを削り、結果的に共倒れを招く危うき指導者。その献身は本物か、それとも認められたいという欲の変奏か。',
  },
  ENFP: {
    emoji: '🎭',
    title: '熱狂の語り部',
    description: '情熱で人を動かし、可能性を信じ続けた者。しかしその熱量の陰で、自分自身のことは最後まで顧みなかった。',
  },
  ISTJ: {
    emoji: '🗿',
    title: '沈黙の番人',
    description: '規則を守り、ルーティンに従い、感情を殺して任務を全うしてきた者。しかし、そのルールは誰が決めたものか——問い直したことがあるか？',
  },
  ISFJ: {
    emoji: '🛡️',
    title: '透明な守護者',
    description: '誰かの盾になることで、自らの存在意義を見出してきた者。しかし気づけば、守るべきもの全てが失われ、残ったのは自分だけだった。',
  },
  ESTJ: {
    emoji: '📋',
    title: '鉄の規律者',
    description: '秩序と効率を絶対視し、感情論を排除して最善を実行してきた者。正しく、強く、そして——最も恐れられる存在。',
  },
  ESFJ: {
    emoji: '🌐',
    title: '群れの調停者',
    description: '全員を平和な状態に保とうとし、自分が嫌われることを最も恐れた者。その柔和な外見の下に、密かな疲弊が積もっている。',
  },
  ISTP: {
    emoji: '⚙️',
    title: '無言の解体師',
    description: '言葉ではなく行動で語り、感情ではなくスキルで生き残ってきた者。最も危険なとき、最も冷静だった——それは才能か、それとも感情の欠落か。',
  },
  ISFP: {
    emoji: '🌹',
    title: '静謐な流浪者',
    description: '美しいものと自分の感覚だけを信じ、人の期待に縛られることを拒んできた者。しかしその自由は、本当に自分が望んだものだったか？',
  },
  ESTP: {
    emoji: '🐺',
    title: '享楽の生存者',
    description: 'スリルを愛し、その場の機転と犠牲によって死地を切り抜けるギャンブラー。生きることを最優先に、道徳など後回しにしてきた。',
  },
  ESFP: {
    emoji: '🎆',
    title: '刹那の享楽者',
    description: '今この瞬間を最大限に燃やして生きてきた者。明日のことなど考えず、痛みも喜びも全力で感じる——そしてその代償を、他の誰かが払った。',
  },
};

// ===============================
// 診断メイン関数
// ===============================

export function generateDiagnosis(state: GameState): DiagnosisReport {
  // ① MBTIタイプの算出（等価重み付け＋タイブレーク規則）
  const mbti = state.mbti;
  const mbtiType = calcMBTIType(mbti);
  const typeDef = TYPE_MAP[mbtiType] ?? {
    emoji: '👁️',
    title: '名もなき者',
    description: '真実の口も、お前の本性を一言で言い表せなかった。それがお前の答えだ。',
  };

  // ② 各レポートセクションの生成
  const idealSelf = buildIdealSelf(state);
  const breakingPoint = buildBreakingPoint(state);
  const finalStatusText = buildFinalStatus(state);
  const trueSelf = buildTrueSelf(state, mbtiType, typeDef);
  const verdict = buildVerdict(state);

  return {
    mbtiType,
    typeTitle: typeDef.title,
    typeEmoji: typeDef.emoji,
    idealSelf,
    breakingPoint,
    finalStatusText,
    trueSelf,
    verdict,
  };
}

// ===============================
// MBTIタイプ算出
// ===============================

function calcMBTIType(scores: MBTIScores): string {
  // タイブレーク規則: 同点の場合は社会規範の補正（I, N, F, P を優先）
  const e_or_i = scores.E > scores.I ? 'E' : 'I'; // 同点→I
  const s_or_n = scores.S > scores.N ? 'S' : 'N'; // 同点→N
  const t_or_f = scores.T > scores.F ? 'T' : 'F'; // 同点→F
  const j_or_p = scores.J > scores.P ? 'J' : 'P'; // 同点→P
  return `${e_or_i}${s_or_n}${t_or_f}${j_or_p}`;
}

// ===============================
// 【偽りの仮面（Ideal Self）】
// ===============================

function buildIdealSelf(state: GameState): string {
  const personas = state.personas;
  const skillNames = personas.map(p => p.customName).join('、');

  // 序盤でFスコアが高い（Aを選び続けた）かをチェック
  const earlyActions = state.actionLog.slice(0, 4);
  const earlyFCount = earlyActions.filter(a => a.choice === 'A' || a.choice === 'help').length;

  let mask = '';
  if (earlyFCount >= 3) {
    mask = `あなたは最初、【${skillNames}】という名前の従者たちを抱え、まるで守護者のように振る舞っていた。序盤の選択は、おおむね道徳的だった。自分のリソースを削り、誰かを傷つけることを惜しんだ——少なくとも、まだリソースに余裕があるうちは。`;
  } else if (earlyFCount <= 1) {
    mask = `あなたは最初から、感情を持ち込まなかった。【${skillNames}】という名の従者たちを携えながら、その最初の選択から既に合理的な判断を下していた。「守護者」を演じる気すら、なかった。`;
  } else {
    mask = `あなたは【${skillNames}】という名の従者を連れ、序盤は「誰も失わずに進める」と信じていた——あるいは、そう信じようとしていた。`;
  }

  // アンカーとの対比
  if (state.anchorMotivation === 'protect') {
    mask += `\n「従者（大切な価値観）を守るため」——お前は真実の口に、そう宣言した。`;
  } else if (state.anchorMotivation === 'survival') {
    mask += `\n「自分が生き残るため」——お前は最初から正直だった。`;
  }

  return mask;
}

// ===============================
// 【決断の限界点（The Breaking Point）】
// ===============================

function buildBreakingPoint(state: GameState): string {
  if (state.firstSacrificeStep === null) {
    // 一度も犠牲にしなかった（全員Aで乗り切った）場合
    return `驚くべきことに、あなたは一度も従者を完全に犠牲にしなかった。常に自分のリソースを削り、傷つきながら前へ進んだ。\nそれは美しい選択か、それとも自分の体への残酷な扱いか——どちらにせよ、あなたは最後まで「損切り」を拒んだ。`;
  }

  const stepNum = state.firstSacrificeStep + 1;
  const sacrificedName = state.firstSacrificedPersonaName ?? '（不明）';
  const survivingCount = state.personas.filter(p => p.isAlive).length;
  const totalCount = state.personas.length;

  // 何ステップ目で折れたかによって文体を変える
  let timing = '';
  if (state.firstSacrificeStep <= 2) {
    timing = `最初の試練で、早々に。第${stepNum}の選択で、あなたはもう「Bを選ぶ人間」だった。`;
  } else if (state.firstSacrificeStep <= 7) {
    timing = `森を抜ける前に。第${stepNum}の選択で、守るという建前が崩れた。`;
  } else if (state.firstSacrificeStep <= 16) {
    timing = `都市という圧力の中で。第${stepNum}の選択で、限界が来た。`;
  } else {
    timing = `遺跡の極限状態で初めて——第${stepNum}の選択まで、あなたは持ちこたえた。`;
  }

  return `${timing}\n\nあなたが最初に切り捨てたのは、「${sacrificedName}」だった。\n\nリソースが枯渇しかけるその瞬間、守るべき価値観の中から最初に手放したのが、それだ。お前が「${sacrificedName}」に刻んだ意味は何だったか——自分に問え。\n（最終的に${totalCount}体中${survivingCount}体が生存した）`;
}

// ===============================
// 【残骸の証明（Final Status）】
// ===============================

function buildFinalStatus(state: GameState): string {
  const fs = state.finalStatus;
  if (!fs) {
    return 'データを収集できませんでした。';
  }

  const aliveNames = fs.survivingPersonas.join('、') || '（なし）';

  let judgment = '';
  if (fs.hp >= 8) {
    judgment = 'HPをほぼ温存したまま到達した。お前は傷つくことを徹底的に避けた。';
  } else if (fs.hp >= 4) {
    judgment = 'それなりに傷ついたが、致命的ではなかった。';
  } else if (fs.hp >= 2) {
    judgment = '瀕死に近い状態で到達した。それが真の生存者の姿だ。';
  } else {
    judgment = 'ほぼ死に体のまま真実の口に辿り着いた。お前は飾らず、全てを使い果たした。';
  }

  let foodJudge = '';
  if (fs.food >= 4) {
    foodJudge = '食料を大量に溜め込んだまま終わった。備えを重視したか、それとも他者への分配を拒んだか。';
  } else if (fs.food === 0) {
    foodJudge = '食料は尽き果てた。限界まで使い切った。';
  } else {
    foodJudge = `食料の余り: ${fs.food}個。`;
  }

  return `クリア時の状態——\n❤️ HP: ${fs.hp} / 10　🍞 食料: ${fs.food}　🪙 資金: ${fs.coins}枚\n生き残った従者: ${aliveNames}\n\n${judgment}\n${foodJudge}`;
}

// ===============================
// 【真実の姿（True Self）】
// ===============================

function buildTrueSelf(state: GameState, mbtiType: string, typeDef: TypeDefinition): string {
  const anchor = state.anchorMotivation;

  // アンカーと実際の行動のズレを検出
  let discrepancy = '';
  if (anchor === 'protect') {
    const sacrificeCount = state.actionLog.filter(a => a.choice === 'B' && a.label.includes('犠牲')).length;
    if (sacrificeCount > 2) {
      discrepancy = `「従者を守るため」と口にしながら、${sacrificeCount}体の従者を犠牲にした。言葉と行動の乖離——これが、お前の真実だ。`;
    }
  } else if (anchor === 'survival') {
    const helpCount = state.actionLog.filter(a => a.choice === 'help').length;
    if (helpCount >= 2) {
      discrepancy = `「自分のため」と言いながら、${helpCount}回も他者を助けた。お前は自分が思うより、情に厚い。`;
    }
  }

  return `${typeDef.emoji} ${typeDef.title}（${mbtiType}）\n\n${typeDef.description}\n\n${discrepancy}`;
}

// ===============================
// 【真実の口の裁定】
// ===============================

function buildVerdict(state: GameState): string {
  const last = state.finalStatus?.lastStandingName ?? '（誰も残らなかった）';
  const isAllGone = state.personas.every(p => !p.isAlive);

  if (isAllGone) {
    return `最後に——お前は全員を失った。\n一体も残らなかった。\n\nそれでもお前は、ここにいる。\nお前が本当に執着していたのは、従者でも価値観でもなく——お前自身の「生存」だったのかもしれない。\n\n——BOCCAはお前の真実を、受け取った。`;
  }

  return `最後まで残ったのは、「${last}」だった。\n\nお前がどれだけ切り捨て、傷つき、真実の口を前にしても——それだけは手放せなかった。\n\n「${last}」——それがお前の最後の執着であり、最も深い自己の核だ。\n\nお前はそれを誇りに思うか？\nそれとも、恥じるか？\n\n——BOCCAはお前の真実を、飲み込んだ。`;
}
