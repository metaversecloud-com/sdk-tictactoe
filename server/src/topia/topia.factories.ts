import dotenv from "dotenv";

import {
  AssetFactory,
  DroppedAssetFactory,
  SceneFactory,
  Topia,
  UserFactory,
  VisitorFactory,
  WorldActivityFactory,
  WorldFactory,
} from "@rtsdk/topia";

dotenv.config();

const defaultConfig = {
  apiProtocol: "https",
  // apiKey: process.env.API_KEY,
  interactiveKey: process.env.INTERACTIVE_KEY,
  interactiveSecret: process.env.INTERACTIVE_SECRET,
};

const topia = new Topia(defaultConfig);

const initWorld = (apiKey?: string) => new WorldFactory(apiKey ? new Topia({ apiKey }) : topia);
const initAsset = (apiKey?: string) => new AssetFactory(apiKey ? new Topia({ apiKey }) : topia);
const initDroppedAsset = (apiKey?: string) => new DroppedAssetFactory(apiKey ? new Topia({ apiKey }) : topia);
const initUser = (apiKey?: string) => new UserFactory(apiKey ? new Topia({ apiKey }) : topia);

/**
 * Can be used to move a visitor in the world
 * @param apiKey {string|undefined}
 * @type {VisitorFactory}
 */
const initVisitor = (apiKey?: string) => new VisitorFactory(apiKey ? new Topia({ apiKey }) : topia);

const initWorldActivity = (apiKey?: string) => new WorldActivityFactory(apiKey ? new Topia({ apiKey }) : topia);

const initScene = (apiKey?: string) => new SceneFactory(apiKey ? new Topia({ apiKey }) : topia);

export {
  topia,
  initWorld,
  initAsset,
  initDroppedAsset,
  initVisitor,
  initUser,
  initScene,
  initWorldActivity,
};
