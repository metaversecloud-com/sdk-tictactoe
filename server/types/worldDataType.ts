/**
 * World data object shape. This app writes exactly one key here — a
 * per-scene-drop cache mapping scene drops to their resolved key asset id,
 * populated on demand by `getKeyAsset`. Nothing else is stored on the
 * world data object.
 */
export type WorldDataType = {
  scenes?: {
    [sceneDropId: string]: {
      keyAssetId: string;
    };
  };
};
