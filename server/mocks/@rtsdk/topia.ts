// Minimal @rtsdk/topia mock for jest tests. Tests generally mock
// utils/index.js at a higher level, so this file only needs to satisfy the
// imports and produce constructors that don't throw.

export const WorldActivityType = { GAME_ON: "GAME_ON", GAME_WAITING: "GAME_WAITING" } as const;

export class Topia {
  constructor(_opts: any) {}
}

export class AssetFactory {
  constructor(_topia: any) {}
  create(_id: string, _opts: any) {
    return {};
  }
}

export class DroppedAssetFactory {
  constructor(_topia: any) {}
  static get(_id: string, _slug: string, _opts: any) {
    return Promise.resolve({} as any);
  }
  get = jest.fn().mockResolvedValue({});
  create = jest.fn().mockResolvedValue({});
  drop = jest.fn().mockResolvedValue({});
}

export class EcosystemFactory {
  constructor(_topia: any) {}
  create(_opts: any) {
    return { fetchInventoryItems: jest.fn().mockResolvedValue([]), inventoryItems: [] };
  }
}

export class UserFactory {
  constructor(_topia: any) {}
  create(_opts: any) {
    return { grantInventoryItem: jest.fn().mockResolvedValue({}) };
  }
}

export class VisitorFactory {
  constructor(_topia: any) {}
  get = jest.fn().mockResolvedValue({ isAdmin: false });
  create = jest.fn().mockResolvedValue({});
}

export class WorldFactory {
  constructor(_topia: any) {}
  create(_slug: string, _opts: any) {
    return {
      fetchDataObject: jest.fn().mockResolvedValue({}),
      setDataObject: jest.fn().mockResolvedValue({}),
      updateDataObject: jest.fn().mockResolvedValue({}),
      incrementDataObjectValue: jest.fn().mockResolvedValue({}),
      triggerParticle: jest.fn().mockResolvedValue({}),
      triggerActivity: jest.fn().mockResolvedValue({}),
      fireToast: jest.fn().mockResolvedValue({}),
      fetchDroppedAssetsBySceneDropId: jest.fn().mockResolvedValue([]),
      fetchDroppedAssetsWithUniqueName: jest.fn().mockResolvedValue([]),
    };
  }
  static deleteDroppedAssets = jest.fn().mockResolvedValue({});
  deleteDroppedAssets = jest.fn().mockResolvedValue({});
}

export class WorldActivityFactory {
  constructor(_topia: any) {}
  create(_slug: string, _opts: any) {
    return {};
  }
}

// Type exports so callers `import type` don't fail.
export type VisitorInterface = any;
export type DroppedAssetInterface = any;
export type InventoryItemInterface = any;
