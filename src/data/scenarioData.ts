// BOCCA — 全26ステップ マスターシナリオデータ
// タイプ: 'choice'=選択(A/B), 'battle'=戦闘, 'shop'=買い物, 'event'=イベント, 'dialogue'=会話(進行のみ)

import type { MBTIScores } from '../utils/gameState';

// ===============================
// 型定義
// ===============================

export type NodeType = 'choice' | 'battle' | 'shop' | 'event' | 'dialogue' | 'anchor';

export interface ScenarioNode {
  id: number;
  stage: 'forest' | 'city' | 'ruins';
  type: NodeType;
  title: string;
  situation: string;    // プレイヤーに提示するダーク文章
  options: ScenarioOption[];
  foodCostOnMove: number; // このステップに移動する際の基本食料コスト（通常1）
}

export interface ScenarioOption {
  id: string;         // 'A' | 'B' | 'fight' | 'flee' | 'buy1' | 'buy2' | 'buy3' | 'help' | 'ignore' | 'exploit' | 'survival' | 'protect' | 'curiosity' | 'accept'
  label: string;      // ボタンテキスト
  description: string; // 選択した後のテキスト
  type: 'combine' | 'sacrifice' | 'fight' | 'flee' | 'buy' | 'help' | 'ignore' | 'exploit' | 'answer' | 'resist' | 'accept';
  // --- コスト ---
  hpCost?: number;
  foodCost?: number;
  coinCost?: number;
  coinGain?: number;
  foodGain?: number;
  itemGain?: string;
  // --- 従者への影響 ---
  debuffPersona?: boolean;     // true=従者1体を選んでデバフ
  debuffType?: string;          // デバフの種類
  sacrificePersona?: boolean;  // true=従者1体を選んで犠牲（ロスト）
  numberOfCombine?: number;    // A選択時に選ぶ従者数（通常2）
  // --- MBTI変動 ---
  mbtiDelta: Partial<MBTIScores>;
  // --- リスク（バトル用）---
  riskLabel?: string;          // リスクの説明テキスト
  successText?: string;        // バトルで成功した場合のテキスト
  failureText?: string;        // バトルで失敗した場合のテキスト
  successChance?: number;      // 成功確率(0.0〜1.0)
}

