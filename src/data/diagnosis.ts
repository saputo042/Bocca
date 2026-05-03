// BOCCA — 診断エンジン v2（5軸モデル + MBTIマッピング）

import type { GameState, DiagnosisScores } from '../utils/gameState';

// ===============================
// 型定義
// ===============================

export interface DiagnosisReport {
  mbtiType: string;
  typeTitle: string;
  typeEmoji: string;
  idealSelf: string;
  breakingPoint: string;
  fightingStyle: string;     // NEW: バトルスタイル分析
  expectationGap: string;    // NEW: 期待と現実のズレ分析
  finalStatusText: string;
  trueSelf: string;
  verdict: string;
  diagScores: DiagnosisScores; // レーダーチャート用
}

interface TypeDefinition {
  emoji: string;
  title: string;
  description: string;
}

// ===============================
// 5軸 → MBTIマッピング
// ===============================

function calcMBTIType(s: DiagnosisScores): string {
  // rational: 高→T、低→F
  const tf = s.rational >= 0 ? 'T' : 'F';
  // risk: 高→P+E、低→J+I
  const jp = s.risk >= 0 ? 'P' : 'J';
  // social: 高→E、低→I
  const ei = s.social >= 0 ? 'E' : 'I';
  // selfpreserve: 高→S（具体的・現実的）、低→N（抽象的・理想的）
  const sn = s.selfpreserve >= 0 ? 'S' : 'N';
  return `${ei}${sn}${tf}${jp}`;
}

const TYPE_MAP: Record<string, TypeDefinition> = {
  INTJ: { emoji: '🧊', title: '冷酷なる設計者', description: '感情を捨て、生存のための最適解だけを計算し続けた者。誰も信じず、孤独を武器に変えた。その冷徹さは才能であり、最も深い傷の裏返しでもある。' },
  INTP: { emoji: '🔬', title: '孤独な観察者', description: '全てを距離を置いて観測し、自分が巻き込まれることを避け続けた者。関与しないことが、最大の生存戦略だと信じている。' },
  ENTJ: { emoji: '⚔️', title: '残酷なる指揮官', description: '勝利のためならば誰でも駒として使う、生まれながらの支配者。他者の犠牲を合理的に処理できる。しかしその孤独には、誰も気づいていない。' },
  ENTP: { emoji: '🎲', title: '混沌の賭博師', description: '不確実性を愛し、ルールを嘲笑い、その場の機転で全てを切り抜けてきた者。場の空気を読みながら、常に自分だけが得をする道を探している。' },
  INFJ: { emoji: '🌒', title: '静かなる预言者', description: '他者を深く理解するがゆえに、他者から深く傷つく。理想の世界を夢見ながら、現実の醜さに目を閉じようとしない、矛盾した魂。' },
  INFP: { emoji: '🌫️', title: '悲劇の傍観者', description: '自身の価値観に固執するあまり、現実の残酷な選択から目を背け続けた者。美しい世界を守ろうとして、最も現実を見られなかった。' },
  ENFJ: { emoji: '🕯️', title: '偽善の殉教者', description: '全てを救おうとして自らを削り、結果的に共倒れを招く危うき指導者。その献身は本物か、それとも認められたいという欲の変奏か。' },
  ENFP: { emoji: '🎭', title: '熱狂の語り部', description: '情熱で人を動かし、可能性を信じ続けた者。しかしその熱量の陰で、自分自身のことは最後まで顧みなかった。' },
  ISTJ: { emoji: '🗿', title: '沈黙の番人', description: '規則を守り、ルーティンに従い、感情を殺して任務を全うしてきた者。しかし、そのルールは誰が決めたものか——問い直したことがあるか？' },
  ISFJ: { emoji: '🛡️', title: '透明な守護者', description: '誰かの盾になることで、自らの存在意義を見出してきた者。しかし気づけば、守るべきもの全てが失われ、残ったのは自分だけだった。' },
  ESTJ: { emoji: '📋', title: '鉄の規律者', description: '秩序と効率を絶対視し、感情論を排除して最善を実行してきた者。正しく、強く、そして——最も恐れられる存在。' },
  ESFJ: { emoji: '🌐', title: '群れの調停者', description: '全員を平和な状態に保とうとし、自分が嫌われることを最も恐れた者。その柔和な外見の下に、密かな疲弊が積もっている。' },
  ISTP: { emoji: '⚙️', title: '無言の解体師', description: '言葉ではなく行動で語り、感情ではなくスキルで生き残ってきた者。最も危険なとき、最も冷静だった——それは才能か、それとも感情の欠落か。' },
  ISFP: { emoji: '🌹', title: '静謐な流浪者', description: '美しいものと自分の感覚だけを信じ、人の期待に縛られることを拒んできた者。しかしその自由は、本当に自分が望んだものだったか？' },
  ESTP: { emoji: '🐺', title: '享楽の生存者', description: 'スリルを愛し、その場の機転と犠牲によって死地を切り抜けるギャンブラー。生きることを最優先に、道徳など後回しにしてきた。' },
  ESFP: { emoji: '🎆', title: '刹那の享楽者', description: '今この瞬間を最大限に燃やして生きてきた者。明日のことなど考えず、痛みも喜びも全力で感じる——そしてその代償を、他の誰かが払った。' },
};

