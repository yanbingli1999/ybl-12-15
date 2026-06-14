import { create } from 'zustand';
import type { Ship, Upgrade, GameStats, Cargo, CargoSlot, ShipCargo } from '../types';
import { createDefaultShip, createDefaultUpgrades } from '../data/defaultShip';
import { defaultStats } from '../utils/storage';
import { createDefaultShipCargo, calculateCargoWeight, calculateCargoUsedCapacity } from '../data/cargo';
import { 
  loadShip, saveShip, 
  loadUpgrades, saveUpgrades,
  loadRewardPoints, saveRewardPoints,
  loadStats, updateStats,
  loadCargoInventory, saveCargoInventory,
  loadShipCargo, saveShipCargo,
} from '../utils/storage';

interface ShipState {
  ship: Ship;
  upgrades: Upgrade[];
  rewardPoints: number;
  stats: GameStats;
  cargoInventory: CargoSlot[];
  
  loadSavedData: () => void;
  updateShip: (ship: Partial<Ship>) => void;
  setShip: (ship: Ship) => void;
  buyUpgrade: (upgradeId: string) => boolean;
  addRewardPoints: (points: number) => void;
  spendRewardPoints: (points: number) => boolean;
  applyUpgradeEffects: () => void;
  resetShip: () => void;
  
  addCargoToShip: (cargo: Cargo, quantity?: number) => boolean;
  removeCargoFromShip: (cargoId: string, quantity?: number) => boolean;
  clearShipCargo: () => void;
  
  addCargoToInventory: (cargo: Cargo, quantity?: number) => void;
  removeCargoFromInventory: (cargoId: string, quantity?: number) => boolean;
  
  getShipCargoWeight: () => number;
  getShipCargoUsedCapacity: () => number;
  getShipCargoFreeCapacity: () => number;
}

