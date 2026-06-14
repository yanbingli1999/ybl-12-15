import React from 'react';
import { Package, Plus, Minus, PackageOpen, TrendingDown, TrendingUp, Weight, Box, Info } from 'lucide-react';
import { useShipStore } from '../store/useShipStore';
import { CARGO_LIST, calculateCargoWeight, calculateCargoUsedCapacity, calculateWeightPenalty, calculateCargoRewardMultiplier } from '../data/cargo';
import type { Cargo } from '../types';

const rarityColors: Record<string, string> = {
  common: 'border-gray-500 text-gray-300',
  uncommon: 'border-neon-green text-neon-green',
  rare: 'border-neon-purple text-neon-purple',
};

const rarityBgColors: Record<string, string> = {
  common: 'bg-gray-500/10',
  uncommon: 'bg-neon-green/10',
  rare: 'bg-neon-purple/10',
};

const effectTypeLabels: Record<string, string> = {
  passive: '被动效果',
  active: '主动使用',
  reward: '奖励加成',
};

const effectTypeColors: Record<string, string> = {
  passive: 'text-neon-blue',
  active: 'text-neon-red',
  reward: 'text-neon-yellow',
};

export const CargoPage: React.FC = () => {
  const {
    ship,
    cargoInventory,
    addCargoToShip,
    removeCargoFromShip,
    clearShipCargo,
    getShipCargoWeight,
    getShipCargoUsedCapacity,
    getShipCargoFreeCapacity,
  } = useShipStore();

  const shipCargo = ship.cargo || { capacity: 10, slots: [] };
  const totalWeight = getShipCargoWeight();
  const usedCapacity = getShipCargoUsedCapacity();
  const freeCapacity = getShipCargoFreeCapacity();
  const { evasionPenalty, energyPenalty } = calculateWeightPenalty(totalWeight);
  const rewardMultiplier = calculateCargoRewardMultiplier(shipCargo);

  const handleAddToShip = (cargo: Cargo) => {
    addCargoToShip(cargo, 1);
  };

  const handleRemoveFromShip = (cargoId: string) => {
    removeCargoFromShip(cargoId, 1);
  };

  const getInventoryQuantity = (cargoId: string): number => {
    const slot = cargoInventory.find(s => s.cargo.id === cargoId);
    return slot?.quantity || 0;
  };

  const getShipQuantity = (cargoId: string): number => {
    const slot = shipCargo.slots.find(s => s.cargo.id === cargoId);
    return slot?.quantity || 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold text-neon-blue">
          货舱载荷
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-space-800 px-4 py-2 rounded-lg">
            <Weight className="w-5 h-5 text-neon-orange" />
            <span className="font-display font-bold text-neon-orange">
              {totalWeight} 吨
            </span>
          </div>
          <div className="flex items-center gap-2 bg-space-800 px-4 py-2 rounded-lg">
            <Box className="w-5 h-5 text-neon-cyan" />
            <span className="font-display font-bold text-neon-cyan">
              {usedCapacity} / {shipCargo.capacity}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="glass-panel neon-border p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-neon-red" />
            <span className="text-sm text-gray-400">闪避惩罚</span>
          </div>
          <div className="text-2xl font-display font-bold text-neon-red">
            -{(evasionPenalty * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            重量越高，闪避率越低
          </div>
        </div>

        <div className="glass-panel neon-border p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-neon-yellow" />
            <span className="text-sm text-gray-400">初始能量惩罚</span>
          </div>
          <div className="text-2xl font-display font-bold text-neon-yellow">
            -{energyPenalty}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            重量越高，初始能量越少
          </div>
        </div>

        <div className="glass-panel neon-border p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-neon-green" />
            <span className="text-sm text-gray-400">奖励倍率</span>
          </div>
          <div className="text-2xl font-display font-bold text-neon-green">
            x{rewardMultiplier.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            战利品货柜提供额外奖励
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
            <PackageOpen className="w-5 h-5 text-neon-blue" />
            舰船货舱
          </h3>
          
          <div className="glass-panel neon-border p-4 rounded-xl mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-400">容量使用</div>
              <div className="text-sm font-display text-white">
                {usedCapacity} / {shipCargo.capacity}
              </div>
            </div>
            <div className="stat-bar">
              <div
                className="stat-bar-fill bg-neon-cyan"
                style={{ width: `${(usedCapacity / shipCargo.capacity) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-3 text-xs">
              <span className="text-gray-500">剩余容量: {freeCapacity}</span>
              <button
                onClick={clearShipCargo}
                disabled={shipCargo.slots.length === 0}
                className="text-neon-red hover:text-neon-red/80 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                清空货舱
              </button>
            </div>
          </div>

          {shipCargo.slots.length === 0 ? (
            <div className="glass-panel p-8 rounded-xl text-center">
              <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">货舱为空</p>
              <p className="text-xs text-gray-600 mt-1">从右侧仓库添加载荷</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shipCargo.slots.map(slot => (
                <div
                  key={slot.cargo.id}
                  className={`glass-panel p-4 rounded-xl border ${rarityColors[slot.cargo.rarity]} ${rarityBgColors[slot.cargo.rarity]}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{slot.cargo.icon}</div>
                      <div>
                        <h4 className="font-display font-bold text-white">
                          {slot.cargo.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs ${effectTypeColors[slot.cargo.effect.type]}`}>
                            {effectTypeLabels[slot.cargo.effect.type]}
                          </span>
                          <span className="text-xs text-gray-500">
                            容量: {slot.cargo.capacity} | 重量: {slot.cargo.weight}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {slot.cargo.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRemoveFromShip(slot.cargo.id)}
                        className="w-8 h-8 rounded-lg bg-neon-red/20 text-neon-red border border-neon-red/50 hover:bg-neon-red/30 flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-xl font-display font-bold text-white w-8 text-center">
                        {slot.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-neon-purple" />
            载荷仓库
          </h3>

          <div className="glass-panel p-3 rounded-xl mb-4">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-neon-blue mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-400">
                载荷会占用货舱容量并增加舰船重量。合理搭配被动、主动和奖励类载荷，在战斗力和收益之间找到平衡。
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {CARGO_LIST.map(cargo => {
              const invQuantity = getInventoryQuantity(cargo.id);
              const shipQuantity = getShipQuantity(cargo.id);
              const canAdd = invQuantity > 0 && cargo.capacity <= freeCapacity;

              return (
                <div
                  key={cargo.id}
                  className={`glass-panel p-4 rounded-xl border ${rarityColors[cargo.rarity]} ${rarityBgColors[cargo.rarity]}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{cargo.icon}</div>
                      <div>
                        <h4 className="font-display font-bold text-white">
                          {cargo.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs ${effectTypeColors[cargo.effect.type]}`}>
                            {effectTypeLabels[cargo.effect.type]}
                          </span>
                          <span className="text-xs text-gray-500">
                            容量: {cargo.capacity} | 重量: {cargo.weight}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {cargo.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span className="text-gray-500">
                            仓库: <span className="text-white font-display">{invQuantity}</span>
                          </span>
                          <span className="text-gray-500">
                            已装载: <span className="text-neon-cyan font-display">{shipQuantity}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddToShip(cargo)}
                      disabled={!canAdd}
                      className={`
                        w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                        ${canAdd
                          ? 'bg-neon-green/20 text-neon-green border border-neon-green/50 hover:bg-neon-green/30'
                          : 'bg-space-700 text-gray-600 border border-space-600 cursor-not-allowed'}
                      `}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
