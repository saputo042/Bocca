// Bucca 終幕シーン

import { determineEnding } from '../data/endings';
import { TAROT_SYMBOLS } from '../data/tarot';
import {
  getState, resetState, navigateTo,
  typewriter, createParticles, sleep, fadeIn,
  type GameState,
} from '../utils/gameState';
import { playSFX, playAmbienceForScene } from '../utils/audio';

const TYPE_COLORS: Record<string, string> = {
  BEST: '#C9A227',
  GOOD: '#10b981',
  NORMAL: '#6b7280',
  DEEP: '#8b5cf6',
  SPECIAL: '#f59e0b',
  SECRET: '#64748b',
  BAD: '#9b1c1c',
};

// ===============================
// 性格ナラティブ生成（「真実の口の裁定」）
// ===============================

function generatePersonalityNarrative(
  bf: { O: number; C: number; E: number; A: number; N: number },
  state: GameState
): string {
  const paragraphs: string[] = [];

  // 支配的な軸と最弱軸を特定
  const traits = [
    { key: 'O', val: bf.O },
    { key: 'C', val: bf.C },
    { key: 'E', val: bf.E },
    { key: 'A', val: bf.A },
    { key: 'N', val: bf.N },
  ];
  const sorted = [...traits].sort((a, b) => b.val - a.val);
  const dom = sorted[0].key;
  const sub = sorted[1].key;
  const weak = sorted[4].key;

  // ── 第1段落：本質の宣告 ──
  const coreMap: Record<string, string> = {
    O: 'お前の本質は「好奇心」だ。未知の扉の前で躊躇わない——それが旅を通してお前を動かし続けた衝動だ。新しいものへの渇望は、時に無謀さと見分けがつかない。しかしその本能こそが、多くの者が諦めた先へお前を導く。',
    C: 'お前の本質は「意志」だ。決めたことをやり遂げる力——それが旅の基軸だった。混沌の中でも秩序を見出そうとする執念が、幾つもの試練を乗り越えさせた。完璧主義の鎧は強いが、時に重い。',
    E: 'お前の本質は「熱量」だ。他者との摩擦の中でこそ輝く——旅を通じてお前が最も生きていた瞬間は、何かと対峙した瞬間だった。孤独よりも接触を、静よりも動を——それがお前の燃料だ。',
    A: 'お前の本質は「繋がり」だ。他者を感じ、共鳴し、手を差し伸べる——その衝動が旅の判断を決定づけた。その共感は才能だ。しかし問う——どこまでが本当の優しさで、どこからが自分を守る盾だったか。',
    N: 'お前の本質は「感度」だ。痛みも歓びも、人より深く感じる。その感情の振れ幅が判断を揺らすこともある——しかし同時に、他の者が気づかない小さな変化を捉える力でもある。感じやすさとは、弱さではない。',
  };

  const coreDesc = coreMap[dom];
  if (coreDesc) {
    // 2位の軸で修飾
    const subAdditions: Record<string, Record<string, string>> = {
      O: {
        C: 'そしてお前の好奇心には、珍しく計画性が伴う。ただ突き進むだけでなく、地図を持って踏み込む探索者だ。',
        E: 'その好奇心は、他者との交流でより燃え盛る。一人で黙考するより、誰かと話す中でひらめく型だ。',
        A: 'その好奇心は、相手を深く知ることへの渇望でもある。人間そのものへの興味——それが強い。',
        N: 'その好奇心には、感情的な繊細さが混じっている。感動しやすく、傷つきやすい——だがそれがお前の観察眼を鋭くする。',
      },
      C: {
        O: 'しかしお前の意志の根底には、知ることへの欲がある。規律と好奇心——その組み合わせは稀だ。',
        E: 'お前の誠実さは、他者の前で最も輝く。一人での達成より、誰かと共に目標を達成することに満足を見出す。',
        A: '誠実さと協調性——お前は約束を守り、他者を傷つけることを嫌う。その信頼感は、かけがえない資産だ。',
        N: '強い意志の裏に、感情の揺れがある。揺れを知っているからこそ、規律で自分を縛る——そういう人間だ。',
      },
      E: {
        O: '外向的なエネルギーに、好奇心が加わる。新しい人・場所・体験を求めて動き続けるタイプだ。',
        C: '外向性に誠実さが加わると、周囲への影響力が増す。お前が動けば、周りも動く。',
        A: '外向性と協調性——社交の達人だ。集団の中でエネルギーを発揮し、周囲を引き上げる力がある。',
        N: '外向きのエネルギーと感情の揺れが共存する。表では明るく、内では複雑——その二面性がお前の深さだ。',
      },
      A: {
        O: '共感に好奇心が加わる——お前は人間そのものへの興味が尽きない。他者の内面を理解することに喜びを覚える。',
        C: '共感と誠実さ——お前が信頼される理由は、その組み合わせだ。言ったことをやる、感じたことを大切にする。',
        E: '協調性と外向性の組み合わせは、自然なリーダーを生む。お前は命令ではなく、共感で人を動かす。',
        N: '共感が深く、感情も揺れやすい。他者の痛みを自分のものとして感じてしまう——その重さがお前を削ることもある。',
      },
      N: {
        O: '感情の揺れに、好奇心が混じる。不安の中にも「これはどういうことか」という知的衝動が湧く——そのエネルギーが迷宮を抜けさせた。',
        C: '感情的な揺れを、意志の力で制御しようとする。そのせめぎ合いがお前を駆り立てる原動力だ。',
        E: '感情が表に出やすく、他者との摩擦も多い。しかしその正直さが、深い繋がりを生むこともある。',
        A: '感情が豊かで、共感も深い。お前は他者の痛みを自分のものとして感じる——それが重荷にも、財産にもなる。',
      },
    };
    const addition = subAdditions[dom]?.[sub] ?? '';
    paragraphs.push(coreDesc + (addition ? ' ' + addition : ''));
  } else {
    paragraphs.push('お前の性格は均衡している。特定の型に収まらず、状況に応じて異なる顔を見せる。その適応力は強みだが、自分の核心が見えにくいとも言える。');
  }

  // ── 第2段落：プレイ選択の読み解き ──
  const observations: string[] = [];

  // 犠牲パターン
  if (state.sacrificeCount === 0) {
    observations.push('旅を通じて、お前は誰一人として犠牲にしなかった。それは深い愛着か、あるいは選べない恐れか——どちらであれ、全員が生き残ったという事実は変わらない。');
  } else if (state.sacrificeCount === 1) {
    const first = state.servants.find(s => s.id === state.firstSacrificedId);
    observations.push(`${first ? `${first.name}——` : ''}一体のみを差し出した。その一つの決断にお前の全てが凝縮されている。最初の選択こそが、最も素直な自己開示だ。`);
  } else if (state.sacrificeCount >= 5) {
    const first = state.servants.find(s => s.id === state.firstSacrificedId);
    observations.push(`${state.sacrificeCount}体を旅の中で手放した。${first ? `最初に差し出したのは${first.name}。` : ''}それだけの決断を下せる者——お前は何かに駆り立てられていたか、それとも計算だったか。残された従者はいまも問いに答えを求めている。`);
  } else {
    const first = state.servants.find(s => s.id === state.firstSacrificedId);
    observations.push(`${state.sacrificeCount}体の従者を旅の中で手放した。${first ? `最初に差し出したのは${first.name}——` : ''}その選択の積み重ねが、お前という人間を語る。`);
  }

  // 孤児の選択
  if (state.orphanChoice === 'ignore') {
    observations.push('孤児を無視した。急いでいたのか、信じなかったのか——理由は何であれ、その瞬間お前は閉じることを選んだ。人間は完全に開いていることはできない。それでいい。');
  } else if (state.orphanChoice === 'talk') {
    observations.push('孤児に話しかけた。見知らぬ子どもに時間を割くその判断——計算ではなかったはずだ。本能がそうさせた。');
  } else if (state.orphanChoice === 'money') {
    observations.push('孤児にコインを渡した。言葉よりも行動で示す——それがお前のやり方だ。');
  } else if (state.orphanChoice === 'guide') {
    observations.push('孤児に案内を頼んだ。助けを求めることを恥じない者は、内側に強さを持つ。');
  }

  // ST-08 裏切り後の信頼
  if (state.st08TrustAfterBetrayal === false) {
    observations.push('従者が嘘をついた後、お前はその助言を切り捨てた。一度傷つけられた信頼を再び与えることを、お前は拒んだ。');
  } else if (state.st08TrustAfterBetrayal === true) {
    observations.push('裏切りの後でも、お前はもう一度従者を信じた。それを無謀と呼ぶ者もいる。しかしその選択が、時に最も深い繋がりを生む。');
  }

  if (observations.length > 0) {
    paragraphs.push(observations.join('　'));
  }

  // ── 第3段落：矛盾・影・深層 ──
  const contradictions: string[] = [];

  if (bf.A > 0.6 && state.orphanChoice === 'ignore') {
    contradictions.push('協調性が高いはずのお前が、孤児を無視した。理想と行動の乖離——それが人間だ。完璧な共感など存在しない。お前はただ、その瞬間疲れていたのかもしれない。');
  } else if (bf.A < 0.35 && (state.orphanChoice === 'talk' || state.orphanChoice === 'money')) {
    contradictions.push('独立心が強く競争的なはずのお前が、孤児に手を差し伸べた。スコアが語れないものを、お前は持っている。');
  }

  if (bf.N > 0.6 && state.sacrificeCount === 0) {
    contradictions.push('感情的に揺れやすいお前が、一体も手放さなかった。その執着——守り抜こうとする感情的な強さ——がお前の真の姿かもしれない。');
  } else if (bf.N < 0.35 && state.sacrificeCount >= 4) {
    contradictions.push('感情的に安定したお前が、躊躇なく多くを切り捨てた。それを冷静と呼ぶか、冷淡と呼ぶか——答える義務はない。ただ問うべきだ：その判断に後悔はないか、と。');
  }

  if (bf.C > 0.65 && state.stageLog.some(l => l.outcome === 'fail')) {
    contradictions.push('計画性が高いお前も、失敗した。それが旅だ。完璧な意志も、予測不能な現実には折れる。折れた経験が、お前を本当に強くする。');
  }

  if (bf.O < 0.35 && state.stageLog.filter(l => l.outcome === 'success').length >= 6) {
    contradictions.push('保守的で安定を好むはずのお前が、多くの試練を乗り越えた。数字が語れない「地力」がお前にはある。');
  }

  if (contradictions.length > 0) {
    paragraphs.push(contradictions[0]);
  }

  // ── 第4段落：盲点・影の軸 ──
  const shadowMap: Record<string, string> = {
    O: '弱点は「根付き」だ。新しいものを追い続けるお前は、一つのものを深く掘り下げることを後回しにしがちだ。探索は力だが、根を張ることも力だ。',
    C: '弱点は「硬直」だ。計画に縛られすぎると、予期しない変化に対応できない。規律が時に、可能性の扉を閉じる。',
    E: '弱点は「静寂の中の自己」だ。誰もいない場所で、お前はどれだけ自分と向き合えるか。熱量の源が他者に依存する限り、孤独は常に脅威となる。',
    A: '弱点は「自己の喪失」だ。他者に合わせ続けるうちに、自分が何を望むか見えなくなることがある。共感は武器だが——お前自身の境界線はどこにある？',
    N: '弱点は「消耗」だ。全てを深く感じるお前は、感情的疲弊に晒されやすい。感じる力を守るために、時に壁が必要だ。それは冷たさではなく、自衛だ。',
  };
  const shadowDesc = shadowMap[weak];
  if (shadowDesc) paragraphs.push(shadowDesc);

  // ── 第5段落：鼓動の記録（リズムログ） ──
  const rhythmLog = state.rhythmLog;
  if (rhythmLog.length > 0) {
    const total = rhythmLog.length;
    const onBeatCount = rhythmLog.filter(e => e.isOnBeat).length;
    const ratio = onBeatCount / total;

    let rhythmPara = '';

    if (state.finaleOnBeat) {
      if (ratio >= 0.7) {
        rhythmPara = `BOCCAは、お前の鼓動を聞いていた。${total}回の行動のうち${onBeatCount}回——拍の瞬間にお前は動いた。そして最後の一撃も、音楽と一致した。内側と外側が合わさるとき、人は何かを超える。`;
      } else if (ratio >= 0.4) {
        rhythmPara = `BOCCAは、お前の鼓動を聞いていた。旅を通じてお前のリズムは安定しなかった——しかし最後の瞬間だけは違った。終止符は、拍とともに打たれた。`;
      } else {
        rhythmPara = `BOCCAは、お前の鼓動を聞いていた。旅の大半でお前は音楽から外れていた。それでも最後の一音は合わさった——混沌の中に宿る、一瞬の調和だ。`;
      }
    } else {
      if (ratio >= 0.7) {
        rhythmPara = `BOCCAは、お前の鼓動を聞いていた。${total}回の行動のうち${onBeatCount}回が拍と重なった。しかし最後だけは、ずれた。完璧な演奏者でも、終止符を外すことがある——それが人間だ。`;
      } else if (ratio >= 0.4) {
        rhythmPara = `BOCCAは、お前の鼓動を聞いていた。お前のリズムは揺れていた。拍に乗った瞬間もあり、外れた瞬間もあった。その揺らぎが、お前という演奏だ。`;
      } else {
        rhythmPara = `BOCCAは、お前の鼓動を聞いていた。お前は旅を通じて、音楽とは別のリズムで動いていた。それが意図だったのか、無意識だったのか——内側の拍数は、お前だけが知っている。`;
      }
    }

    if (rhythmPara) paragraphs.push(rhythmPara);
  }

  return paragraphs.filter(Boolean).map(p => `<p class="personality-para">${p}</p>`).join('');
}

