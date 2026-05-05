// BOCCA — RPGコマンドバトルシステム

import { SKILL_VESSELS } from '../data/personas';
import type { BattleLog, BattleTurn } from '../utils/gameState';
import {
  getGameState,
  applyResourceDelta,
  addDiagScores,
  applyDebuff,
  recordBattle,
  recordAction,
  sleep,
  addItem,
  hasItem,
} from '../utils/gameState';
import type { ScenarioNode } from '../data/scenarioData';

interface EnemyState {
  name: string;
  hp: number;
  maxHp: number;

  attackPower: number;
  attackChance: number; // 攻撃命中率
}

/** バトルシーンをレンダリングして実行する */
export function startBattle(
  container: HTMLElement,
  node: ScenarioNode,
  onBattleEnd: (outcome: 'victory' | 'defeat' | 'fled', actionId: string) => void
): void {
  // state.personasはrenderBattle内で参照

  // 敵の設定（イベントIDで調整）
  const enemy: EnemyState = node.id === 2
    ? { name: '弱い魔物', hp: 6, maxHp: 6, attackPower: 1, attackChance: 0.5 }
    : { name: 'スラムの暴漢', hp: 10, maxHp: 10, attackPower: 2, attackChance: 0.65 };

  const turns: BattleTurn[] = [];
  let firstCommand: BattleTurn['command'] | null = null;
  let nextHitBonus = 0;
  let defenseActive = false;
  const usedSkillServants = new Set<string>();

  function renderBattle(): void {
    const playerHp = getGameState().hp;
    const aliveNow = getGameState().personas.filter(p => p.isAlive);

    const servantCards = aliveNow.map(p => {
      const vessel = SKILL_VESSELS.find(v => v.id === p.skillId);
      return `
        <button class="battle-servant-card" data-name="${p.customName}" data-skillid="${p.skillId}" id="bsc-${p.customName}">
          <span class="bsc-symbol">${vessel?.symbol || '?'}</span>
          <span class="bsc-name">${p.customName}</span>
          <span class="bsc-skill">${vessel?.battleSkill.name || ''}</span>
        </button>
      `;
    }).join('');

    container.innerHTML = `
      <div class="scene scene-${node.stage}" id="battle-scene">
        <div class="bg-overlay"></div>
        <div class="battle-ui">

          <div class="battle-header">
            <div class="battle-title">⚔️ ${node.title}</div>
          </div>

          <div class="battle-field">
            <div class="battle-enemy">
              <div class="battle-enemy-name">${enemy.name}</div>
              <div class="battle-enemy-art">${getEnemyArt(node.id)}</div>
              <div class="battle-hp-bar">
                <div class="battle-hp-fill enemy-hp" style="width:${(enemy.hp/enemy.maxHp)*100}%" id="enemy-hp-bar"></div>
              </div>
              <div class="battle-hp-text" id="enemy-hp-text">HP ${enemy.hp}/${enemy.maxHp}</div>
            </div>

            <div class="battle-player">
              <div class="battle-player-label">あなた</div>
              <div class="battle-hp-bar">
                <div class="battle-hp-fill player-hp ${playerHp <= 3 ? 'hp-danger' : ''}" style="width:${(playerHp/10)*100}%" id="player-hp-bar"></div>
              </div>
              <div class="battle-hp-text" id="player-hp-text">HP ${playerHp}/10</div>
            </div>
          </div>

          <div class="battle-log" id="battle-log">
            <p class="battle-log-text" id="battle-log-text">${node.situation}</p>
          </div>

          <div class="battle-commands">
            <div class="battle-phase-label">従者を選んで行動：</div>
            <div class="battle-servant-grid" id="servant-grid">
              ${servantCards}
            </div>
            <div class="skill-desc-box" id="skill-desc-box" style="display:none"></div>
            <div class="battle-command-grid" id="command-grid" style="display:none">
              <button class="btn-command cmd-attack" id="cmd-attack">⚔️ 攻撃</button>
              <button class="btn-command cmd-skill" id="cmd-skill">✨ スキル</button>
              <button class="btn-command cmd-defend" id="cmd-defend">🛡️ 防御</button>
              <button class="btn-command cmd-flee" id="cmd-flee">🏃 逃げる</button>
            </div>
          </div>

        </div>
      </div>
    `;

    // 従者カード選択
    let selectedServant: string | null = null;
    let selectedSkillId: string | null = null;
    document.querySelectorAll('.battle-servant-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.battle-servant-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedServant = card.getAttribute('data-name');
        selectedSkillId = card.getAttribute('data-skillid');
        // スキル説明を表示
        const vessel = selectedSkillId ? SKILL_VESSELS.find(v => v.id === selectedSkillId) : null;
        const descBox = document.getElementById('skill-desc-box');
        if (descBox && vessel) {
          const skillUsed = selectedServant ? usedSkillServants.has(selectedServant) : false;
          descBox.style.display = 'block';
          descBox.innerHTML = `<span class="skill-desc-emoji">${vessel.battleSkill.emoji}</span> <strong>${vessel.battleSkill.name}</strong>: ${vessel.battleSkill.description}${skillUsed ? ' <span class="skill-used-badge">使用済</span>' : ''}`;
        }
        const grid = document.getElementById('command-grid')!;
        grid.style.display = 'grid';
        // スキルボタンの使用済み制御
        const skillBtn = document.getElementById('cmd-skill') as HTMLButtonElement | null;
        if (skillBtn && selectedServant) {
          skillBtn.disabled = usedSkillServants.has(selectedServant);
        }
      });
    });

    // コマンドボタン
    document.getElementById('cmd-attack')?.addEventListener('click', () => {
      if (!selectedServant) return;
      executeCommand('attack', selectedServant, selectedSkillId, null);
    });
    document.getElementById('cmd-skill')?.addEventListener('click', () => {
      if (!selectedServant || !selectedSkillId) return;
      executeCommand('skill', selectedServant, selectedSkillId, selectedSkillId);
    });
    document.getElementById('cmd-defend')?.addEventListener('click', () => {
      if (!selectedServant) return;
      executeCommand('defend', selectedServant, selectedSkillId, null);
    });
    document.getElementById('cmd-flee')?.addEventListener('click', () => {
      executeCommand('flee', null, null, null);
    });
  }

  async function executeCommand(
    command: BattleTurn['command'],
    servantName: string | null,
    skillId: string | null,
    useSkillId: string | null
  ): Promise<void> {
    const playerHpBefore = getGameState().hp;
    if (!firstCommand) firstCommand = command;

    const turn: BattleTurn = {
      turnNumber: turns.length + 1,
      command,
      servantUsed: servantName,
      skillId: useSkillId,
      playerHpBefore,
      enemyHpBefore: enemy.hp,
    };

    disableCommands();

    const logEl = document.getElementById('battle-log-text');

    // ターン終了後の共通処理（パッシブダメージ → 敵攻撃 → 状態確認）
    async function endTurn(skipEnemyAttack = false): Promise<void> {
      turns.push(turn);
      await applyPassiveDamage(logEl);
      if (enemy.hp <= 0) { finishBattle('victory', 'fight'); return; }
      if (!skipEnemyAttack) await enemyAttack(logEl);
      if (getGameState().hp <= 0) { finishBattle('defeat', 'fight'); return; }
      enableCommands();
    }

    // --- コマンド処理 ---
    if (command === 'flee') {
      const vessel = skillId ? SKILL_VESSELS.find(v => v.id === skillId) : null;
      const guaranteed = vessel?.battleSkill.fleeGuaranteed || false;
      const fleeOpt = node.options.find(o => o.id === 'flee')!;

      if (guaranteed || Math.random() < 0.7) {
        if (logEl) logEl.textContent = `${servantName || 'あなた'}は撤退を選んだ。`;
        if (fleeOpt.foodCost) applyResourceDelta({ food: -fleeOpt.foodCost });
        const cur = getGameState().coins;
        if (fleeOpt.id === 'flee' && node.id === 6) applyResourceDelta({ coins: -(Math.floor(cur/2)) });
        addDiagScores(fleeOpt.diagDelta);
        turns.push(turn);
        finishBattle('fled', 'flee');
        return;
      } else {
        if (logEl) logEl.textContent = '逃げようとしたが、包囲されて失敗した！';
        await sleep(800);
        await endTurn();
        return;
      }
    } else if (command === 'defend') {
      defenseActive = true;
      addDiagScores({ risk: -1 });
      if (logEl) logEl.textContent = `${servantName}が身構えた。次の攻撃を防ぐ。`;
      await sleep(800);
      await endTurn();
      return;
    } else if (command === 'attack') {
      const hitChance = 0.7 + nextHitBonus;
      nextHitBonus = 0;
      const hit = Math.random() < hitChance;
      const damage = hit ? 2 : 0;
      enemy.hp = Math.max(0, enemy.hp - damage);
      addDiagScores({ risk: 1 });
      if (logEl) logEl.textContent = hit
        ? `${servantName}が攻撃した！ 敵に${damage}ダメージ！`
        : `${servantName}の攻撃が外れた！`;
      updateEnemyHP();
      await sleep(600);
      if (enemy.hp <= 0) { turns.push(turn); finishBattle('victory', 'fight'); return; }
      await endTurn();
      return;
    } else if (command === 'skill' && useSkillId) {
      const vessel = SKILL_VESSELS.find(v => v.id === useSkillId);
      const skill = vessel?.battleSkill;
      if (!skill) { enableCommands(); return; }

      // スキル使用済みに登録
      if (servantName) usedSkillServants.add(servantName);

      let skillLog = `${servantName}の【${skill.name}】！ `;
      addDiagScores(skill.diagDelta);

      if (skill.payCoins) {
        if (getGameState().coins >= skill.payCoins) {
          applyResourceDelta({ coins: -skill.payCoins });
          skillLog += `コイン${skill.payCoins}枚を支払い、即決着！`;
          if (logEl) logEl.textContent = skillLog;
          await sleep(800);
          turns.push(turn);
          finishBattle('victory', 'fight');
          return;
        } else {
          skillLog += 'コインが足りない！失敗！';
          if (logEl) logEl.textContent = skillLog;
          await sleep(800);
          await endTurn();
          return;
        }
      }
      if (skill.fleeGuaranteed) {
        const foodCost = useSkillId === 'transcendence' ? 2 : (node.options.find(o => o.id === 'flee')?.foodCost || 0);
        if (foodCost) applyResourceDelta({ food: -foodCost });
        skillLog += useSkillId === 'transcendence' ? `食料${foodCost}を消費して戦闘をスキップ！` : '完璧な撤退！';
        if (logEl) logEl.textContent = skillLog;
        await sleep(800);
        turns.push(turn);
        finishBattle('fled', 'flee');
        return;
      }
      if (skill.enemyStun) {
        skillLog += '敵が動けなくなった！（1ターン、敵攻撃なし）';
        if (logEl) logEl.textContent = skillLog;
        enemy.hp = Math.max(0, enemy.hp - 1);
        updateEnemyHP();
        await sleep(1000);
        await endTurn(/* skipEnemyAttack= */ true);
        return;
      }
      if (skill.defenseBoost) {
        defenseActive = true;
        skillLog += '次の攻撃を完全に無効化する！';
        if (logEl) logEl.textContent = skillLog;
        await sleep(800);
        await endTurn();
        return;
      }
      if (skill.healPlayer) {
        applyResourceDelta({ hp: skill.healPlayer });
        skillLog += `HP+${skill.healPlayer}回復！`;
        if (logEl) logEl.textContent = skillLog;
        updatePlayerHP();
        await sleep(800);
        await endTurn();
        return;
      }
      if (skill.randomEffect) {
        const r = Math.random();
        let dmg = 0;
        if (r < 0.15) {
          dmg = 6; skillLog += '大爆発！！ 超ダメージ！';
        } else if (r < 0.5) {
          dmg = 3; skillLog += `${dmg}ダメージ！`;
        } else if (r < 0.8) {
          dmg = 1; skillLog += `${dmg}ダメージ...`;
        } else {
          applyResourceDelta({ hp: -2 });
          skillLog += '暴走！ 自分が2ダメージを受けた！';
          updatePlayerHP();
        }
        enemy.hp = Math.max(0, enemy.hp - dmg);
        updateEnemyHP();
        if (logEl) logEl.textContent = skillLog;
        await sleep(1000);
        if (enemy.hp <= 0) { turns.push(turn); finishBattle('victory', 'fight'); return; }
        await endTurn();
        return;
      }
      if (skill.nextHitBonus) {
        nextHitBonus = skill.nextHitBonus;
        skillLog += `次の攻撃命中率が${Math.round(skill.nextHitBonus*100)}%アップ！`;
        if (logEl) logEl.textContent = skillLog;
        await sleep(800);
        await endTurn();
        return;
      }
      if (useSkillId === 'projection') {
        const aliveOthers = getGameState().personas.filter(p => p.isAlive && p.customName !== servantName);
        if (aliveOthers.length > 0) {
          const shield = aliveOthers[Math.floor(Math.random() * aliveOthers.length)];
          applyDebuff(shield.customName, '恐怖');
          defenseActive = true;
          skillLog += `「${shield.customName}」を盾にした！（${shield.customName}に「恐怖」デバフ）`;
        } else {
          defenseActive = true;
          skillLog += '防御姿勢を取った！（盾にする従者がいない）';
        }
        if (logEl) logEl.textContent = skillLog;
        await sleep(900);
        await endTurn();
        return;
      }
      // damageMultiplier系（obsession含む）
      const isObsession = useSkillId === 'obsession' && getGameState().hp <= 1;
      if (isObsession) skillLog = `${servantName}の【${skill.name}】！ HP1——捨て身の絶死の一撃！ `;
      const mult = isObsession ? 3.0 : (skill.damageMultiplier || 1.0);
      const selfDmg = skill.selfDamage || 0;
      const hitChance2 = 0.75 + nextHitBonus;
      nextHitBonus = 0;
      const hit2 = Math.random() < hitChance2;
      const dmg2 = hit2 ? Math.floor(2 * mult) : 0;
      enemy.hp = Math.max(0, enemy.hp - dmg2);
      if (selfDmg) applyResourceDelta({ hp: -selfDmg });
      skillLog += hit2 ? `${dmg2}ダメージ！` : 'ミス！';
      if (logEl) logEl.textContent = skillLog;
      updateEnemyHP();
      updatePlayerHP();
      await sleep(800);
      if (enemy.hp <= 0) { turns.push(turn); finishBattle('victory', 'fight'); return; }
      await endTurn();
      return;
    }

    // ここには到達しないが安全のため
    turns.push(turn);
    enableCommands();
  }

  async function applyPassiveDamage(logEl: HTMLElement | null): Promise<void> {
    const aliveCount = getGameState().personas.filter(p => p.isAlive).length;
    if (aliveCount <= 0) return;
    enemy.hp = Math.max(0, enemy.hp - aliveCount);
    updateEnemyHP();
    if (logEl) logEl.textContent = `従者たちの連携攻撃！ 敵に${aliveCount}ダメージ！`;
    await sleep(600);
  }

  async function enemyAttack(logEl: HTMLElement | null): Promise<void> {
    if (defenseActive) {
      defenseActive = false;
      if (logEl) logEl.textContent = '敵の攻撃を防いだ！';
      await sleep(700);
      return;
    }
    const hit = Math.random() < enemy.attackChance;
    if (hit) {
      applyResourceDelta({ hp: -enemy.attackPower });
      updatePlayerHP();
      if (logEl) logEl.textContent = `${enemy.name}の攻撃！ ${enemy.attackPower}ダメージを受けた！`;
    } else {
      if (logEl) logEl.textContent = `${enemy.name}の攻撃をかわした！`;
    }
    // 呪いの護符ペナルティ
    if (hasItem('cursed_amulet') && hit) {
      applyResourceDelta({ hp: -1 });
      updatePlayerHP();
      if (logEl) logEl.textContent += '\n呪いの護符の呪いが発動！ 追加ダメージ！';
    }
    await sleep(700);
  }

  function updateEnemyHP(): void {
    const bar = document.getElementById('enemy-hp-bar') as HTMLElement | null;
    const txt = document.getElementById('enemy-hp-text') as HTMLElement | null;
    if (bar) bar.style.width = `${(enemy.hp / enemy.maxHp) * 100}%`;
    if (txt) txt.textContent = `HP ${enemy.hp}/${enemy.maxHp}`;
  }

  function updatePlayerHP(): void {
    const hp = getGameState().hp;
    const bar = document.getElementById('player-hp-bar') as HTMLElement | null;
    const txt = document.getElementById('player-hp-text') as HTMLElement | null;
    if (bar) {
      bar.style.width = `${(hp / 10) * 100}%`;
      bar.classList.toggle('hp-danger', hp <= 3);
    }
    if (txt) txt.textContent = `HP ${hp}/10`;
  }

  function disableCommands(): void {
    document.querySelectorAll('.btn-command, .battle-servant-card').forEach(b => {
      (b as HTMLButtonElement).disabled = true;
    });
  }

  function enableCommands(): void {
    document.querySelectorAll<HTMLButtonElement>('.battle-servant-card').forEach(b => { b.disabled = false; });
    document.querySelectorAll<HTMLButtonElement>('.btn-command').forEach(b => { b.disabled = false; });
    document.getElementById('command-grid')!.style.display = 'none';
  }

  function finishBattle(outcome: 'victory' | 'defeat' | 'fled', actionId: string): void {
    const log: BattleLog = {
      eventId: node.id,
      firstCommand: firstCommand ?? 'flee',
      turns,
      outcome,
      turnsCount: turns.length,
    };
    recordBattle(log);

    const opt = node.options.find(o => o.id === actionId)!;
    if (opt) {
      addDiagScores(opt.diagDelta);
      if (opt.coinGain && outcome === 'victory') applyResourceDelta({ coins: opt.coinGain });
      if (opt.itemGain && outcome === 'victory') {
        const itemMap: Record<string, string> = { '回復薬': 'herb_potion', '時代の遺物': 'ancient_relic' };
        const id = itemMap[opt.itemGain] ?? opt.itemGain;
        addItem(id);
      }
      if (opt.hpCost && outcome !== 'victory') applyResourceDelta({ hp: -opt.hpCost });
    }
    recordAction({
      step: node.id,
      type: 'battle',
      choice: actionId,
      label: outcome === 'victory' ? '勝利' : outcome === 'fled' ? '逃亡' : '敗北',
      resourceDelta: { hp: 0, food: 0, coins: 0 },
    });

    onBattleEnd(outcome, actionId);
  }

  renderBattle();
}

function getEnemyArt(nodeId: number): string {
  if (nodeId === 2) return '🦇';
  if (nodeId === 6) return '🗡️';
  return '👹';
}
