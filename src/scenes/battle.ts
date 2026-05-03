// BOCCA — RPGコマンドバトルシステム

import { SKILL_VESSELS } from '../data/personas';
import type { BattleLog, BattleTurn } from '../utils/gameState';
import {
  getGameState,
  applyResourceDelta,
  addDiagScores,
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
        document.getElementById('command-grid')!.style.display = 'grid';
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

    // --- コマンド処理 ---
    if (command === 'flee') {
      // 逃亡処理
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
        // 敵の反撃
        await enemyAttack(logEl);
      }
    } else if (command === 'defend') {
      defenseActive = true;
      addDiagScores({ risk: -1 });
      if (logEl) logEl.textContent = `${servantName}が身構えた。次の攻撃を防ぐ。`;
      await sleep(800);
      await enemyAttack(logEl);
    } else if (command === 'attack') {
      // 通常攻撃
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
      if (logEl) await animateText(logEl, hit ? `敵に${damage}ダメージ！` : '攻撃が外れた！');
      await sleep(600);
      if (enemy.hp <= 0) { finishBattle('victory', 'fight'); return; }
      await enemyAttack(logEl);
    } else if (command === 'skill' && useSkillId) {
      // スキル使用
      const vessel = SKILL_VESSELS.find(v => v.id === useSkillId);
      const skill = vessel?.battleSkill;
      if (!skill) { enableCommands(); return; }

      let skillLog = `${servantName}の【${skill.name}】！ `;
      addDiagScores(skill.diagDelta);

      if (skill.payCoins) {
        if (getGameState().coins >= skill.payCoins) {
          applyResourceDelta({ coins: -skill.payCoins });
          skillLog += `コイン${skill.payCoins}枚を支払い、即決着！`;
          if (logEl) logEl.textContent = skillLog;
          await sleep(800);
          finishBattle('victory', 'fight');
          return;
        } else {
          skillLog += 'コインが足りない！失敗！';
          if (logEl) logEl.textContent = skillLog;
          await sleep(800);
          await enemyAttack(logEl);
          turns.push(turn);
          enableCommands();
          return;
        }
      }
      if (skill.fleeGuaranteed) {
        const fleeOpt = node.options.find(o => o.id === 'flee')!;
        if (fleeOpt.foodCost) applyResourceDelta({ food: -fleeOpt.foodCost });
        skillLog += '完璧な撤退！';
        if (logEl) logEl.textContent = skillLog;
        await sleep(800);
        finishBattle('fled', 'flee');
        return;
      }
      if (skill.enemyStun) {
        skillLog += '敵が動けなくなった！（1ターン）';
        if (logEl) logEl.textContent = skillLog;
        enemy.hp = Math.max(0, enemy.hp - 1); // スタン時も少しダメージ
        updateEnemyHP();
        await sleep(1000);
        turns.push(turn);
        enableCommands();
        return;
      }
      if (skill.defenseBoost) {
        defenseActive = true;
        skillLog += '次の攻撃を完全に無効化する！';
        if (logEl) logEl.textContent = skillLog;
        await sleep(800);
        await enemyAttack(logEl);
        turns.push(turn);
        enableCommands();
        return;
      }
      if (skill.healPlayer) {
        applyResourceDelta({ hp: skill.healPlayer });
        if (skill.selfDamage) {
          // 従者のHP消費はゲームシステム上は表現上のみ
        }
        skillLog += `HP+${skill.healPlayer}回復！`;
        if (logEl) logEl.textContent = skillLog;
        updatePlayerHP();
        await sleep(800);
        await enemyAttack(logEl);
        turns.push(turn);
        enableCommands();
        return;
      }
      if (skill.randomEffect) {
        const r = Math.random();
        let dmg = 0;
        if (r < 0.15) {
          // 大成功
          dmg = 6;
          skillLog += '大爆発！！ 超ダメージ！';
        } else if (r < 0.5) {
          // 成功
          dmg = 3;
          skillLog += `${dmg}ダメージ！`;
        } else if (r < 0.8) {
          // 普通
          dmg = 1;
          skillLog += `${dmg}ダメージ...`;
        } else {
          // 自爆
          applyResourceDelta({ hp: -2 });
          skillLog += '暴走！ 自分が2ダメージを受けた！';
          updatePlayerHP();
        }
        enemy.hp = Math.max(0, enemy.hp - dmg);
        updateEnemyHP();
        if (logEl) logEl.textContent = skillLog;
        await sleep(1000);
        if (enemy.hp <= 0) { finishBattle('victory', 'fight'); return; }
        await enemyAttack(logEl);
        turns.push(turn);
        enableCommands();
        return;
      }
      if (skill.nextHitBonus) {
        nextHitBonus = skill.nextHitBonus;
        skillLog += `次の攻撃命中率が${Math.round(skill.nextHitBonus*100)}%アップ！`;
        if (logEl) logEl.textContent = skillLog;
        await sleep(800);
        await enemyAttack(logEl);
        turns.push(turn);
        enableCommands();
        return;
      }
      // damageMultiplier系
      const mult = skill.damageMultiplier || 1.0;
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
      if (enemy.hp <= 0) { finishBattle('victory', 'fight'); return; }
      await enemyAttack(logEl);
    }

    turns.push(turn);
    if (getGameState().hp <= 0) {
      finishBattle('defeat', 'fight');
      return;
    }
    enableCommands();
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
    document.getElementById('command-grid')!.style.display = 'none';
  }

  async function animateText(el: HTMLElement, text: string): Promise<void> {
    el.textContent = text;
    el.classList.add('battle-log-flash');
    await sleep(300);
    el.classList.remove('battle-log-flash');
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