function bfBar(label: string, value: number, color: string): string {
  const pct = Math.round(value * 100);
  return `
    <div class="bf-bar-row">
      <span class="bf-bar-label">${label}</span>
      <div class="bf-bar-track">
        <div class="bf-bar-fill" style="width:${pct}%;background:${color}"></div>
      </div>
      <span class="bf-bar-pct">${pct}%</span>
    </div>
  `;
}


function servantChip(s: { id: number; name: string; skill: string }, alive: boolean): string {
  return `
    <div class="servant-chip-result ${alive ? '' : 'sacrificed'}">
      <span class="chip-symbol">${TAROT_SYMBOLS[s.id] ?? ''}</span>
      <span class="chip-name">${s.name}</span>
      <span class="chip-skill">${s.skill.split('（')[0]}</span>
    </div>
  `;
}

export function renderFinaleScene(container: HTMLElement): void {
  const state = getState();
  const ending = determineEnding(state);
  const bf = state.bigFive;

  const survivingServants = state.aliveServants;
  const sacrificedServants = state.servants.filter(s => !s.alive);

  container.innerHTML = `
    <div class="scene scene-finale" id="scene-finale">
      <div class="particles-container" id="finale-particles"></div>
      <div class="bg-overlay finale-overlay"></div>

      <div class="finale-content">

        <div class="finale-header">
          <div class="scene-label">真実の口の裁定</div>
          <h2 class="finale-main-title" id="finale-title"></h2>
        </div>

        <!-- エンディング -->
        <div class="ending-card" id="ending-card" style="opacity:0">
          <div class="ending-badge" style="background:${TYPE_COLORS[ending.type] ?? '#666'}">${ending.type}</div>
          <h3 class="ending-title">${ending.title}</h3>
          <p class="ending-message" id="ending-message"></p>
        </div>

        <!-- 従者の状態 -->
        <div class="report-section" id="section-servants" style="opacity:0">
          <div class="report-section-label">旅を共にした従者</div>
          ${survivingServants.length > 0 ? `
            <p class="servant-section-head">生き残った従者（${survivingServants.length}体）</p>
            <div class="servant-chip-grid">
              ${survivingServants.map(s => servantChip(s, true)).join('')}
            </div>
          ` : '<p class="servant-section-head servant-all-gone">全ての従者が旅立った</p>'}
          ${sacrificedServants.length > 0 ? `
            <p class="servant-section-head sacrificed-head">捧げた従者（${sacrificedServants.length}体）</p>
            <div class="servant-chip-grid">
              ${sacrificedServants.map(s => servantChip(s, false)).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Big Five + 性格裁定 -->
        <div class="report-section report-bigfive-primary" id="section-bigfive" style="opacity:0">
          <div class="report-section-label">真実の口は見ていた</div>
          <div class="bigfive-bars">
            ${bfBar('開放性 (O)', bf.O, '#8b5cf6')}
            ${bfBar('誠実性 (C)', bf.C, '#3b82f6')}
            ${bfBar('外向性 (E)', bf.E, '#f59e0b')}
            ${bfBar('協調性 (A)', bf.A, '#10b981')}
            ${bfBar('神経症傾向 (N)', bf.N, '#ef4444')}
          </div>
          <div class="personality-reading">
            <div class="personality-oracle-line">── 口の裁定 ──</div>
            <div class="personality-narrative" id="personality-narrative">
              ${generatePersonalityNarrative(bf, state)}
            </div>
          </div>
          <p class="report-note-small">※ゲーム体験に基づく自己洞察。医療診断の代替ではありません。</p>
        </div>

        <!-- 旅の記録 -->
        <div class="report-section" id="section-log" style="opacity:0">
          <div class="report-section-label">旅の記録</div>
          <div class="stage-log-list">
            ${state.stageLog.map(log => `
              <div class="stage-log-item ${log.outcome === 'sacrifice' ? 'log-sacrifice' : log.outcome === 'fail' ? 'log-fail' : ''}">
                <span class="log-stage">ST-${String(log.stageId).padStart(2,'0')}</span>
                <span class="log-name">${log.stageName}</span>
                <span class="log-outcome">${outcomeLabel(log.outcome)}</span>
                ${log.sacrificedServantName ? `<span class="log-sacrifice-name">（${log.sacrificedServantName}を捧げた）</span>` : ''}
                ${log.hpDelta !== 0 ? `<span class="log-hp ${log.hpDelta > 0 ? 'hp-plus' : 'hp-minus'}">HP ${log.hpDelta > 0 ? '+' : ''}${log.hpDelta}</span>` : ''}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- フッター -->
        <div class="finale-footer" id="finale-footer" style="opacity:0">
          <p class="finale-closing">——BOCCAはお前の真実を、飲み込んだ。</p>
          <button class="btn-primary btn-restart" id="btn-restart">&#x21BA; もう一度、旅に出る</button>
        </div>

      </div>
    </div>
  `;

  createParticles(document.getElementById('finale-particles')!, 50);
  playSFX('reveal');

  runFinaleAnimation(ending.message);

  document.getElementById('btn-restart')?.addEventListener('click', () => {
    resetState();
    playAmbienceForScene('title');
    navigateTo('title');
  });
}

function outcomeLabel(outcome: string): string {
  switch (outcome) {
    case 'success': return '成功';
    case 'fail': return '失敗';
    case 'sacrifice': return '従者を捧げた';
    case 'skip': return 'スキップ';
    case 'item': return 'アイテム取得';
    default: return outcome;
  }
}

async function runFinaleAnimation(endingMessage: string): Promise<void> {
  await sleep(400);

  const titleEl = document.getElementById('finale-title')!;
  await typewriter(titleEl, '——真実の口が、開く。', 70);
  await sleep(800);

  const endingCard = document.getElementById('ending-card')!;
  await fadeIn(endingCard, 900);
  playSFX('reveal');

  const msgEl = document.getElementById('ending-message')!;
  await sleep(400);
  await typewriter(msgEl, endingMessage, 35);
  await sleep(800);

  for (const id of ['section-servants', 'section-bigfive', 'section-log']) {
    const el = document.getElementById(id);
    if (el) { await fadeIn(el, 700); playSFX('reveal'); }
    await sleep(500);
  }

  const footer = document.getElementById('finale-footer')!;
  await fadeIn(footer, 800);
}
