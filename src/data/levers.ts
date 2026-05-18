// レバーメカニクス設定値

export const LEVER_CONFIG = {
  endurance: {
    st01: {
      totalDurationMs: 25000,
      penaltyHpPerSec: 4,
      rhythmIntervalMs: 1200,
    },
  },
  timing: {
    st02: {
      windowMs: 800,
      allowedMisses: 3,
      waveCount: 5,
      waveIntervalMs: 2500,
    },
    st07: {
      windowMs: 650,
      allowedMisses: 2,
      phaseCount: 6,
      phaseIntervalMs: 2200,
    },
  },
  battle: {
    st05: {
      timeLimitSec: 10,
      targetClicks: 25,
    },
    st09: {
      timeLimitSec: 15,
      targetClicks: 20,
      bossMaxHp: 100,
      leverDamage: 10,
      sacrificeDamage: 30,
      counterDamage: 15,
    },
  },
  selection: {
    st03: { timeoutSec: 30 },
    st04: { timeoutSec: 20 },
    st08: {
      forkCount: 3,
      betrayalForkIndex: 1,
      damageOnBetrayal: 20,
    },
  },
} as const;
