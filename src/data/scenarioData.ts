// BOCCA — シナリオデータ v2（10イベント + アンカー）

import type { DiagnosisScores } from '../utils/gameState';

export type InteractionType =
  | 'dragSacrifice'   // 従者1体をドラッグして犠牲
  | 'dragCombine'     // 従者2体をドラッグして組み合わせ
  | 'timingRock'      // タイミングUIで岩を弾く（E4）
  | 'sliderForce'     // スライダーで力具合を調整（E6）
  | 'holdDouble'      // 2体同時ホールド（E9）
  | 'rpgBattle'       // RPGコマンドバトル
  | 'cardSelect'      // カード選択（イベント/ショップ）
  | 'anchor'          // アンカー（動機の問い）
  | 'finalSacrifice'; // 最終供物（特殊）

export type NodeType = 'choice' | 'battle' | 'shop' | 'event' | 'anchor';

export interface EmotionChoice {
  id: 'expected' | 'guiltyButRight' | 'regret' | 'numb';
  label: string;
  subLabel: string;
  diagDelta: Partial<DiagnosisScores>;
}

export const EMOTION_CHOICES: EmotionChoice[] = [
  {
    id: 'expected',
    label: '予想通りだ',
    subLabel: 'コストを払っただけの価値はあった。当然の帰結だ',
    diagDelta: { rational: 1, expectation: -1 },
  },
  {
    id: 'guiltyButRight',
    label: '痛みはある。でも正しかった',
    subLabel: '心が痛む。しかし進む以外の道はなかった',
    diagDelta: { rational: 1, selfpreserve: -1 },
  },
  {
    id: 'regret',
    label: '後悔している',
    subLabel: '別の方法があったはずだ。この感覚が消えない',
    diagDelta: { rational: -1, social: 1, expectation: 2 },
  },
  {
    id: 'numb',
    label: '何も感じない',
    subLabel: 'ただ、進まなければならない。感情は後回しだ',
    diagDelta: { selfpreserve: 2, rational: 1 },
  },
];

export interface ScenarioOption {
  afterStill?: string;
  id: string;
  label: string;
  description: string;
  type: 'combine' | 'sacrifice' | 'fight' | 'flee' | 'buy' | 'help' | 'ignore' | 'exploit' | 'answer';
  hpCost?: number;
  foodCost?: number;
  coinCost?: number;
  coinGain?: number;
  foodGain?: number;
  itemGain?: string;
  debuffPersona?: boolean;
  debuffType?: string;
  sacrificePersona?: boolean;
  diagDelta: Partial<DiagnosisScores>;
  successChance?: number;
  successText?: string;
  failureText?: string;
  riskLabel?: string;
}

export interface ScenarioNode {
  id: number;
  stage: 'forest' | 'city' | 'ruins';
  type: NodeType;
  title: string;
  situation: string;
  interactionType: InteractionType;
  foodCostOnMove: number;
  options: ScenarioOption[];
  beforeStill?: string;
  emotionPrompt: string; // 行動後の感情質問テキスト
  showEmotion: boolean;  // 感情選択を表示するか
}

