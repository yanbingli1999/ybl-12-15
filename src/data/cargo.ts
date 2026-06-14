import type { Cargo, ShipCargo, CargoSlot } from '../types';

export const CARGO_LIST: Cargo[] = [
  {
    id: 'cargo_ammo',
    type: 'ammo',
    name: '弹药箱',
    description: '额外弹药储备，战斗中可提升武器伤害 +20%',
    icon: '📦',
    capacity: 2,
    weight: 3,
    rarity: 'common',
    effect: {
      type: 'active',
      damageBonus: 0.2,
      oneTimeUse: true,
    },
  },
  {
    id: 'cargo_battery',
    type: 'battery',
    name: '备用电池',
    description: '高能电池组，战斗开始时提供 +3 初始能量',
    icon: '🔋',
    capacity: 1,
    weight: 2,
    rarity: 'common',
    effect: {
      type: 'passive',
      energyBonus: 3,
    },
  },
  {
    id: 'cargo_coolant',
    type: 'coolant',
    name: '冷却罐',
    description: '高效冷却剂，可立即恢复一个过热损坏的舱室',
    icon: '❄️',
    capacity: 1,
    weight: 2,
    rarity: 'uncommon',
    effect: {
      type: 'active',
      cooldownReduction: 1,
      oneTimeUse: true,
    },
  },
  {
    id: 'cargo_probe',
    type: 'probe',
    name: '扫描探针',
    description: '精密扫描探针，战斗开始时降低敌方闪避率 15%',
    icon: '📡',
    capacity: 1,
    weight: 1,
    rarity: 'uncommon',
    effect: {
      type: 'passive',
      scanBonus: 0.15,
    },
  },
  {
    id: 'cargo_loot',
    type: 'loot',
    name: '战利品货柜',
    description: '空货柜用于收集战利品，战斗胜利后奖励 +50%',
    icon: '💰',
    capacity: 3,
    weight: 4,
    rarity: 'rare',
    effect: {
      type: 'reward',
      rewardMultiplier: 0.5,
    },
  },
];

export const createDefaultShipCargo = (): ShipCargo => ({
  capacity: 10,
  slots: [],
});

export const createDefaultCargoInventory = (): CargoSlot[] => [
  { cargo: CARGO_LIST[0], quantity: 2 },
  { cargo: CARGO_LIST[1], quantity: 2 },
  { cargo: CARGO_LIST[2], quantity: 1 },
  { cargo: CARGO_LIST[3], quantity: 1 },
  { cargo: CARGO_LIST[4], quantity: 1 },
];

export function calculateCargoWeight(cargo: ShipCargo): number {
  return cargo.slots.reduce((sum, slot) => sum + slot.cargo.weight * slot.quantity, 0);
}

export function calculateCargoUsedCapacity(cargo: ShipCargo): number {
  return cargo.slots.reduce((sum, slot) => sum + slot.cargo.capacity * slot.quantity, 0);
}

export function calculateCargoRewardMultiplier(cargo: ShipCargo): number {
  return cargo.slots.reduce((mult, slot) => {
    if (slot.cargo.effect.type === 'reward' && slot.cargo.effect.rewardMultiplier) {
      return mult + slot.cargo.effect.rewardMultiplier * slot.quantity;
    }
    return mult;
  }, 1);
}

export function calculateWeightPenalty(totalWeight: number): { evasionPenalty: number; energyPenalty: number } {
  if (totalWeight <= 5) {
    return { evasionPenalty: 0, energyPenalty: 0 };
  }
  if (totalWeight <= 10) {
    return { evasionPenalty: 0.05, energyPenalty: 1 };
  }
  if (totalWeight <= 15) {
    return { evasionPenalty: 0.1, energyPenalty: 2 };
  }
  return { evasionPenalty: 0.15, energyPenalty: 3 };
}
