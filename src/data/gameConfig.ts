// Bucca — ゲーム設定（全ステージの調整可能な定数を一元管理）
// ここの値を変更するだけで各ステージのバランスが変わります

export const GAME_CONFIG = {
  // ──────────────── 基本 ────────────────
  initialHp:   100,
  initialGold: 0,

  // ──────────────── ST-01 茨の泉（耐久） ────────────────
  st01: {
    totalDurationMs:  25000, // 耐久クリアに必要な連続押下時間 (ms)
    penaltyHpPerSec:  4,     // 押している間のHPダメージ / 秒
  },

  // ──────────────── ST-02 オオカミの出現 ────────────────
  st02: {
    approachDurationMs: 12000, // 狼が到達するまでの時間 (ms)
    goldPerSec:         5,     // 待機中に獲得できる金貨 / 秒
  },

  // ──────────────── ST-03 毒キノコの選別（選択） ────────────────
  st03: {
    timeoutSec: 30, // 制限時間 (秒)
  },

  // ──────────────── ST-04 孤児との出会い（選択） ────────────────
  st04: {
    timeoutSec: 20, // 制限時間 (秒)
  },

  // ──────────────── ST-05 盗賊との遭遇（バトル） ────────────────
  st05: {
    timeLimitSec:  10, // バトルの制限時間 (秒)
    targetClicks:  25, // 勝利に必要なクリック数
  },

  // ──────────────── ST-07 番人との対峙（タイミング） ────────────────
  st07: {
    phaseCount: 6,  // 番人のHP（フェーズ数）
    missDamage: 10, // タイミングミス時のHPダメージ
  },

  // ──────────────── ST-09 真実の口（ボス） ────────────────
  st09: {
    bossMaxHp:       100, // ボスの最大HP
    leverDamage:     10,  // レバー攻撃（5回連打）のダメージ
    sacrificeDamage: 30,  // 従者を犠牲にした時のダメージ
    counterDamage:   15,  // ボスの反撃ダメージ
  },
} as const;

// stage.ts が内部で使う LEVER_CONFIG 互換アダプタ（変更不要）
export function getLeverConfig() {
  const c = GAME_CONFIG;
  return {
    endurance: {
      st01: { totalDurationMs: c.st01.totalDurationMs, penaltyHpPerSec: c.st01.penaltyHpPerSec, rhythmIntervalMs: 1200 },
    },
    timing: {
      st02: { approachDurationMs: c.st02.approachDurationMs, goldPerSec: c.st02.goldPerSec },
      st07: { phaseCount: c.st07.phaseCount, missDamage: c.st07.missDamage, windowMs: 650, allowedMisses: 2, phaseIntervalMs: 2200 },
    },
    battle: {
      st05: { timeLimitSec: c.st05.timeLimitSec, targetClicks: c.st05.targetClicks },
      st09: { timeLimitSec: 15, targetClicks: 20, bossMaxHp: c.st09.bossMaxHp, leverDamage: c.st09.leverDamage, sacrificeDamage: c.st09.sacrificeDamage, counterDamage: c.st09.counterDamage },
    },
    selection: {
      st03: { timeoutSec: c.st03.timeoutSec },
      st04: { timeoutSec: c.st04.timeoutSec },
      st08: { forkCount: 3, betrayalForkIndex: 1, damageOnBetrayal: 20 },
    },
  };
}
