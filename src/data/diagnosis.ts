// BOCCA 診断システム・料理ペアリングデータ

export interface DiagnosisResult {
  layer1: {
    title: string;        // 表層の顔
    description: string;
  };
  layer2: {
    title: string;        // 中層の傷
    description: string;
  };
  layer3: {
    title: string;        // 深層の本質
    description: string;
  };
  overall: string;        // 総合診断コメント
  foodPairing: FoodPairing;
}

export interface FoodPairing {
  name: string;           // 料理名
  description: string;    // 料理の説明
  reason: string;         // なぜあなたにこの料理か
  imageMood: string;      // 画像の雰囲気キーワード（for AI生成）
  color: string;          // テーマカラー
  emoji: string;
}

// アーキタイプの組み合わせによる診断マッピング
// 選択されたペルソナの sacrifice 履歴と最後に残ったペルソナから生成する

export interface GameState {
  selectedPersonas: string[];      // 最初に選んだペルソナID
  sacrificeHistory: SacrificeRecord[];  // 各ターンの犠牲記録
  lastStanding: string;            // 最後に残ったペルソナ
  totalTurns: number;
  fearScore: number;               // 恐怖スコア（0-100）
  selfScore: number;               // 自己中心スコア（0-100）
  sacrificeSpeed: number[];        // 各ターンの選択速度（ms）
}

export interface SacrificeRecord {
  turn: number;
  sacrificed: string;              // 犠牲にしたペルソナID
  remaining: string[];             // 残ったペルソナID
  prompt: string;                  // その時の問い
  decisionTimeMs: number;          // 決断にかかった時間
}

// 診断生成関数
export function generateDiagnosis(state: GameState): DiagnosisResult {
  const { sacrificeHistory, lastStanding, fearScore, selfScore } = state;

  // 犠牲にしたペルソナのタイプを分析
  const sacrificedIds = sacrificeHistory.map(r => r.sacrificed);
  const avgDecisionTime = sacrificeHistory.reduce((sum, r) => sum + r.decisionTimeMs, 0) / sacrificeHistory.length;

  // Layer1: 決断の早さから「表層の顔」を判定
  const layer1 = getLayer1(avgDecisionTime, selfScore);

  // Layer2: 何を最初に差し出したかから「中層の傷」を判定
  const firstSacrificed = sacrificedIds[0] || '';
  const layer2 = getLayer2(firstSacrificed, fearScore);

  // Layer3: 最後に守ったペルソナから「深層の本質」を判定
  const layer3 = getLayer3(lastStanding);

  // 料理ペアリング
  const foodPairing = getFoodPairing(lastStanding, fearScore, selfScore);

  return {
    layer1,
    layer2,
    layer3,
    overall: generateOverallComment(lastStanding, fearScore, selfScore, avgDecisionTime),
    foodPairing,
  };
}

function getLayer1(avgDecisionTimeMs: number, _selfScore: number): { title: string; description: string } {
  if (avgDecisionTimeMs < 3000) {
    return {
      title: '即決する仮面',
      description: '素早い決断の裏に、考えることを恐れる何かが潜んでいる。あなたは速さで不安を隠す。',
    };
  } else if (avgDecisionTimeMs < 8000) {
    return {
      title: '天秤を持つ者',
      description: '慎重に、でも確実に。あなたは損得を計算してから動く。感情は後回しにしてきた。',
    };
  } else {
    return {
      title: '迷い続ける者',
      description: '長い沈黙の後に選ぶ。それはあなたが深く感じているからか、決められないでいるからか。',
    };
  }
}

function getLayer2(firstSacrificedId: string, fearScore: number): { title: string; description: string } {
  const fearful = fearScore > 60;

  const map: Record<string, { title: string; description: string }> = {
    sovereign: {
      title: '権力への嫌悪',
      description: '支配者を最初に差し出した。あなたの内側に、コントロールへの深い抵抗がある。',
    },
    wanderer: {
      title: '自由への恐怖',
      description: '放浪者を手放した。根のない自由が怖かったのか、それとも羨ましかったのか。',
    },
    oracle: {
      title: '真実からの逃走',
      description: '預言者を捨てた。見えすぎることへの恐怖——あなたは本当のことを知りたくない時がある。',
    },
    martyr: {
      title: '献身への罪悪感',
      description: '殉教者を選んだ。自己犠牲に価値を見出せないか、見出しすぎるかのどちらかだ。',
    },
    trickster: {
      title: '笑いの下の傷',
      description: '道化師を差し出した。笑いで何かを隠すことに、違和感を感じているのかもしれない。',
    },
    phantom: {
      title: '透明であることの痛み',
      description: '幻影を手放した。見えないことに慣れすぎた誰かへの、静かな怒りかもしれない。',
    },
    destroyer: {
      title: '衝動への戸惑い',
      description: '破壊者を真っ先に切り捨てた。あなたの中の破壊衝動を、認めたくないのだろうか。',
    },
    architect: {
      title: '支配構造からの解放',
      description: '設計者を捨てた。完璧なシステムに縛られることへの、静かな反乱。',
    },
    child: {
      title: '幼さへの決別',
      description: '永遠の子供を最初に手放した。無邪気さへの訣別——それはいつ決意したのか。',
    },
    guardian: {
      title: '守護への疲弊',
      description: '番人を差し出した。誰かを守り続けることへの、隠れた疲れが見える。',
    },
    lover: {
      title: '愛することへの諦め',
      description: '恋慕者を手放した。深く愛することを、もうやめようとしているのかもしれない。',
    },
    alchemist: {
      title: '変容への絶望',
      description: '錬金術師を捨てた。変われるという信念に、ひびが入った瞬間があったはずだ。',
    },
  };

  return map[firstSacrificedId] || {
    title: fearful ? '恐怖が動かした手' : '理性が動かした手',
    description: fearful
      ? '最初の選択は恐怖によって引き起こされた。あなたは脅えながら、それを決断と呼んでいた。'
      : 'あなたの最初の選択は冷静だった。感情を殺すことに、慣れすぎているのかもしれない。',
  };
}

