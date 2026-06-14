import type { GameSaveData, Ship, Upgrade, GameConfig, BattleRecord, GameStats, CargoSlot, ShipCargo } from '../types';
import { createDefaultShip, createDefaultUpgrades } from '../data/defaultShip';
import { defaultConfig } from '../data/defaultConfig';
import { createDefaultCargoInventory, createDefaultShipCargo } from '../data/cargo';

const STORAGE_KEY = 'starship_dice_commander_save';

export const defaultStats: GameStats = {
  totalBattles: 0,
  victories: 0,
  defeats: 0,
  totalTurns: 0,
  totalRewardPoints: 0,
  totalDamageDealt: 0,
  totalDamageTaken: 0,
  currentStreak: 0,
  longestStreak: 0,
};

export function createDefaultSaveData(): GameSaveData {
  return {
    ship: createDefaultShip(),
    upgrades: createDefaultUpgrades(),
    config: { ...defaultConfig },
    battleHistory: [],
    stats: { ...defaultStats },
    rewardPoints: 0,
    cargoInventory: createDefaultCargoInventory(),
  };
}

export function loadSaveData(): GameSaveData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as GameSaveData;
      return validateSaveData(parsed);
    }
  } catch (e) {
    console.error('Failed to load save data:', e);
  }
  return createDefaultSaveData();
}

export function saveSaveData(data: GameSaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data:', e);
  }
}

function validateSaveData(data: GameSaveData): GameSaveData {
  const defaults = createDefaultSaveData();
  
  return {
    ship: { 
      ...defaults.ship, 
      ...data.ship, 
      cabins: data.ship.cabins || defaults.ship.cabins,
      cargo: data.ship.cargo || createDefaultShipCargo(),
    },
    upgrades: data.upgrades && data.upgrades.length > 0 ? data.upgrades : defaults.upgrades,
    config: { ...defaults.config, ...data.config },
    battleHistory: data.battleHistory || [],
    stats: { ...defaults.stats, ...data.stats },
    rewardPoints: typeof data.rewardPoints === 'number' ? data.rewardPoints : 0,
    cargoInventory: data.cargoInventory && data.cargoInventory.length > 0 ? data.cargoInventory : defaults.cargoInventory,
  };
}

export function saveShip(ship: Ship): void {
  const data = loadSaveData();
  data.ship = ship;
  saveSaveData(data);
}

export function loadShip(): Ship {
  return loadSaveData().ship;
}

export function saveUpgrades(upgrades: Upgrade[]): void {
  const data = loadSaveData();
  data.upgrades = upgrades;
  saveSaveData(data);
}

export function loadUpgrades(): Upgrade[] {
  return loadSaveData().upgrades;
}

export function saveConfig(config: GameConfig): void {
  const data = loadSaveData();
  data.config = config;
  saveSaveData(data);
}

export function loadConfig(): GameConfig {
  return loadSaveData().config;
}

export function addBattleRecord(record: BattleRecord): void {
  const data = loadSaveData();
  data.battleHistory.unshift(record);
  if (data.battleHistory.length > 50) {
    data.battleHistory = data.battleHistory.slice(0, 50);
  }
  saveSaveData(data);
}

export function loadBattleHistory(): BattleRecord[] {
  return loadSaveData().battleHistory;
}

export function updateStats(updates: Partial<GameStats>): void {
  const data = loadSaveData();
  data.stats = { ...data.stats, ...updates };
  saveSaveData(data);
}

export function loadStats(): GameStats {
  return loadSaveData().stats;
}

export function saveRewardPoints(points: number): void {
  const data = loadSaveData();
  data.rewardPoints = points;
  saveSaveData(data);
}

export function loadRewardPoints(): number {
  return loadSaveData().rewardPoints;
}

export function saveCargoInventory(inventory: CargoSlot[]): void {
  const data = loadSaveData();
  data.cargoInventory = inventory;
  saveSaveData(data);
}

export function loadCargoInventory(): CargoSlot[] {
  return loadSaveData().cargoInventory;
}

export function saveShipCargo(cargo: ShipCargo): void {
  const data = loadSaveData();
  data.ship.cargo = cargo;
  saveSaveData(data);
}

export function loadShipCargo(): ShipCargo {
  return loadSaveData().ship.cargo;
}

export function resetSaveData(): GameSaveData {
  const defaults = createDefaultSaveData();
  saveSaveData(defaults);
  return defaults;
}

export function exportSaveData(): string {
  return JSON.stringify(loadSaveData(), null, 2);
}

export function importSaveData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString) as GameSaveData;
    const validated = validateSaveData(data);
    saveSaveData(validated);
    return true;
  } catch (e) {
    console.error('Failed to import save data:', e);
    return false;
  }
}