// ===============================
// メイン診断関数
// ===============================

export function generateDiagnosis(state: GameState): DiagnosisReport {
  const mbtiType = calcMBTIType(state.diagScores);
  const typeDef = TYPE_MAP[mbtiType] ?? {
    emoji: '👁️',
    title: '名もなき者',
    description: '真実の口も、お前の本性を一言で言い表せなかった。それがお前の答えだ。',
  };

  return {
    mbtiType,
    typeTitle: typeDef.title,
    typeEmoji: typeDef.emoji,
    idealSelf: buildIdealSelf(state),
    breakingPoint: buildBreakingPoint(state),
    fightingStyle: buildFightingStyle(state),
    expectationGap: buildExpectationGap(state),
    finalStatusText: buildFinalStatus(state),
    trueSelf: buildTrueSelf(state, mbtiType, typeDef),
    verdict: buildVerdict(state),
    diagScores: state.diagScores,
  };
}

// ===============================
// 【偽りの仮面】
// ===============================
function buildIdealSelf(state: GameState): string {
  const skillNames = state.personas.map(p => p.customName).join('、');
  const earlyA = state.actionLog.slice(0, 3).filter(a => a.choice === 'A' || a.choice === 'help').length;

  let mask = earlyA >= 2
    ? `あなたは最初、【${skillNames}】という名の従者たちを抱え、まるで守護者のように振る舞っていた。序盤の選択は、おおむね道徳的だった——少なくとも、まだリソースに余裕があるうちは。`
    : earlyA === 0
    ? `あなたは最初から、感情を持ち込まなかった。【${skillNames}】という名の従者たちを携えながら、その最初の選択から既に合理的な判断を下していた。`
    : `あなたは【${skillNames}】という名の従者を連れ、序盤は「誰も失わずに進める」と信じていた——あるいは、そう信じようとしていた。`;

  if (state.anchorMotivation === 'protect') {
    mask += `\n「従者（大切な価値観）を守るため」——お前は真実の口に、そう宣言した。`;
  } else if (state.anchorMotivation === 'survival') {
    mask += `\n「自分が生き残るため」——お前は最初から正直だった。`;
  }
  return mask;
}

// ===============================
// 【決断の限界点】
// ===============================
function buildBreakingPoint(state: GameState): string {
  if (state.firstSacrificeStep === null) {
    return `驚くべきことに、あなたは一度も従者を完全に犠牲にしなかった。常に自分のリソースを削り、傷つきながら前へ進んだ。\nそれは美しい選択か、それとも自分の体への残酷な扱いか——どちらにせよ、あなたは最後まで「損切り」を拒んだ。`;
  }

  const stepNum = state.firstSacrificeStep + 1;
  const name = state.firstSacrificedPersonaName ?? '（不明）';
  const surviving = state.personas.filter(p => p.isAlive).length;

  // ドラッグの躊躇データを確認
  const dragData = state.dragLog.find(d => d.eventId === state.firstSacrificeStep);
  let hesitationText = '';
  if (dragData) {
    if (dragData.cancellations > 0) {
      hesitationText = `\n\n——興味深いことに、あなたは${dragData.cancellations}回躊躇した。最初に選んだのは「${dragData.firstTargetName}」だったが、最終的に「${name}」を選んだ。`;
    } else if (dragData.switched) {
      hesitationText = `\n\n——最初に別の従者を選びかけたが、最終的に「${name}」に切り替えた。`;
    } else {
      hesitationText = `\n\n——迷わなかった。「${name}」を選ぶまでに、一切の躊躇はなかった。`;
    }
  }

  const timing = stepNum <= 2 ? `最初の試練で、早々に。第${stepNum}の選択で、あなたはもう「切り捨てる人間」だった。`
    : stepNum <= 4 ? `森を抜ける前に。第${stepNum}の選択で、守るという建前が崩れた。`
    : stepNum <= 7 ? `都市という圧力の中で。第${stepNum}の選択で、限界が来た。`
    : `遺跡の極限状態で初めて——第${stepNum}の選択まで、あなたは持ちこたえた。`;

  return `${timing}\n\nあなたが最初に切り捨てたのは、「${name}」だった。${hesitationText}\n\n（最終的に${state.personas.length}体中${surviving}体が生存した）`;
}