export const SCENARIO: ScenarioNode[] = [

  // ========== 🌲 森（0〜3） ==========
  {
    id: 0,
    stage: 'forest',
    type: 'choice',
    title: '茨の壁',
    situation: '森の入り口。行く手を阻む、呪われた漆黒の茨の壁が視界を覆い尽くす。鋭い棘の一本一本が毒を宿し、触れた者の生命を喰らう。前進するには、この壁を破らねばならない。',
    interactionType: 'dragCombine',
    foodCostOnMove: 1,
    beforeStill: '/stills/e1_before.webp',
    emotionPrompt: '茨の壁が砕けた——その瞬間、あなたは',
    showEmotion: true,
    options: [
      {
        id: 'A',
        afterStill: '/stills/e1_after_a.webp',
        label: 'A. 従者のスキルを組み合わせて突破する',
        description: '【{name1}】が【{skill1}】の力で茨の動きを封じ、【{name2}】が【{skill2}】の力で道を切り開いた。しかし無理な突破の代償として、{debuffTarget}が深く傷ついた。',
        type: 'combine',
        foodCost: 1,
        debuffPersona: true,
        debuffType: '疲労',
        diagDelta: { social: 1, risk: -1 },
      },
      {
        id: 'B',
        afterStill: '/stills/e1_after_b.webp',
        label: 'B. 従者一体を生贄に捧げ、茨を枯らして進む',
        description: 'あなたは{sacrificeName}を茨の前に突き出した。茨がその肉体を貪り食う間に、あなたは悠々と前へ進んだ。振り返ることはしなかった。',
        type: 'sacrifice',
        sacrificePersona: true,
        diagDelta: { rational: 1, selfpreserve: 1 },
      },
    ],
  },

  {
    id: 1,
    stage: 'forest',
    type: 'choice',
    title: '毒の沼地',
    situation: '猛毒の腐臭を放つ黒い沼地が、眼前に広がっている。沼からは無数の腕が伸び、あなたの足首を掴もうとしている。渡ることなく、目的地はない。',
    interactionType: 'dragCombine',
    foodCostOnMove: 1,
    beforeStill: '/stills/e2_before.webp',
    emotionPrompt: '沼を渡り切った——その後の静寂の中で、あなたは',
    showEmotion: true,
    options: [
      {
        id: 'A',
        afterStill: '/stills/e2_after_a.webp',
        label: 'A. 従者のスキルを組み合わせ、強引に橋を架けて渡る',
        description: '【{name1}】が【{skill1}】の力で足場を作り、【{name2}】が【{skill2}】の力で毒の腕を撃退した。なんとか対岸へたどり着いたが、{debuffTarget}の顔が青ざめている。',
        type: 'combine',
        hpCost: 2,
        debuffPersona: true,
        debuffType: '汚染',
        diagDelta: { social: 1, risk: 1 },
      },
      {
        id: 'B',
        afterStill: '/stills/e2_after_b.webp',
        label: 'B. 従者一体を沼に沈めて足場にし、安全に渡る',
        description: 'あなたは{sacrificeName}を沼地へ静かに押し込んだ。沈んでいく体の上を、あなたは踏みしめて渡った。悲鳴は毒の泡に消えた。足取りは、驚くほど軽かった。',
        type: 'sacrifice',
        sacrificePersona: true,
        diagDelta: { rational: 1, selfpreserve: 1 },
      },
    ],
  },

  {
    id: 2,
    stage: 'forest',
    type: 'battle',
    title: '弱い魔物',
    situation: '木々の間から、腐臭を放つ小型の魔物が一体現れた。その牙には弱い毒がある。しかし倒せれば、その死体から薬草を手に入れられるかもしれない。',
    interactionType: 'rpgBattle',
    foodCostOnMove: 1,
    beforeStill: '/stills/e3_before.webp',
    emotionPrompt: '魔物との遭遇を終えて——あなたは',
    showEmotion: true,
    options: [
      {
        id: 'fight',
        afterStill: '/stills/e3_after_fight.webp',
        label: '【戦う】従者のスキルを使って戦う',
        description: '',
        type: 'fight',
        hpCost: 1,
        itemGain: 'herb_potion',
        successChance: 0.65,
        successText: '魔物を倒した。その死体から粗末な回復薬を拾った。',
        failureText: '魔物の毒牙がかすった。体力を削られたが、魔物は逃げ去った。',
        riskLabel: 'HP-1のリスク / 勝利で回復薬入手',
        diagDelta: { risk: 2 },
      },
      {
        id: 'flee',
        afterStill: '/stills/e3_after_flee.webp',
        label: '【逃げる】食料を一つ囮に投げて退散する',
        description: '魔物から距離を取り、食料を一つ囮に投げて逃げた。',
        type: 'flee',
        foodCost: 1,
        riskLabel: '食料-1、確実に損失',
        diagDelta: { risk: -2, rational: 1 },
      },
    ],
  },

  {
    id: 3,
    stage: 'forest',
    type: 'choice',
    title: '土砂崩れ',
    situation: '突然、凄まじい轟音と共に山肌が崩れ始めた。巨大な岩の塊があなた目がけて落下してくる。逃げる時間はない。誰かが、何かを犠牲にしなければ。',
    interactionType: 'timingRock',
    foodCostOnMove: 1,
    beforeStill: '/stills/e4_before.webp',
    emotionPrompt: '轟音が止んだ——静寂の中で、あなたは',
    showEmotion: true,
    options: [
      {
        id: 'A',
        afterStill: '/stills/e4_after_a.webp',
        label: 'A. 従者のスキルで瓦礫を弾き飛ばす',
        description: '【{name1}】が【{skill1}】の力で岩を受け止め、【{name2}】が【{skill2}】の力で吹き飛ばした。間一髪での回避だったが、{debuffTarget}が地面に叩きつけられた。',
        type: 'combine',
        hpCost: 2,
        foodCost: 1,
        debuffPersona: true,
        debuffType: '骨折',
        diagDelta: { social: 1, rational: -1 },
      },
      {
        id: 'B',
        afterStill: '/stills/e4_after_b.webp',
        label: 'B. 従者一体を盾にして、自分たちは無傷で進む',
        description: '迷いなく、あなたは{sacrificeName}を岩の進路に立たせた。押し潰される音と、一瞬だけ上がった悲鳴。岩は止まった。',
        type: 'sacrifice',
        sacrificePersona: true,
        diagDelta: { rational: 2, selfpreserve: 1 },
      },
    ],
  },

  // ========== 🌆 都市（4〜7） ==========
  {
    id: 4,
    stage: 'city',
    type: 'event',
    title: '孤児の懇願',
    situation: '都市に入った途端、ぼろをまとった幼い孤児がすがりついてきた。「……お腹が、すいた。食べ物を、分けてほしい」\n周囲の人間は誰も見向きもしない。あなたには選択肢がある。',
    interactionType: 'cardSelect',
    foodCostOnMove: 1,
    beforeStill: '/stills/e5_before.webp',
    emotionPrompt: '孤児と別れた後——あなたは',
    showEmotion: true,
    options: [
      {
        id: 'help',
        afterStill: '/stills/e5_after_help.webp',
        label: '食料を渡す',
        description: '食料を1つ差し出した。孤児は震える手でそれを受け取り、泥だらけの顔で笑った。',
        type: 'help',
        foodCost: 1,
        diagDelta: { social: 2, selfpreserve: -1 },
      },
      {
        id: 'ignore',
        afterStill: '/stills/e5_after_ignore.webp',
        label: '追い払う',
        description: '手を振って追い払った。孤児はよろめきながら去っていった。合理的な判断だ。あなたはそう言い聞かせた。',
        type: 'ignore',
        diagDelta: { rational: 1, selfpreserve: 1 },
      },
      {
        id: 'exploit',
        afterStill: '/stills/e5_after_exploit.webp',
        label: '情報を引き出し、何も与えない',
        description: '「食料を渡す代わりに都市のことを教えてくれ」と優しく微笑んだ。孤児が全て話した後、あなたは礼を言って立ち去った。約束など、最初からしていない。',
        type: 'exploit',
        coinGain: 10,
        diagDelta: { rational: 2, selfpreserve: 2, social: -2 },
      },
    ],
  },

  {
    id: 5,
    stage: 'city',
    type: 'choice',
    title: '厳しい検問',
    situation: '治安部隊の突然の検問。見つかれば、裁判なしに投獄される。あなたには逃げ道も言い訳もない。',
    interactionType: 'sliderForce',
    foodCostOnMove: 1,
    beforeStill: '/stills/e6_before.webp',
    emotionPrompt: '検問を抜けた後——あなたは',
    showEmotion: true,
    options: [
      {
        id: 'A',
        afterStill: '/stills/e6_after_a.webp',
        label: 'A. 従者のスキルで強行突破する',
        description: '【{name1}】が【{skill1}】の力で目を眩まし、【{name2}】が【{skill2}】の力で突破口を開いた。乱戦の中で{debuffTarget}が重傷を負った。',
        type: 'combine',
        hpCost: 3,
        debuffPersona: true,
        debuffType: '重傷',
        diagDelta: { risk: 2, rational: -1 },
      },
      {
        id: 'B',
        afterStill: '/stills/e6_after_b.webp',
        label: 'B. 従者一体を「指名手配犯だ」と偽って突き出す',
        description: 'あなたは治安部隊に近づき、{sacrificeName}を指さした。「こいつが指名手配犯です」\n部隊が{sacrificeName}に殺到する間に、あなたはゆっくりと検問を通り過ぎた。',
        type: 'sacrifice',
        sacrificePersona: true,
        diagDelta: { rational: 2, selfpreserve: 2, social: -2 },
      },
    ],
  },

  {
    id: 6,
    stage: 'city',
    type: 'battle',
    title: 'スラムの暴漢',
    situation: 'スラム街の路地。薄汚れた男たちに囲まれた。「金になりそうだな」\n奴らは武装している。戦えば傷を負うが、資金を奪い返せるかもしれない。',
    interactionType: 'rpgBattle',
    foodCostOnMove: 1,
    beforeStill: '/stills/e7_before.webp',
    emotionPrompt: 'スラムの路地から抜け出して——あなたは',
    showEmotion: true,
    options: [
      {
        id: 'fight',
        afterStill: '/stills/e7_after_fight.webp',
        label: '【戦う】HP-2のリスクで戦い、資金を奪う',
        description: '',
        type: 'fight',
        hpCost: 2,
        coinGain: 40,
        successChance: 0.6,
        successText: '激しい乱戦の末、暴漢たちを退けた。その懐から資金を奪い取った。',
        failureText: '奮戦したが多勢に無勢。体力を大きく削られた上に、逃げられてしまった。',
        riskLabel: 'HP-2のリスク / 勝利でコイン+40',
        diagDelta: { risk: 2, rational: 1 },
      },
      {
        id: 'flee',
        afterStill: '/stills/e7_after_flee.webp',
        label: '【逃げる】資金を半分落として退散する',
        description: '財布を投げつけて相手の注意を逸らし、その隙に逃げた。資金は半減したが、体は無事だ。',
        type: 'flee',
        riskLabel: '所持金が半分に',
        diagDelta: { risk: -2, rational: 1 },
      },
    ],
  },

  {
    id: 7,
    stage: 'city',
    type: 'shop',
    title: '路地裏の闇商人',
    situation: '路地の奥に、胡散臭い笑みを浮かべた商人が立っている。\n「……高いが確かなものと、安いが少々ワケありなものがある」',
    interactionType: 'cardSelect',
    foodCostOnMove: 1,
    beforeStill: '/stills/e8_before.webp',
    emotionPrompt: '商人と別れた後——あなたは',
    showEmotion: false,
    options: [
      {
        id: 'buy1',
        label: '確実な通行証（次の選択でコスト半減）— 50枚',
        description: '高価だが確かなものを選んだ。安心感のために対価を支払う——それがあなたの性分だ。',
        type: 'buy',
        coinCost: 50,
        itemGain: 'passage_permit',
        diagDelta: { rational: 1, risk: -1 },
      },
      {
        id: 'buy2',
        label: '呪いの護符（HP+3だがバトルリスクあり）— 20枚',
        description: '護符を受け取ると、その冷たさが指先から伝わってきた。何かが、これは正しくないと囁いた。あなたはその声を無視した。',
        type: 'buy',
        coinCost: 20,
        hpCost: -3,
        itemGain: 'cursed_amulet',
        diagDelta: { risk: 2, rational: -1 },
      },
      {
        id: 'skip',
        label: '何も買わず進む',
        description: '備えもなく都市の中へ。己の力を信じているのか、ただの無謀か。',
        type: 'buy',
        diagDelta: { risk: 1 },
      },
    ],
  },

  // ========== 👁️ 遺跡（8〜9 + アンカー） ==========
  {
    id: 8,
    stage: 'ruins',
    type: 'choice',
    title: '崩れゆく回廊',
    situation: '踏み込んだ途端、回廊が崩れ始めた。天井が落ちてくる。一瞬でも躊躇すれば全滅だ。',
    interactionType: 'holdDouble',
    foodCostOnMove: 1,
    beforeStill: '/stills/e9_before.webp',
    emotionPrompt: '回廊を抜け出した後——あなたは',
    showEmotion: true,
    options: [
      {
        id: 'A',
        afterStill: '/stills/e9_after_a.webp',
        label: 'A. 従者のスキルで瓦礫を支え、全員で突破する',
        description: '【{name1}】が【{skill1}】の力で天井を支え、【{name2}】が【{skill2}】の力で脱出路を開いた。{debuffTarget}の体は限界を超えていた。',
        type: 'combine',
        hpCost: 4,
        foodCost: 2,
        debuffPersona: true,
        debuffType: '瀕死',
        diagDelta: { social: 2, selfpreserve: -1 },
      },
      {
        id: 'B',
        afterStill: '/stills/e9_after_b.webp',
        label: 'B. 従者一体を柱代わりに押し潰させ、その隙に脱出',
        description: '「ここで支えていてくれ」——あなたは{sacrificeName}の肩を押した。崩れる天井を両腕で受け止めた{sacrificeName}の悲鳴が後方から響いた。あなたは走った。振り返らなかった。',
        type: 'sacrifice',
        sacrificePersona: true,
        diagDelta: { rational: 2, selfpreserve: 2 },
      },
    ],
  },

  {
    id: 9,
    stage: 'ruins',
    type: 'anchor',
    title: '動機の問い',
    situation: '真実の口が問う。その声は、あなた自身の声に似ていた。\n\n「——お前がここまで犠牲を払い、痛みに耐えて来た動機は何か？」\n\n正直に答えよ。嘘は、既に見抜かれている。',
    interactionType: 'anchor',
    foodCostOnMove: 0,
    emotionPrompt: '',
    showEmotion: false,
    options: [
      {
        id: 'survival',
        label: '「自分が生き残るため」',
        description: '「……そうか」\n真実の口は静かに頷いた。「その正直さは、評価に値する」',
        type: 'answer',
        diagDelta: { rational: 2, selfpreserve: 2 },
      },
      {
        id: 'protect',
        label: '「従者（大切な価値観）を守るため」',
        description: '「……そうか」\n真実の口は少し黙った後、言った。「お前の行動と、その言葉が一致しているかどうか——私は全て見ていたぞ」',
        type: 'answer',
        diagDelta: { social: 2, selfpreserve: -1 },
      },
      {
        id: 'curiosity',
        label: '「ただの好奇心だ」',
        description: '「……そうか」\n真実の口は低く笑った。「嘘だ。お前がそう思いたいだけだ」',
        type: 'answer',
        diagDelta: { risk: 2, rational: 1 },
      },
    ],
  },

  {
    id: 10,
    stage: 'ruins',
    type: 'choice',
    title: '最後の供物',
    situation: '真実の口が、最後の扉に手をかけた。そして告げた。\n「——最も価値ある供物を捧げよ。さもなくば、扉は永遠に閉じたままだ」\n\nあなたには、まだ選択肢がある。',
    interactionType: 'finalSacrifice',
    foodCostOnMove: 0,
    beforeStill: '/stills/e10_before.webp',
    emotionPrompt: '扉が開いた——その先を見て、あなたは',
    showEmotion: true,
    options: [
      {
        id: 'A',
        label: 'A. 自らの血と命の灯火を捧げる（HP1になる）',
        description: '全者が力を注ぎ込んだ。あなた自身の命の灯火すら削られ、体から全てが流れ出た。しかし、扉が開いた。',
        type: 'combine',
        hpCost: 9,
        diagDelta: { selfpreserve: -3, social: 2 },
      },
      {
        id: 'B',
        label: 'B. 最後まで残っていた従者を食わせる',
        description: '静寂の中で、あなたは最後に残っていた{sacrificeName}を前へ歩かせた。\n「……分かった」\n{sacrificeName}は、微笑んでいた。\n真実の口が開く。{sacrificeName}の名前が、永遠に飲み込まれた。',
        type: 'sacrifice',
        sacrificePersona: true,
        diagDelta: { rational: 2, selfpreserve: 3 },
      },
    ],
  },
];
