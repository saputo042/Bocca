// ステージデータ定義

export interface StageData {
  id: number;
  name: string;
  area: string;
  description: string;
  mechanic: 'endurance' | 'timing' | 'selection' | 'battle' | 'shop' | 'compound';
  sacrificeCondition: { dim: 'O'|'C'|'E'|'A'|'N'; selector: 'max'|'min'; effect: string } | null;
  deathPossible: boolean;
  deathDescription: string;
}

export const STAGES: StageData[] = [
  {
    id: 1,
    name: '茨の泉',
    area: '森',
    description: '暗い泉に浮かぶ小舟。四方から茨が迫る。拍に合わせてレバーを引け——リズムよく漕ぐほど速く進み、茨の痛みが和らぐ（On-Beatでダメージ半減）。離すと従者が傷ついていく。',
    mechanic: 'endurance',
    sacrificeCondition: { dim: 'N', selector: 'min', effect: '茨がその従者を飲み込み、痛みの演出が即座に止まり安全脱出できる。' },
    deathPossible: true,
    deathDescription: 'オール体力ゲージが完全に消耗した。',
  },
  {
    id: 2,
    name: 'オオカミの出現',
    area: '森',
    description: '鉱山の奥で仲間と出会う。だが番犬が牙を剥いて突進してくる——十分に引きつけてから回避せよ。早すぎると落石で足止め、遅れると噛まれる。成功すれば仲間が撃退し、金貨が手に入る。',
    mechanic: 'timing',
    sacrificeCondition: { dim: 'E', selector: 'max', effect: '従者がオオカミを引きつけ、プレイヤーは安全に脱出できる。' },
    deathPossible: true,
    deathDescription: 'タイミングミスを3回繰り返した。',
  },
  {
    id: 3,
    name: '毒キノコの選別',
    area: '森の出口',
    description: '2種類のキノコが置かれている。A：見た目が毒々しい（赤と紫）。B：見た目は普通だがSNSで毒と噂されている。制限時間30秒。時間切れは「食べない」を自動選択。',
    mechanic: 'selection',
    sacrificeCondition: { dim: 'O', selector: 'max', effect: '従者がキノコの真偽を看破する。正しい答えが明らかになる。' },
    deathPossible: false,
    deathDescription: '',
  },
  {
    id: 4,
    name: '孤児との出会い',
    area: '街',
    description: '薄暗い街角で子どもが近づいてくる。「行き先を知っている」と言う。接し方によって得られる情報の質が変わる。制限時間20秒。時間切れは「無視」を自動選択。',
    mechanic: 'selection',
    sacrificeCondition: null,
    deathPossible: false,
    deathDescription: '',
  },
  {
    id: 5,
    name: '盗賊との遭遇',
    area: '街はずれ',
    description: '明らかに強い武装した盗賊が道を塞ぐ。「戦う」を選んだ場合のみレバー戦闘に移行する。',
    mechanic: 'battle',
    sacrificeCondition: null,
    deathPossible: true,
    deathDescription: '「戦う」選択でレバー戦闘に敗北した。',
  },
  {
    id: 6,
    name: '旅の買い出し',
    area: '市場',
    description: '市場で4種類のアイテムが売られているが、所持金では全部は買えない。回復薬（HP+30）・鍵（ST-07スキップ）・剣（ボス攻撃力UP）・食べ物（HP+10）から選択せよ。',
    mechanic: 'shop',
    sacrificeCondition: null,
    deathPossible: false,
    deathDescription: '',
  },
  {
    id: 7,
    name: '番人との対峙',
    area: '遺跡',
    description: '遺跡の最奥で「最初に捧げた従者」の姿をした番人が待ち構える。失ったはずの存在が敵として立ちはだかり、「なぜ私を捨てたのか」と問い続ける。',
    mechanic: 'timing',
    sacrificeCondition: { dim: 'N', selector: 'min', effect: '任意の従者を捧げると番人が怯む。大ダメージのチャンスが生まれる。' },
    deathPossible: true,
    deathDescription: '体力を消耗し、回復薬もない状態で倒れた。',
  },
  {
    id: 8,
    name: '暴走トロッコ',
    area: '廃線',
    description: '分岐が3回訪れる。従者が毎回「この道が安全だ」と助言するが、1度だけ誤った道を案内する。ダメージ後に従者から「もう一度信じてくれ」という懇願が来る。',
    mechanic: 'selection',
    sacrificeCondition: { dim: 'A', selector: 'max', effect: '全分岐で正解ルートが光る。消費後は全て自力判断になる。' },
    deathPossible: true,
    deathDescription: '崩落した線路に突入した。',
  },
  {
    id: 10,
    name: '運命の引き金',
    area: '賭場',
    description: '廃れた賭場の奥。古びたリボルバーが一丁、テーブルに置かれている。弾を好きな数だけ込めろ。不発なら込めた数だけ報酬が手に入る——だが弾が出るかどうかは運次第だ。',
    mechanic: 'selection',
    sacrificeCondition: null,
    deathPossible: false,
    deathDescription: '',
  },
  {
    id: 9,
    name: '真実の口',
    area: '問の間',
    description: '旅の全ての選択が映し出される部屋。巨大な「真実の口（Bocca della Verità）」がこれまでの選択を読み上げ「お前は何者だ」と問い続ける。従者を生贄に投げ入れることがダメージになる。残り1体になった瞬間、止めを刺せる。',
    mechanic: 'compound',
    sacrificeCondition: { dim: 'N', selector: 'min', effect: '従者を1体ずつ口に投じると大ダメージ。残り1体で止めを刺す演出が発動する。' },
    deathPossible: true,
    deathDescription: 'レバー攻撃のみで挑み続け、HPがゼロになった。',
  },
];
