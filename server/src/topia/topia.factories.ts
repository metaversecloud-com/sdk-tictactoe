import dotenv from "dotenv";

// todo Eliminate use of API key
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
import myTopiaInstance from "../../utils/topiaInstance.js";

dotenv.config();

const initWorld = (apiKey?: string) => new WorldFactory(apiKey ? new Topia({ apiKey }) : myTopiaInstance);
const initAsset = (apiKey?: string) => new AssetFactory(apiKey ? new Topia({ apiKey }) : myTopiaInstance);
const initDroppedAsset = (apiKey?: string) => new DroppedAssetFactory(apiKey ? new Topia({ apiKey }) : myTopiaInstance);
const initUser = (apiKey?: string) => new UserFactory(apiKey ? new Topia({ apiKey }) : myTopiaInstance);

/**
 * Can be used to move a visitor in the world
 * @param apiKey {string|undefined}
 * @type {VisitorFactory}
 */
const initVisitor = (apiKey?: string) => new VisitorFactory(apiKey ? new Topia({ apiKey }) : myTopiaInstance);

const initWorldActivity = (apiKey?: string) => new WorldActivityFactory(apiKey ? new Topia({ apiKey }) : myTopiaInstance);

const initScene = (apiKey?: string) => new SceneFactory(apiKey ? new Topia({ apiKey }) : myTopiaInstance);

export {
  myTopiaInstance,
  initWorld,
  initAsset,
  initDroppedAsset,
  initVisitor,
  initUser,
  initScene,
  initWorldActivity,
};