export const useShipStore = create<ShipState>((set, get) => ({
  ship: createDefaultShip(),
  upgrades: createDefaultUpgrades(),
  rewardPoints: 0,
  stats: defaultStats,
  cargoInventory: [],
  
  loadSavedData: () => {
    const ship = loadShip();
    const upgrades = loadUpgrades();
    const rewardPoints = loadRewardPoints();
    const stats = loadStats();
    const cargoInventory = loadCargoInventory();
    
    if (!ship.cargo) {
      ship.cargo = createDefaultShipCargo();
    }
    
    set({ ship, upgrades, rewardPoints, stats, cargoInventory });
  },
  
  updateShip: (updates) => {
    const { ship } = get();
    const newShip = { ...ship, ...updates };
    set({ ship: newShip });
    saveShip(newShip);
  },
  
  setShip: (ship) => {
    set({ ship });
    saveShip(ship);
  },
  
  buyUpgrade: (upgradeId) => {
    const { upgrades, rewardPoints } = get();
    const upgrade = upgrades.find(u => u.id === upgradeId);
    
    if (!upgrade || upgrade.currentLevel >= upgrade.maxLevel) return false;
    
    const cost = Math.floor(upgrade.cost * Math.pow(upgrade.costMultiplier, upgrade.currentLevel));
    if (rewardPoints < cost) return false;
    
    const newUpgrades = upgrades.map(u => {
      if (u.id === upgradeId) {
        return { ...u, currentLevel: u.currentLevel + 1 };
      }
      return u;
    });
    
    set({
      upgrades: newUpgrades,
      rewardPoints: rewardPoints - cost,
    });
    
    saveUpgrades(newUpgrades);
    saveRewardPoints(rewardPoints - cost);
    get().applyUpgradeEffects();
    
    return true;
  },
  
  addRewardPoints: (points) => {
    const { rewardPoints, stats } = get();
    const newPoints = rewardPoints + points;
    const newStats = {
      ...stats,
      totalRewardPoints: stats.totalRewardPoints + points,
    };
    
    set({ rewardPoints: newPoints, stats: newStats });
    saveRewardPoints(newPoints);
    updateStats(newStats);
  },
  
  spendRewardPoints: (points) => {
    const { rewardPoints } = get();
    if (rewardPoints < points) return false;
    
    const newPoints = rewardPoints - points;
    set({ rewardPoints: newPoints });
    saveRewardPoints(newPoints);
    return true;
  },
  
  applyUpgradeEffects: () => {
    const { ship, upgrades } = get();
    const baseShip = createDefaultShip();
    
    let newShip = { ...ship };
    
    const hpUpgrade = upgrades.find(u => u.id === 'upgrade_hp');
    const shieldUpgrade = upgrades.find(u => u.id === 'upgrade_shield');
    const attackUpgrade = upgrades.find(u => u.id === 'upgrade_attack');
    const defenseUpgrade = upgrades.find(u => u.id === 'upgrade_defense');
    const evasionUpgrade = upgrades.find(u => u.id === 'upgrade_evasion');
    const critUpgrade = upgrades.find(u => u.id === 'upgrade_crit');
    const energyUpgrade = upgrades.find(u => u.id === 'upgrade_energy');
    const cargoUpgrade = upgrades.find(u => u.id === 'upgrade_cargo');
    
    newShip.maxHp = baseShip.maxHp + (hpUpgrade?.currentLevel || 0) * hpUpgrade!.effect;
    newShip.maxShield = baseShip.maxShield + (shieldUpgrade?.currentLevel || 0) * shieldUpgrade!.effect;
    newShip.attack = baseShip.attack + (attackUpgrade?.currentLevel || 0) * attackUpgrade!.effect;
    newShip.defense = baseShip.defense + (defenseUpgrade?.currentLevel || 0) * defenseUpgrade!.effect;
    newShip.evasion = baseShip.evasion + (evasionUpgrade?.currentLevel || 0) * evasionUpgrade!.effect;
    newShip.critRate = baseShip.critRate + (critUpgrade?.currentLevel || 0) * critUpgrade!.effect;
    newShip.maxEnergy = baseShip.maxEnergy + (energyUpgrade?.currentLevel || 0) * energyUpgrade!.effect;
    
    const baseCargo = createDefaultShipCargo();
    newShip.cargo = {
      capacity: baseCargo.capacity + (cargoUpgrade?.currentLevel || 0) * (cargoUpgrade?.effect || 2),
      slots: newShip.cargo?.slots || [],
    };
    
    newShip.hp = Math.min(newShip.hp, newShip.maxHp);
    newShip.shield = Math.min(newShip.shield, newShip.maxShield);
    newShip.energy = Math.min(newShip.energy, newShip.maxEnergy);
    
    const cabinUpgrades = upgrades.filter(u => u.type === 'cabin' && u.cabinType);
    newShip.cabins = newShip.cabins.map(cabin => {
      const cabinUpgrade = cabinUpgrades.find(u => u.cabinType === cabin.type);
      if (cabinUpgrade) {
        return {
          ...cabin,
          level: 1 + cabinUpgrade.currentLevel,
          bonus: cabinUpgrade.currentLevel * cabinUpgrade.effect,
        };
      }
      return cabin;
    });
    
    set({ ship: newShip });
    saveShip(newShip);
  },
  
  resetShip: () => {
    const newShip = createDefaultShip();
    const newUpgrades = createDefaultUpgrades();
    const newCargoInventory = [];
    
    set({
      ship: newShip,
      upgrades: newUpgrades,
      rewardPoints: 0,
      cargoInventory: newCargoInventory,
    });
    
    saveShip(newShip);
    saveUpgrades(newUpgrades);
    saveRewardPoints(0);
    saveCargoInventory(newCargoInventory);
  },
  
  addCargoToShip: (cargo, quantity = 1) => {
    const { ship, cargoInventory } = get();
    const shipCargo = ship.cargo || createDefaultShipCargo();
    
    const neededCapacity = cargo.capacity * quantity;
    const usedCapacity = calculateCargoUsedCapacity(shipCargo);
    const freeCapacity = shipCargo.capacity - usedCapacity;
    
    if (neededCapacity > freeCapacity) {
      return false;
    }
    
    const invSlot = cargoInventory.find(s => s.cargo.id === cargo.id);
    if (!invSlot || invSlot.quantity < quantity) {
      return false;
    }
    
    const existingSlot = shipCargo.slots.find(s => s.cargo.id === cargo.id);
    let newSlots: CargoSlot[];
    
    if (existingSlot) {
      newSlots = shipCargo.slots.map(s =>
        s.cargo.id === cargo.id ? { ...s, quantity: s.quantity + quantity } : s
      );
    } else {
      newSlots = [...shipCargo.slots, { cargo, quantity }];
    }
    
    const newShipCargo: ShipCargo = {
      capacity: shipCargo.capacity,
      slots: newSlots,
    };
    
    const newInventory = cargoInventory.map(s =>
      s.cargo.id === cargo.id ? { ...s, quantity: s.quantity - quantity } : s
    ).filter(s => s.quantity > 0);
    
    const newShip = { ...ship, cargo: newShipCargo };
    set({ ship: newShip, cargoInventory: newInventory });
    saveShip(newShip);
    saveCargoInventory(newInventory);
    
    return true;
  },
  
  removeCargoFromShip: (cargoId, quantity = 1) => {
    const { ship, cargoInventory } = get();
    const shipCargo = ship.cargo || createDefaultShipCargo();
    
    const shipSlot = shipCargo.slots.find(s => s.cargo.id === cargoId);
    if (!shipSlot || shipSlot.quantity < quantity) {
      return false;
    }
    
    const cargo = shipSlot.cargo;
    
    const newShipSlots = shipCargo.slots.map(s =>
      s.cargo.id === cargoId ? { ...s, quantity: s.quantity - quantity } : s
    ).filter(s => s.quantity > 0);
    
    const newShipCargo: ShipCargo = {
      capacity: shipCargo.capacity,
      slots: newShipSlots,
    };
    
    const existingInvSlot = cargoInventory.find(s => s.cargo.id === cargoId);
    let newInventory: CargoSlot[];
    
    if (existingInvSlot) {
      newInventory = cargoInventory.map(s =>
        s.cargo.id === cargoId ? { ...s, quantity: s.quantity + quantity } : s
      );
    } else {
      newInventory = [...cargoInventory, { cargo, quantity }];
    }
    
    const newShip = { ...ship, cargo: newShipCargo };
    set({ ship: newShip, cargoInventory: newInventory });
    saveShip(newShip);
    saveCargoInventory(newInventory);
    
    return true;
  },
  
  clearShipCargo: () => {
    const { ship, cargoInventory } = get();
    const shipCargo = ship.cargo || createDefaultShipCargo();
    
    let newInventory = [...cargoInventory];
    
    for (const slot of shipCargo.slots) {
      const existingInvSlot = newInventory.find(s => s.cargo.id === slot.cargo.id);
      if (existingInvSlot) {
        newInventory = newInventory.map(s =>
          s.cargo.id === slot.cargo.id ? { ...s, quantity: s.quantity + slot.quantity } : s
        );
      } else {
        newInventory.push({ cargo: slot.cargo, quantity: slot.quantity });
      }
    }
    
    const newShipCargo: ShipCargo = {
      capacity: shipCargo.capacity,
      slots: [],
    };
    
    const newShip = { ...ship, cargo: newShipCargo };
    set({ ship: newShip, cargoInventory: newInventory });
    saveShip(newShip);
    saveCargoInventory(newInventory);
  },
  
  addCargoToInventory: (cargo, quantity = 1) => {
    const { cargoInventory } = get();
    
    const existingSlot = cargoInventory.find(s => s.cargo.id === cargo.id);
    let newInventory: CargoSlot[];
    
    if (existingSlot) {
      newInventory = cargoInventory.map(s =>
        s.cargo.id === cargo.id ? { ...s, quantity: s.quantity + quantity } : s
      );
    } else {
      newInventory = [...cargoInventory, { cargo, quantity }];
    }
    
    set({ cargoInventory: newInventory });
    saveCargoInventory(newInventory);
  },
  
  removeCargoFromInventory: (cargoId, quantity = 1) => {
    const { cargoInventory } = get();
    
    const slot = cargoInventory.find(s => s.cargo.id === cargoId);
    if (!slot || slot.quantity < quantity) {
      return false;
    }
    
    const newInventory = cargoInventory.map(s =>
      s.cargo.id === cargoId ? { ...s, quantity: s.quantity - quantity } : s
    ).filter(s => s.quantity > 0);
    
    set({ cargoInventory: newInventory });
    saveCargoInventory(newInventory);
    
    return true;
  },
  
  getShipCargoWeight: () => {
    const { ship } = get();
    return calculateCargoWeight(ship.cargo || createDefaultShipCargo());
  },
  
  getShipCargoUsedCapacity: () => {
    const { ship } = get();
    return calculateCargoUsedCapacity(ship.cargo || createDefaultShipCargo());
  },
  
  getShipCargoFreeCapacity: () => {
    const { ship } = get();
    const shipCargo = ship.cargo || createDefaultShipCargo();
    const used = calculateCargoUsedCapacity(shipCargo);
    return shipCargo.capacity - used;
  },
}));