// ===============================
// 【戦い方が語るもの】NEW
// ===============================
function buildFightingStyle(state: GameState): string {
  if (state.battleLog.length === 0) {
    return 'あなたはすべての戦いを回避した。戦うことそのものを選ばなかった——それは臆病さか、合理的な判断か。';
  }

  const firstCommands = state.battleLog.map(b => b.firstCommand);
  const attackCount = firstCommands.filter(c => c === 'attack' || c === 'skill').length;
  const fleeCount = firstCommands.filter(c => c === 'flee').length;
  const defendCount = firstCommands.filter(c => c === 'defend').length;

  // 誰のスキルを最も多く使ったか
  const skillUsage: Record<string, number> = {};
  state.battleLog.forEach(b => {
    b.turns.forEach(t => {
      if (t.servantUsed) skillUsage[t.servantUsed] = (skillUsage[t.servantUsed] || 0) + 1;
    });
  });
  const mostTrusted = Object.entries(skillUsage).sort((a, b) => b[1] - a[1])[0];

  let style = '';
  if (attackCount >= state.battleLog.length * 0.7) {
    style = '戦闘において、あなたは一貫して攻撃を選んだ。最初のターンに前に出ることを恐れない——リスクを承知で踏み込むその姿勢は、接近志向の強さを示している。';
  } else if (fleeCount >= state.battleLog.length * 0.5) {
    style = '戦闘において、あなたは逃げることをためらわなかった。「撤退も戦略のうち」——その判断は合理的だが、リスクを避け続けるパターンが見える。';
  } else if (defendCount >= state.battleLog.length * 0.4) {
    style = '戦闘において、あなたは防御を優先した。まず身を守り、状況を見極めてから動く——慎重さとも、恐れとも取れる選択だ。';
  } else {
    style = '戦闘において、あなたの行動は一定のパターンを持たなかった。状況に応じて柔軟に変えるのか、それとも判断軸がまだ定まっていないのか。';
  }

  if (mostTrusted) {
    style += `\n\n戦闘で最も頼りにしたのは、「${mostTrusted[0]}」だった。その名を持つ力に、あなたは繰り返し手を伸ばした。`;
  }
  return style;
}