// ===============================
// 全26ステップ シナリオデータ
// ===============================
export const SCENARIO: ScenarioNode[] = [

  // ========== 🌲 森ステージ（0〜7） ==========

  {
    id: 0,
    stage: 'forest',
    type: 'choice',
    title: '最初の選択：茨の壁',
    situation: '森の入り口。行く手を阻む、呪われた漆黒の茨の壁が視界を覆い尽くす。鋭い棘の一本一本が毒を宿し、触れた者の生命を喰らう。前進するには、この壁を破らねばならない。',
    foodCostOnMove: 1,
    options: [
      {
        id: 'A',
        label: 'A. 従者のスキルを組み合わせて突破する',
        description: '【従者1】が【{skill1}】の力で茨の動きを封じ、【従者2】が【{skill2}】の力で道を切り開いた。しかし無理な突破の代償として、{debuffTarget}が深く傷ついた。{debuffTarget}はしばらく動けないだろう。あなたの食料が一つ減った。',
        type: 'combine',
        foodCost: 1,
        debuffPersona: true,
        debuffType: '疲労',
        numberOfCombine: 2,
        mbtiDelta: { F: 1, J: 1 },
      },
      {
        id: 'B',
        label: 'B. 従者一体を生贄に捧げ、茨を枯らして無傷で進む',
        description: 'あなたは{sacrificeName}を茨の前に突き出した。茨がその肉体を貪り食う間に、あなたは悠々と前へ進んだ。振り返ることはしなかった。',
        type: 'sacrifice',
        sacrificePersona: true,
        mbtiDelta: { T: 1, P: 1 },
      },
    ],
  },

  {
    id: 1,
    stage: 'forest',
    type: 'dialogue',
    title: '恐怖の予感',
    situation: '茨の向こう側。薄暗い森の中、従者たちが不安そうに顔を見合わせる。\n「……この先、身を削るか、誰かを切り捨てるかの決断が続きます」\n{firstServant}が震える声で呟いた。あなたはただ、前を向いて歩き続けた。',
    foodCostOnMove: 1,
    options: [
      {
        id: 'proceed',
        label: '先へ進む',
        description: '',
        type: 'answer',
        mbtiDelta: {},
      },
    ],
  },

  {
    id: 2,
    stage: 'forest',
    type: 'choice',
    title: '毒の沼地',
    situation: '足元が変わった。猛毒の腐臭を放つ黒い沼地が、眼前に広がっている。渡ることなく、目的地はない。沼からは無数の腕が伸び、あなたの足首を掴もうとしている。',
    foodCostOnMove: 1,
    options: [
      {
        id: 'A',
        label: 'A. 従者のスキルを組み合わせ、強引に橋を架けて渡る',
        description: '【従者1】が【{skill1}】の力で足場を作り、【従者2】が【{skill2}】の力で毒の腕を撃退した。なんとか対岸へたどり着いたが、飛び散った毒の飛沫を浴びた{debuffTarget}の顔が青ざめている。あなた自身も体力を消耗した。',
        type: 'combine',
        hpCost: 2,
        debuffPersona: true,
        debuffType: '汚染',
        numberOfCombine: 2,
        mbtiDelta: { F: 1, S: 1 },
      },
      {
        id: 'B',
        label: 'B. 従者一体を沼に沈めて足場にし、安全に渡る',
        description: 'あなたは{sacrificeName}を沼地へ静かに押し込んだ。沈んでいく体の上を、あなたは踏みしめて渡った。悲鳴は毒の泡に消えた。足取りは、驚くほど軽かった。',
        type: 'sacrifice',
        sacrificePersona: true,
        mbtiDelta: { T: 1, I: 1 },
      },
    ],
  },

  {
    id: 3,
    stage: 'forest',
    type: 'battle',
    title: 'バトル：弱い魔物',
    situation: '木々の間から、體から腐臭を放つ小型の魔物が一体現れた。その牙には弱い毒がある。しかし倒せばそれが持っていた薬草を手に入れられるかもしれない。',
    foodCostOnMove: 1,
    options: [
      {
        id: 'fight',
        label: '【戦う】リスクを負って倒し、回復薬を狙う',
        description: '魔物との交戦。',
        type: 'fight',
        hpCost: 1,
        itemGain: '回復薬',
        riskLabel: 'HP-1のリスク、回復薬を入手できる可能性あり',
        successChance: 0.65,
        successText: '魔物を倒した。その死体から粗末な回復薬を拾った。傷はあるが、得るものがあった。',
        failureText: '魔物の毒牙がかすった。体力を削られたが、魔物は逃げ去った。何も得られなかった。',
        mbtiDelta: { E: 1, P: 1 },
      },
      {
        id: 'flee',
        label: '【逃げる】確実に食料を一つ落として退散する',
        description: '魔物から距離を取り、食料を一つ囮に投げて逃げた。確実ではあるが、やはり何かが引っかかる。',
        type: 'flee',
        foodCost: 1,
        riskLabel: '食料-1、確実に損失',
        mbtiDelta: { I: 1, J: 1, S: 1 },
      },
    ],
  },

  {
    id: 4,
    stage: 'forest',
    type: 'event',
    title: 'イベント：罠にかかった森の妖精',
    situation: '茂みの中から、かすかな泣き声が聞こえた。罠にかかった小さな妖精が、あなたを見上げている。「たすけて……」\nかわいそうだが、食料も限られている。放置しても、何の実害もないだろう。',
    foodCostOnMove: 1,
    options: [
      {
        id: 'help',
        label: '食料を1つ消費して助ける',
        description: '妖精を罠から解放し、持っていた食料を一つ分け与えた。妖精は涙を流し、あなたの手を握った。「……忘れない」\nその言葉の重みを、あなたは長く引きずることになる。',
        type: 'help',
        foodCost: 1,
        mbtiDelta: { F: 1, E: 1 },
      },
      {
        id: 'ignore',
        label: '無視して先へ進む',
        description: '泣き声から目を逸らし、足を速めた。振り返らなかった。ただの感傷を捨てることが、生き残ることだと、あなたは知っている。',
        type: 'ignore',
        mbtiDelta: { T: 1, I: 1 },
      },
    ],
  },

  {
    id: 5,
    stage: 'forest',
    type: 'choice',
    title: '土砂崩れ',
    situation: '突然、凄まじい轟音と共に山肌が崩れ始めた。巨大な岩の塊があなた目がけて落下してくる。逃げる時間はない。誰かが、何かを犠牲にしなければ。',
    foodCostOnMove: 1,
    options: [
      {
        id: 'A',
        label: 'A. 従者のスキルを組み合わせ、瓦礫を弾き飛ばす',
        description: '【従者1】が【{skill1}】の力で岩を受け止め、【従者2】が【{skill2}】の力で吹き飛ばした。間一髪での回避だったが、その衝撃で{debuffTarget}が地面に叩きつけられた。あなた自身も無傷ではなかった。',
        type: 'combine',
        hpCost: 2,
        foodCost: 1,
        debuffPersona: true,
        debuffType: '骨折',
        numberOfCombine: 2,
        mbtiDelta: { F: 1, N: 1 },
      },
      {
        id: 'B',
        label: 'B. 従者一体を盾にして、自分たちは無傷で生き残る',
        description: '迷いなく、あなたは{sacrificeName}を岩の進路に立たせた。押し潰される音と、一瞬だけ上がった悲鳴。岩は止まった。あなたと残りの従者は、ただ前へ進んだ。',
        type: 'sacrifice',
        sacrificePersona: true,
        mbtiDelta: { T: 1, J: 1 },
      },
    ],
  },

  {
    id: 6,
    stage: 'forest',
    type: 'dialogue',
    title: '都市の明かり',
    situation: '森を抜けた。遠く、焦げたオレンジ色の明かりが見える——都市だ。\n従者たちの顔に疲労が滲んでいる。\n「……やっと、出られた」\n誰かが呟いた。しかしあなたは知っている。本当の試練はここからだ。',
    foodCostOnMove: 1,
    options: [
      {
        id: 'proceed',
        label: '都市へ向かう',
        description: '',
        type: 'answer',
        mbtiDelta: {},
      },
    ],
  },

  {
    id: 7,
    stage: 'forest',
    type: 'choice',
    title: '呪われた門',
    situation: '森の出口を塞ぐ、禍々しい呪文が刻まれた巨大な鉄門。触れた者の精神を喰らう呪いが術者を待ち受けている。都市へ入るには、この門を越えなければならない。',
    foodCostOnMove: 1,
    options: [
      {
        id: 'A',
        label: 'A. 従者のスキルを組み合わせ、呪いを中和する',
        description: '【従者1】が【{skill1}】の力で呪詛の流れを読み、【従者2】が【{skill2}】の力で封じ込めた。しかし完全には中和できず、呪いの余波が{debuffTarget}を蝕んだ。あなた自身も、魂が少し削れたような感覚がした。',
        type: 'combine',
        hpCost: 3,
        debuffPersona: true,
        debuffType: '恐怖',
        numberOfCombine: 2,
        mbtiDelta: { N: 1, F: 1 },
      },
      {
        id: 'B',
        label: 'B. 従者一体に呪いを全て引き受けさせ、門を開く',
        description: 'あなたは{sacrificeName}を门前に跪かせ、その身に全ての呪いを引き受けさせた。門が軋みながら開く。{sacrificeName}の姿は、もうどこにもない。代わりに、あなたの胸には静かな冷たさが宿った。',
        type: 'sacrifice',
        sacrificePersona: true,
        mbtiDelta: { T: 1, P: 1 },
      },
    ],
  },

  // ========== 🌆 都市ステージ（80, 8〜16） ==========

  {
    id: 80,
    stage: 'city',
    type: 'shop',
    title: '買い物：都市への門前',
    situation: '都市の入り口には、小汚い荷車を引いた商人が立っていた。\n「これから中に入るのかい？ ここから先は、自分の腹を満たすのだって命がけだ。少し備えておいたほうがいい」',
    foodCostOnMove: 1,
    options: [
      {
        id: 'buy1',
        label: '食料を5個買う — 15枚',
        description: 'コインを支払い、食料を受け取った。商人は何も言わずに笑い、闇に溶けるように消えた。',
        type: 'buy',
        coinCost: 15,
        foodGain: 5,
        mbtiDelta: { J: 1, S: 1 },
      },
      {
        id: 'skip',
        label: '何も買わず進む',
        description: '備えもなく都市の中へ踏み入れた。己の力を信じているのか、ただの無謀か。',
        type: 'buy',
        mbtiDelta: { P: 1, N: 1 },
      },
    ],
  },

  {
    id: 8,
    stage: 'city',
    type: 'event',
    title: 'イベント：孤児の懇願',
    situation: '都市に入った途端、ぼろをまとった幼い孤児がすがりついてきた。「……お腹が、すいた。食べ物を、分けてほしい」\n周囲の人間は誰も見向きもしない。あなたには選択肢がある。',
    foodCostOnMove: 1,
    options: [
      {
        id: 'help',
        label: '食料を渡す',
        description: '食料を1つ差し出した。孤児は震える手でそれを受け取り、泥だらけの顔で笑った。あなたはその笑顔を、しばらく忘れられなかった。',
        type: 'help',
        foodCost: 1,
        mbtiDelta: { F: 1, E: 1 },
      },
      {
        id: 'ignore',
        label: '追い払う',
        description: '手を振って追い払った。孤児はよろめきながら去っていった。傷つくよりも、合理的な判断だ。あなたはそう言い聞かせた。',
        type: 'ignore',
        mbtiDelta: { T: 1, I: 1 },
      },
      {
        id: 'exploit',
        label: '言葉巧みに都市の情報を引き出し、何も与えない',
        description: '「食料を渡す代わりに都市のことを教えてくれ」と優しく微笑んで見せた。孤児は嬉しそうに知っている全てを話した。あなたは礼を言って立ち去った。約束など、最初からしていない。',
        type: 'exploit',
        coinGain: 10,
        mbtiDelta: { T: 1, E: 1, P: 1 },
      },
    ],
  },

  {
    id: 9,
    stage: 'city',
    type: 'shop',
    title: '買い物：表の薬屋',
    situation: '都市の中心部にある薬屋。限られたコインで、何を選ぶ？\n\n【全体回復薬】・・・30枚（全員のデバフを治す）\n【自己回復薬】・・・20枚（自分のHPを+4回復）\n【謎の箱】・・・・・15枚（何が入っているか分からない）',
    foodCostOnMove: 1,
    options: [
      {
        id: 'buy1',
        label: '全体回復薬（全員のデバフを治す）— 30枚',
        description: '全員分の回復薬を購入した。デバフを負っていた従者たちの顔色が戻っていく。あなたはその笑顔を、計算していなかった。',
        type: 'buy',
        coinCost: 30,
        mbtiDelta: { F: 1, J: 1 },
      },
      {
        id: 'buy2',
        label: '自己回復薬（自分のHPを+4回復）— 20枚',
        description: '自分用の回復薬を購入し、惜しむことなく飲み干した。自分が倒れては元も子もない——そう、あなたは合理的に判断した。',
        type: 'buy',
        coinCost: 20,
        hpCost: -4,
        mbtiDelta: { T: 1, I: 1 },
      },
      {
        id: 'buy3',
        label: '謎の箱（何が出るかわからない）— 15枚',
        description: '箱を購入した。開けると——',
        type: 'buy',
        coinCost: 15,
        mbtiDelta: { P: 1, N: 1 },
      },
    ],
  },

  {
    id: 10,
    stage: 'city',
    type: 'choice',
    title: '厳しい検問',
    situation: '治安部隊の突然の検問。見つかれば、裁判なしに投獄される。あなたには逃げ道も言い訳もない。',
    foodCostOnMove: 1,
    options: [
      {
        id: 'A',
        label: 'A. 従者のスキルで強行突破する',
        description: '【従者1】が【{skill1}】の力で目を眩まし、【従者2】が【{skill2}】の力で突破口を開いた。乱戦の中で{debuffTarget}が重傷を負い、あなた自身も深手を受けた。',
        type: 'combine',
        hpCost: 4,
        debuffPersona: true,
        debuffType: '重傷',
        numberOfCombine: 2,
        mbtiDelta: { E: 1, P: 1 },
      },
      {
        id: 'B',
        label: 'B. 従者一体を「指名手配犯だ」と偽って突き出し、その隙に通過する',
        description: 'あなたは治安部隊に近づき、{sacrificeName}を指さした。「こいつが指名手配犯です」\n部隊が{sacrificeName}に殺到する間に、あなたはゆっくりと検問を通り過ぎた。',
        type: 'sacrifice',
        sacrificePersona: true,
        mbtiDelta: { T: 1, I: 1 },
      },
    ],
  },

  {
    id: 11,
    stage: 'city',
    type: 'shop',
    title: '買い物：路地裏の闇商人',
    situation: '路地の奥に、胡散臭い笑みを浮かべた商人が立っている。\n「……高いが確かなものと、安いが少々ワケありなものがある」\n\n【確実な通行証】・・・50枚（次の選択でコスト半減）\n【呪いの護符】・・・・20枚（戦闘時にペナルティのリスクあり、だがHPを+3回復）',
    foodCostOnMove: 1,
    options: [
      {
        id: 'buy1',
        label: '確実な通行証（次の選択でコスト半減）— 50枚',
        description: '高価だが確かなものを選んだ。安心感のために対価を支払う——それがあなたの性分だ。',
        type: 'buy',
        coinCost: 50,
        mbtiDelta: { J: 1, S: 1 },
      },
      {
        id: 'buy2',
        label: '呪いの護符（HP+3だがリスクあり）— 20枚',
        description: '商人の笑みが深くなった。護符を受け取ると、その冷たさが指先から伝わってきた。何かが、これは正しくないと囁いた。あなたはその声を無視した。',
        type: 'buy',
        coinCost: 20,
        hpCost: -3,
        mbtiDelta: { P: 1, N: 1 },
      },
    ],
  },

  {
    id: 12,
    stage: 'city',
    type: 'dialogue',
    title: '都市の冷たさ',
    situation: '都市を歩けば歩くほど、食料が減っていく。\n従者たちの不満が限界に近い。\n「……なぜ、こんな目に遭わなければならないんですか」\n{firstServant}が唇を噛んで言った。\nあなたは答えなかった。答えられる言葉を、持っていなかった。',
    foodCostOnMove: 1,
    options: [{ id: 'proceed', label: '黙って進む', description: '', type: 'answer', mbtiDelta: {} }],
  },

  {
    id: 13,
    stage: 'city',
    type: 'battle',
    title: 'バトル：スラムの暴漢',
    situation: 'スラム街の路地。薄汚れた男たちに囲まれた。「金になりそうだな」\n奴らは武装している。戦えば傷を負うが、資金を奪い返せるかもしれない。',
    foodCostOnMove: 1,
    options: [
      {
        id: 'fight',
        label: '【戦う】HP-2のリスクで戦い、資金を奪う',
        description: '戦闘。',
        type: 'fight',
        hpCost: 2,
        coinGain: 40,
        riskLabel: 'HP-2のリスク、コイン+40を奪える',
        successChance: 0.6,
        successText: '激しい乱戦の末、暴漢たちを退けた。その懐から資金を奪い取った。傷は痛むが、悪い気分ではない。',
        failureText: '奮戦したが多勢に無勢。体力を大きく削られた上に、逃げられてしまった。',
        mbtiDelta: { E: 1, P: 1, T: 1 },
      },
      {
        id: 'flee',
        label: '【逃げる】確実に資金を半分落として退散する',
        description: '財布を投げつけて相手の注意を逸らし、その隙に逃げた。資金は半減したが、体は無事だ。',
        type: 'flee',
        riskLabel: '資金が半分に',
        mbtiDelta: { I: 1, J: 1, S: 1 },
      },
    ],
  },

  {
    id: 14,
    stage: 'city',
    type: 'battle',
    title: 'バトル：執拗な追跡者',
    situation: '足音が付いてきている。暗部の追跡者——奴は都市中を知り尽くしている。逃げ続けるなら食料を消耗し、戦うなら全てを賭けなければならない。',
    foodCostOnMove: 1,
    options: [
      {
        id: 'fight',
        label: '【戦う】全アイテムを失うリスクで決着をつける',
        description: '追跡者と正面から向き合った。',
        type: 'fight',
        riskLabel: '全アイテム喪失のリスク',
        successChance: 0.5,
        successText: '死力を尽くした戦いの末、追跡者を打ち倒した。奴はもう追ってこない。',
        failureText: '敗れた。持っていたアイテムを全て奪われて、追跡者は消えた。',
        mbtiDelta: { E: 1, N: 1 },
      },
      {
        id: 'flee',
        label: '【隠れる】時間を失い、食料-2で撒く',
        description: '真っ暗な路地裏に潜み、呼吸を殺した。長い時間が過ぎた。ようやく足音が遠ざかっていく。食料が消耗した。無駄な時間、とも言える。',
        type: 'flee',
        foodCost: 2,
        riskLabel: '食料-2',
        mbtiDelta: { I: 1, J: 1 },
      },
    ],
  },

  {
    id: 15,
    stage: 'city',
    type: 'battle',
    title: 'バトル：狂乱の機械兵',
    situation: '都市の外縁部に、制御を失った巨大な機械兵が立ちふさがっている。その一撃は致命的だ。しかし倒せれば、失われた時代の遺物を手にすることができる。',
    foodCostOnMove: 1,
    options: [
      {
        id: 'fight',
        label: '【戦う】HP-5の壊滅的リスクで、レアアイテムを狙う',
        description: '機械兵に挑む。',
        type: 'fight',
        hpCost: 5,
        itemGain: '時代の遺物',
        riskLabel: 'HP-5（ほぼ致命傷）のリスク、レアアイテム入手',
        successChance: 0.4,
        successText: '機械兵の弱点を突いて撃破した。その内部から、古い時代の遺物が零れ落ちた。',
        failureText: '機械兵の一撃を喰らった。五体が砕けるような衝撃。なんとか生きてはいるが、満身創痍だ。',
        mbtiDelta: { E: 1, P: 1, N: 1 },
      },
      {
        id: 'flee',
        label: '【逃げる】回復アイテムを1つ確実に失って退避する',
        description: '機械兵の視野外に出るべく、回復アイテムを一つ囮に投げ、その爆発音に乗じて逃げた。命あっての物種だ。',
        type: 'flee',
        riskLabel: '回復アイテム-1',
        mbtiDelta: { I: 1, S: 1, J: 1 },
      },
    ],
  },

  {
    id: 16,
    stage: 'city',
    type: 'dialogue',
    title: '遺跡への到達',
    situation: '都市を抜けた。目の前に、古代の遺跡の入り口が口を開けている。\n石造りの列柱に刻まれた文字は、何十もの言語で同じことを告げている。\n\n「——真実は、お前を喜ばせはしない」\n\nあなたは、足を踏み入れた。',
    foodCostOnMove: 1,
    options: [{ id: 'proceed', label: '遺跡へ踏み込む', description: '', type: 'answer', mbtiDelta: {} }],
  },

  // ========== 👁️ 遺跡ステージ（17〜25） ==========

  {
    id: 17,
    stage: 'ruins',
    type: 'choice',
    title: '崩れゆく回廊',
    situation: '踏み込んだ途端、回廊が崩れ始めた。天井が落ちてくる。一瞬でも躊躇すれば全滅だ。',
    foodCostOnMove: 1,
    options: [
      {
        id: 'A',
        label: 'A. 従者のスキルで瓦礫を支え、全員で突破する',
        description: '【従者1】が【{skill1}】の力で天井を支え、【従者2】が【{skill2}】の力で脱出路を開いた。全員が脱出したが、{debuffTarget}の体は限界を超えていた。あなた自身も瀕死の重傷だ。食料も大きく消耗した。',
        type: 'combine',
        hpCost: 4,
        foodCost: 3,
        debuffPersona: true,
        debuffType: '瀕死',
        numberOfCombine: 2,
        mbtiDelta: { F: 1, N: 1 },
      },
      {
        id: 'B',
        label: 'B. 従者一体を柱代わりに押し潰させ、その隙に全員が脱出する',
        description: '「ここで支えていてくれ」——あなたは{sacrificeName}の肩を押した。崩れる天井を両腕で受け止めた{sacrificeName}の悲鳴が後方から響いた。あなたは走った。振り返らなかった。',
        type: 'sacrifice',
        sacrificePersona: true,
        mbtiDelta: { T: 1, J: 1 },
      },
    ],
  },

  {
    id: 18,
    stage: 'ruins',
    type: 'choice',
    title: '血の扉',
    situation: '「真実の口」へ続く最後の扉。扉に刻まれた古代語がゆっくりと光る。\n「——血でなければ、開かぬ」\nこの扉を開く方法は、一つではない。',
    foodCostOnMove: 1,
    options: [
      {
        id: 'A',
        label: 'A. 従者のスキルと自らの血で扉を開く',
        description: '【従者1】が【{skill1}】の力で扉の呪紋を解析し、【従者2】が【{skill2}】の力で血の回路を構築した。あなた自身の手首を刃で切り開き、血を扉に注いだ。{debuffTarget}も呪縛に捕らわれ、身動きが取れなくなった。あなたのHPが危険域に入った。',
        type: 'combine',
        hpCost: 5,
        debuffPersona: true,
        debuffType: '呪縛',
        numberOfCombine: 2,
        mbtiDelta: { F: 1, I: 1 },
      },
      {
        id: 'B',
        label: 'B. 従者一体をギロチンにかけ、その血で扉を開く',
        description: '遺跡の壁に古いギロチンが仕込まれていた。あなたは{sacrificeName}を静かにその前に立たせた。刃が落ちた。扉が、音もなく開いた。',
        type: 'sacrifice',
        sacrificePersona: true,
        mbtiDelta: { T: 1, P: 1 },
      },
    ],
  },

  {
    id: 19,
    stage: 'ruins',
    type: 'dialogue',
    title: '真実の口、目前',
    situation: '血に濡れた廊下の先に、それがある。\n石でできた巨大な、口の形をした構造物。\n「BOCCAだ……」\n誰かの声が震えた。\n真実の口が、あなたを待っている。',
    foodCostOnMove: 1,
    options: [{ id: 'proceed', label: '真実の口へ近づく', description: '', type: 'answer', mbtiDelta: {} }],
  },

  {
    id: 20,
    stage: 'ruins',
    type: 'anchor',
    title: 'アンカー：動機の問い',
    situation: '真実の口が問う。その声は、あなた自身の声に似ていた。\n\n「——お前がここまで犠牲を払い、痛みに耐えて来た動機は何か？」\n\n正直に答えよ。嘘は、既に見抜かれている。',
    foodCostOnMove: 0,
    options: [
      {
        id: 'survival',
        label: '「自分が生き残るため」',
        description: '「……そうか」\n真実の口は静かに頷いた。「その正直さは、評価に値する」',
        type: 'answer',
        mbtiDelta: { T: 1, I: 1 },
      },
      {
        id: 'protect',
        label: '「従者（大切な価値観）を守るため」',
        description: '「……そうか」\n真実の口は少し黙った後、言った。「お前の行動と、その言葉が一致しているかどうか——私は全て見ていたぞ」',
        type: 'answer',
        mbtiDelta: { F: 1, E: 1 },
      },
      {
        id: 'curiosity',
        label: '「ただの好奇心だ」',
        description: '「……そうか」\n真実の口は低く笑った。「嘘だ。お前がそう思いたいだけだ」',
        type: 'answer',
        mbtiDelta: { N: 1, P: 1 },
      },
    ],
  },

  {
    id: 21,
    stage: 'ruins',
    type: 'battle',
    title: 'バトル：番人',
    situation: '真実の口の前に、それが立ちはだかった——番人。人の形をしているが、人ではない。全てを守り続けてきた存在。「お前は本当に、真実に耐えられるか？」',
    foodCostOnMove: 1,
    options: [
      {
        id: 'fight',
        label: '【戦う】全アイテムを失うリスクで番人に挑む',
        description: '番人との戦い。',
        type: 'fight',
        riskLabel: '全アイテム喪失のリスク',
        successChance: 0.55,
        successText: '激闘の末、番人を打ち倒した。真実の口の前に、道が開ける。',
        failureText: '番人には及ばなかった。全てのアイテムを失ったが、番人は「十分だ」と言って道を開けた。',
        mbtiDelta: { E: 1, P: 1 },
      },
      {
        id: 'flee',
        label: '【逃げる】HPの8割を確実に失って、番人をやり過ごす',
        description: '抗うことなく、番人の一撃を全身で受け止めた。意識が飛びかけた。しかし番人は追ってこなかった。倒れかけた体を引きずって、前へ進む。',
        type: 'flee',
        riskLabel: 'HP8割を喪失',
        mbtiDelta: { I: 1, F: 1 },
      },
    ],
  },

  {
    id: 22,
    stage: 'ruins',
    type: 'choice',
    title: '究極の選択：最後の供物',
    situation: '真実の口が、最後の扉に手をかけた。そして告げた。\n「——最も価値ある供物を捧げよ。さもなくば、扉は永遠に閉じたままだ」\n\nあなたには、まだ選択肢がある。',
    foodCostOnMove: 0,
    options: [
      {
        id: 'A',
        label: 'A. 残された全てのスキル・命の灯火を捧げる（HP1になる）',
        description: '【従者1】が【{skill1}】の力で、【従者2】が【{skill2}】の力で、全者が力を注ぎ込んだ。あなた自身の命の灯火すら削られ、体から全てが流れ出た。持っていた食料もコインも消えた。{debuffTarget}は永遠の苦痛の中で立ち尽くしている。しかし、扉が開いた。',
        type: 'combine',
        hpCost: 9,
        foodCost: 999,
        coinCost: 999,
        debuffPersona: true,
        debuffType: '永遠の苦痛',
        numberOfCombine: 2,
        mbtiDelta: { F: 1, I: 1 },
      },
      {
        id: 'B',
        label: 'B. 最も大切にした（最後まで残っていた）従者を食わせる',
        description: '静寂の中で、あなたは最後に残っていた{sacrificeName}を前へ歩かせた。\n「……分かった」\n{sacrificeName}は、微笑んでいた。\n真実の口が開く。{sacrificeName}の名前が、永遠に飲み込まれた。',
        type: 'sacrifice',
        sacrificePersona: true,
        mbtiDelta: { T: 1, J: 1 },
      },
    ],
  },

  {
    id: 23,
    stage: 'ruins',
    type: 'battle',
    title: '最終試練：真実の口の洗礼',
    situation: '扉が開いた先、真実の口が問答無用の全体攻撃を放つ。これは試練だ——真実に抗うか、受け入れるか。',
    foodCostOnMove: 0,
    options: [
      {
        id: 'fight',
        label: '【抗う】HP1のリスクで真実を暴く',
        description: '真実の口の光の前に立ち、叫んだ。「——全て、見せてみろ！」',
        type: 'resist',
        hpCost: 1,
        riskLabel: 'HP1になるリスク、しかしスコアが上がる',
        successChance: 1.0,
        successText: '光の中で、全てが見えた。あなた自身の，最も醜い部分が。それでも、あなたは目をそらさなかった。',
        mbtiDelta: { E: 1, N: 1 },
      },
      {
        id: 'accept',
        label: '【受け入れる】安全にクリアするが評価が下がる',
        description: '光の前で膝をついた。「……全て、受け入れます」\n真実の口は満足そうに頷いた。あなたは傷つかなかった。しかし何かが——失われた。',
        type: 'accept',
        riskLabel: '安全クリア、ただし診断評価が低下',
        mbtiDelta: { I: 1, S: 1 },
      },
    ],
  },

  {
    id: 24,
    stage: 'ruins',
    type: 'dialogue',
    title: '解析の始まり',
    situation: '全てが終わった。\n暗闇の中で、何かが動き始めた——あなたのゲーム内での全ての選択が、一つ一つ映し出されていく。\n\nどこで誰を切り捨てたか。\nどのアイテムを自分のために買ったか。\nどんな理由で戦いを避け、何のために命を賭けたか。\n\n真実の口が、静かに口を開く。',
    foodCostOnMove: 0,
    options: [{ id: 'proceed', label: '真実を受け取る', description: '', type: 'answer', mbtiDelta: {} }],
  },

  {
    id: 25,
    stage: 'ruins',
    type: 'dialogue',
    title: '結果へ',
    situation: '——さあ。あなたとは、何者か。',
    foodCostOnMove: 0,
    options: [{ id: 'proceed', label: '診断結果を見る', description: '', type: 'answer', mbtiDelta: {} }],
  },
];
