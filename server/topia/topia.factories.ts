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

const config = {
  apiDomain: process.env.INSTANCE_DOMAIN || "api-stage.topia.io",
  apiProtocol: process.env.INSTANCE_PROTOCOL || "https",
  interactiveKey: process.env.INTERACTIVE_KEY,
  interactiveSecret: process.env.INTERACTIVE_SECRET,
};

// creating instances of Topia
const topiaInstance = await new Topia(config);

let _worldFactory: WorldFactory | undefined = undefined;
let _assetFactory: AssetFactory | undefined = undefined;
let _droppedAssetFactory: DroppedAssetFactory | undefined = undefined;
let _userFactory: UserFactory | undefined = undefined;
let _visitorFactory: VisitorFactory | undefined = undefined;
let _worldActivityFactory: WorldActivityFactory | undefined = undefined;
let _sceneFactory: SceneFactory | undefined = undefined;

const initWorld = () => {
  if (!_worldFactory)
    _worldFactory = new WorldFactory(topiaInstance);

  return _worldFactory;
};

const initAsset = () => {
  if (!_assetFactory)
    _assetFactory = new AssetFactory(topiaInstance);
  return _assetFactory;
};

const initDroppedAsset = () => {
  if (!_droppedAssetFactory)
    _droppedAssetFactory = new DroppedAssetFactory(topiaInstance);
  return _droppedAssetFactory;
};

const initUser = () => {
  if (!_userFactory)
    _userFactory = new UserFactory(topiaInstance);
  return _userFactory;
};

/**
 * Can be used to move a visitor in the world
 * @type {VisitorFactory}
 */
const initVisitor = () => {
  if (!_visitorFactory)
    _visitorFactory = new VisitorFactory(topiaInstance);
  return _visitorFactory;
};

const initWorldActivity = () => {
  if (!_worldActivityFactory)
    _worldActivityFactory = new WorldActivityFactory(topiaInstance);
  return _worldActivityFactory;
};

const initScene = () => {
  if (!_sceneFactory)
    _sceneFactory = new SceneFactory(topiaInstance);
  return _sceneFactory;
};

export {
  initWorld,
  initAsset,
  initDroppedAsset,
  initVisitor,
  initUser,
  initScene,
  initWorldActivity,
};