function getLayer3(lastStandingId: string): { title: string; description: string } {
  const map: Record<string, { title: string; description: string }> = {
    sovereign: {
      title: '消えない王座への執着',
      description: '最後まで支配者を守った。あなたの深層には、認められたいという強烈な渇望が眠っている。',
    },
    wanderer: {
      title: '帰れない自由の夢',
      description: '放浪者を守り抜いた。あなたは本当は、全てを捨てて消えてしまいたいと思ったことがある。',
    },
    oracle: {
      title: '孤独な真実の守護',
      description: '預言者を最後まで護った。あなたは理解されることより、真実を知ることを選び続けてきた。',
    },
    martyr: {
      title: '自己消耗の蜜',
      description: '殉教者を守り抜いた。苦しむことに、どこか安心感を覚えてはいないか。',
    },
    trickster: {
      title: '道化の仮面の下の叫び',
      description: '道化師を最後まで保護した。あなたは笑わせることで、助けを求めてきたのかもしれない。',
    },
    phantom: {
      title: '透明への逃避',
      description: '幻影を守り抜いた。見られることへの恐怖が、あなたの根幹にある。',
    },
    destroyer: {
      title: '破壊の中の純粋さ',
      description: '破壊者を最後まで守った。あなたは本当は、ゼロから始めたいと思い続けている。',
    },
    architect: {
      title: '完璧な檻の住人',
      description: '設計者を守り抜いた。あなたは制御できないものへの、深い恐怖を抱えている。',
    },
    child: {
      title: '止まった時計の番人',
      description: '永遠の子供を最後まで護った。あなたはまだ、あの頃の傷から動けていない。',
    },
    guardian: {
      title: '自己犠牲の鎧',
      description: '番人を守り抜いた。誰かを守ることで、自分の痛みを感じずに済んでいる。',
    },
    lover: {
      title: '愛という名の溺没',
      description: '恋慕者を最後まで守った。あなたは誰かと深く繋がることなしに、生きられないと感じている。',
    },
    alchemist: {
      title: '変容の夢の囚人',
      description: '錬金術師を守り抜いた。「もっと良くなれる」という信念が、あなたを現在から引き離している。',
    },
  };

  return map[lastStandingId] || {
    title: '深層は沈黙する',
    description: 'あなたの最も深い部分は、まだ言葉にならない。それで良い。',
  };
}

function generateOverallComment(
  _lastStanding: string,
  fearScore: number,
  selfScore: number,
  avgTime: number
): string {
  const comments = [
    `あなたが最後まで守ったのは、あなた自身が最も恐れているものだ。`,
    `選択のたびに、あなたは自分の一部を差し出した。何が残ったか——それが、あなたの核心だ。`,
    `迷宮の中での選択に、合理的な答えはない。あったのは、あなたの本音だけだ。`,
    `あなたが捨てたものたちは、実はまだあなたの中にいる。`,
    `BOCCAは真実の口。あなたは今、自分の真実に触れた。`,
  ];

  if (fearScore > 70) {
    return `恐怖があなたを動かした。でもそれは弱さではない——あなたは何かを深く大切にしているということだ。${comments[1]}`;
  } else if (selfScore > 70) {
    return `あなたは迷わず自分の軸で動いた。それが優しさなのか冷酷さなのかは、あなた自身が知っている。${comments[0]}`;
  } else if (avgTime > 10000) {
    return `あなたは深く悩んだ。全てのペルソナに、自分を見たからかもしれない。${comments[3]}`;
  }

  return `${comments[Math.floor(Math.random() * comments.length)]}`;
}