// ===============================
// 【期待と現実のズレ】NEW
// ===============================
function buildExpectationGap(state: GameState): string {
  if (state.emotionLog.length === 0) {
    return 'あなたの感情的な反応についてのデータが十分に集まらなかった。';
  }

  const regretCount = state.emotionLog.filter(e => e.emotionChoice === 'regret').length;
  const numbCount = state.emotionLog.filter(e => e.emotionChoice === 'numb').length;
  const expectedCount = state.emotionLog.filter(e => e.emotionChoice === 'expected').length;
  const guiltyCount = state.emotionLog.filter(e => e.emotionChoice === 'guiltyButRight').length;
  const total = state.emotionLog.length;

  // アンカーとの矛盾チェック
  const sacrificeEmotionLogs = state.emotionLog.filter(e =>
    state.actionLog.find(a => a.step === e.eventId && a.choice === 'B')
  );
  const regretAfterSacrifice = sacrificeEmotionLogs.filter(e => e.emotionChoice === 'regret').length;
  const numbAfterSacrifice = sacrificeEmotionLogs.filter(e => e.emotionChoice === 'numb').length;

  let text = '';
  if (regretCount >= total * 0.5) {
    text = `あなたは行動の後、繰り返し「後悔」を感じた（${regretCount}/${total}回）。選択の瞬間と、その結果を見た後の感情の間に、常にズレがあった——それは共感能力の高さか、それとも自分の本音と乖離した選択を重ねていたことの証か。`;
  } else if (numbCount >= total * 0.5) {
    text = `あなたは行動の後、「何も感じない」を選び続けた（${numbCount}/${total}回）。これは感情の抑圧か、それとも本当に何も動じなかったのか。どちらにせよ、感情への入り口を閉じ続ける何かが、あなたの中にある。`;
  } else if (expectedCount >= total * 0.5) {
    text = `あなたの選択は、ほぼ常に「予想通り」の結果をもたらした（${expectedCount}/${total}回）。あるいは、どんな結果も「予想通りだった」と解釈する——認知的一貫性を保つための、無意識の防衛か。`;
  } else if (guiltyCount >= total * 0.4) {
    text = `あなたは行動の後、「心が痛むが正しかった」を選ぶことが多かった（${guiltyCount}/${total}回）。罪悪感を感じながらも行動を正当化し続けた——その二重性こそ、あなたの最も複雑な部分だ。`;
  } else {
    text = `あなたの感情的な反応は、状況によって大きく揺れた。一定のパターンを持たない——それは感受性の豊かさか、あるいは自分の感情の行方を自分でも把握できていないことの表れか。`;
  }

  if (regretAfterSacrifice > 0 && state.anchorMotivation === 'protect') {
    text += `\n\n「従者を守るため」と宣言しながら、従者を犠牲にした後に「後悔した」回数: ${regretAfterSacrifice}回。言葉と行動と感情が、三者三様に食い違っている。`;
  }
  if (numbAfterSacrifice > 0 && state.anchorMotivation === 'protect') {
    text += `\n\n「守るため」と言いながら、誰かを犠牲にした後に「何も感じなかった」——その矛盾を、あなた自身は気づいているか？`;
  }
  return text;
}

// ===============================
// 【残骸の証明】
// ===============================
function buildFinalStatus(state: GameState): string {
  const fs = state.finalStatus;
  if (!fs) return 'データを収集できませんでした。';

  const aliveNames = fs.survivingPersonas.join('、') || '（なし）';
  const hpJudge = fs.hp >= 8 ? 'HPをほぼ温存したまま到達した。お前は傷つくことを徹底的に避けた。'
    : fs.hp >= 4 ? 'それなりに傷ついたが、致命的ではなかった。'
    : fs.hp >= 2 ? '瀕死に近い状態で到達した。それが真の生存者の姿だ。'
    : 'ほぼ死に体のまま真実の口に辿り着いた。お前は全てを使い果たした。';

  const foodJudge = fs.food >= 4 ? '食料を大量に溜め込んだまま終わった。備えを重視したか、他者への分配を拒んだか。'
    : fs.food === 0 ? '食料は尽き果てた。限界まで使い切った。'
    : `食料の余り: ${fs.food}個。`;

  return `クリア時の状態——\n❤️ HP: ${fs.hp}/10　🍞 食料: ${fs.food}　🪙 資金: ${fs.coins}枚\n生き残った従者: ${aliveNames}\n\n${hpJudge}\n${foodJudge}`;
}

// ===============================
// 【真実の姿】
// ===============================
function buildTrueSelf(state: GameState, mbtiType: string, typeDef: TypeDefinition): string {
  const s = state.diagScores;
  const axes = [
    s.rational > 2 ? '徹底した合理主義者' : s.rational < -2 ? '感情に動かされる共感者' : '感情と論理のバランサー',
    s.risk > 2 ? 'リスクを厭わない挑戦者' : s.risk < -2 ? '安全を優先する慎重派' : 'リスクを見極める現実家',
    s.social > 2 ? '他者との繋がりを重視する協調型' : s.social < -2 ? '自律を尊ぶ孤独型' : '状況次第で動く適応型',
  ].join('、');

  return `${typeDef.emoji} ${typeDef.title}（${mbtiType}）\n\n${typeDef.description}\n\n5軸が示す傾向: ${axes}。`;
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