// 料理ペアリング定義
function getFoodPairing(lastStanding: string, _fearScore: number, _selfScore: number): FoodPairing {
  const pairings: Record<string, FoodPairing> = {
    sovereign: {
      name: '黒いリゾット',
      description: 'イカ墨で染められた漆黒のリゾット。金箔を散らし、王者の孤独を表現。',
      reason: 'あなたは支配と孤独を抱えている。深く濃い味わいが、その本質に触れる。',
      imageMood: 'dark black squid ink risotto with gold leaf, elegant plating',
      color: '#1a1a1a',
      emoji: '🖤',
    },
    wanderer: {
      name: '旅人のシチュー',
      description: '各地の食材を集めた煮込み料理。根菜とハーブ、大地の滋味。',
      reason: 'あなたは帰る場所を探している。このシチューは、どこにいても故郷の味になる。',
      imageMood: 'rustic traveler stew with root vegetables, warm earthy tones, steam rising',
      color: '#7B9E87',
      emoji: '🍲',
    },
    oracle: {
      name: '紫の蓬莱',
      description: 'ラベンダーとブルーベリーのジェラート。見えない世界の色を纏う。',
      reason: 'あなたの洞察は深すぎる。冷たく澄んだ甘さが、見えすぎた目を癒す。',
      imageMood: 'purple lavender blueberry gelato, mystical ethereal plating, dark background',
      color: '#8B5CF6',
      emoji: '🍇',
    },
    martyr: {
      name: '赤いガスパチョ',
      description: 'スペイン産トマトの冷製スープ。血のような赤、でも優しい味。',
      reason: '自己犠牲は美しい。このスープは与え続けたあなたへの、ねぎらいの一杯。',
      imageMood: 'deep red gazpacho soup, Spanish style, sacrifice and beauty, dramatic plating',
      color: '#DC2626',
      emoji: '🍅',
    },
    trickster: {
      name: '驚きのデセール',
      description: '外見は普通のケーキ、でも中から何かが飛び出す。笑いと驚きの一皿。',
      reason: 'あなたは笑わせることで生きてきた。この料理もあなたと同じ——見た目が全てではない。',
      imageMood: 'surprise dessert cake with unexpected filling, playful colorful plating, whimsical',
      color: '#F59E0B',
      emoji: '🎂',
    },
    phantom: {
      name: '霧の中のコンソメ',
      description: '透き通った琥珀色のスープ。存在するのに、见えるか见えないか——',
      reason: 'あなたは見えることを恐れ、見えないことを望んだ。このスープは透明でも確かにそこにある。',
      imageMood: 'clear golden consomme soup, translucent, ethereal, minimalist ghost-like presentation',
      color: '#6B7280',
      emoji: '🌫️',
    },
    destroyer: {
      name: '灰から生まれる鳳凰鍋',
      description: '辛く激しい鍋。食べ終えた後、全てが清められたような感覚。',
      reason: '破壊の後に新生がある。このスパイシーな鍋はあなたを焼き尽くし、また蘇らせる。',
      imageMood: 'fiery hot pot, dramatic flames, phoenix rising imagery, deep red and orange',
      color: '#EF4444',
      emoji: '🔥',
    },
    architect: {
      name: '幾何学的テリーヌ',
      description: '精密に層重ねられたテリーヌ。完璧な断面が美しい。',
      reason: 'あなたは秩序の中に美を見る。この一皿はあなたの完璧主義への、食の答えだ。',
      imageMood: 'geometric precision terrine, perfect layers, architectural food art, clean aesthetic',
      color: '#3B82F6',
      emoji: '🔷',
    },
    child: {
      name: '大人の綿菓子',
      description: '子供の頃の綿菓子を、シャンパンで溶かした大人のデザート。',
      reason: 'あなたの中の子供がまだいる。この料理は過去と今を繋ぐ——甘く、少し切ない味。',
      imageMood: 'cotton candy dissolving in champagne, nostalgic yet adult, pink and gold, bittersweet',
      color: '#F472B6',
      emoji: '🌸',
    },
    guardian: {
      name: '番人のブイヤベース',
      description: 'マルセイユの漁師が守り続けた魚介のスープ。門を守る者へ。',
      reason: 'あなたは守ることで生きてきた。このスープは海の全てを抱える——あなたのように。',
      imageMood: 'traditional bouillabaisse fish stew, Marseille style, protective warmth, golden broth',
      color: '#10B981',
      emoji: '🐚',
    },
    lover: {
      name: '禁断のフォン・ダン・ショコラ',
      description: '中から溢れ出すチョコレート。愛のように、止められない。',
      reason: 'あなたは愛しすぎる。この溶け出すチョコレートは、あなたの愛の重さそのものだ。',
      imageMood: 'molten chocolate fondant lava cake, dark chocolate flowing, passion and excess, romantic',
      color: '#BE185D',
      emoji: '💝',
    },
    alchemist: {
      name: '変容のモレソース',
      description: 'チョコレートとチリが共存するメキシコの魔法のソース。全ての矛盾が一体化する。',
      reason: 'あなたは変容を求めた。このソースは相反する素材が融合する——まさにあなたが目指したもの。',
      imageMood: 'mole sauce Mexican chocolate chili, alchemical potion, transformation, mysterious dark',
      color: '#7C3AED',
      emoji: '⚗️',
    },
  };

  return pairings[lastStanding] || {
    name: '迷宮の饗宴',
    description: '全ての素材を少しずつ組み合わせた、唯一無二の一皿。',
    reason: 'あなたは複雑だ。単一の料理には収まらない。',
    imageMood: 'mysterious eclectic feast, dark dramatic plating',
    color: '#6B21A8',
    emoji: '🌌',
  };
}
