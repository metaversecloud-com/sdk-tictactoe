import { InteractiveAsset, Position } from "../topia/topia.models.js";
import { initDroppedAsset, initUser, initWorld, initWorldActivity } from "../topia/topia.factories.js";
import { DroppedAsset, DroppedAssetInterface, InteractiveCredentials, Visitor } from "@rtsdk/topia";

const topiaAdapter = {
  createText: async (options: {
    position: Position,
    credentials: InteractiveCredentials,
    text: string,
    textColor: string,
    textSize: number,
    textWidth: number,
    uniqueName: string,
    urlSlug: string,
  }) => {
    try {
      const textAsset = await InteractiveAsset({
        ...{
          id: process.env.CUSTOM_TEXT || "rXLgzCs1wxpx96YLZAN5",
        }, ...options,
      });

      await textAsset?.updateCustomTextAsset({
          ...{
            textFontFamily: "Arial",
            textWeight: "normal",
          }, ...options,
        },
        options.text,
      );
      return textAsset;
    } catch (e) {
      const r = "Error updating track text";
      console.log(r, e);
      return Promise.reject(r);
    }
  },

  createWebImage: async (options: {
    position: Position,
    credentials: InteractiveCredentials,
    imageUrl: string,
    uniqueName: string,
    urlSlug: string,
  }) => {
    try {
      const webImageAsset = await InteractiveAsset({
        ...options, ...{
          id: process.env.WEB_IMAGE || "webImageAsset",
          bottom: "",
          top: options.imageUrl,
        },
      });

      await webImageAsset.updateWebImageLayers(``, options.imageUrl);
      return webImageAsset;
    } catch (e) {
      const r = "Error creating web image";
      console.error(r, e);
      return Promise.reject(r);
    }
  },

  listAssets: async (email: string, visitor: Visitor) => {
    const user = initUser().create({
      credentials: visitor.credentials,
      urlSlug: visitor.urlSlug,
      visitorId: visitor.id,
    });
    await user.fetchAssets();
    return Object.values(user.assets);
  },

  dropAsset: async (urlSlug: string, options: {
    assetId: string,
    position: Position,
    uniqueName?: string
  }, credentials: InteractiveCredentials): Promise<DroppedAsset | null> => InteractiveAsset({
    id: options.assetId, position: options.position,
    uniqueName: options.uniqueName || Date.now() + "", credentials, urlSlug,
  }),

  dropScene: async (urlSlug: string, config: {
    sceneId: string,
    position: {
      x: number,
      y: number
    },
    assetSuffix: string
  }, credentials: InteractiveCredentials) => initWorld().create(urlSlug, { credentials }).dropScene(config),

  removeDroppedAsset: async (urlSlug: string, droppedAssetId: string, credentials: InteractiveCredentials) => {
    const droppedAsset = initDroppedAsset().create(droppedAssetId, urlSlug, { credentials });
    await droppedAsset.deleteDroppedAsset();
    console.log(`Removed ${droppedAssetId} from ${urlSlug}.`);
  },

  removeDroppedAssets: async (urlSlug: string, assetIds: string[], credentials: InteractiveCredentials) =>
    Promise.allSettled(assetIds.map(id => topiaAdapter.removeDroppedAsset(urlSlug, id, credentials))),

  /**
   * Using interactive credentials
   *
   */
  getCurrentVisitors: async (credentials: InteractiveCredentials) => {
    const worldActivity = initWorldActivity().create(credentials.urlSlug, { credentials });
    const visitors = Object.values(await worldActivity.currentVisitors());
    console.log(`Found ${visitors.length} visitors in world ${credentials.urlSlug}.`);
    return visitors;
  },

  getDroppedAssets: async (credentials: InteractiveCredentials, options?: { urlSlug?: string, nameSubstr: string }) => {
    try {
      const world = initWorld().create(credentials.urlSlug, { credentials });

      await world.fetchDroppedAssets();
      let droppedAssets = Object.values(world.droppedAssets) as DroppedAssetInterface[];

      if (options?.nameSubstr)
        droppedAssets = droppedAssets.filter(da => da.uniqueName).filter(da => da.uniqueName.indexOf(options.nameSubstr) > -1);

      console.log(`Found ${droppedAssets.length} dropped assets in world ${credentials.urlSlug}.`);
      return droppedAssets;
    } catch (e) {
      console.error(`Error occurred in fetching dropped assets`, e);
      return [];
    }
  },
};

export default topiaAdapter;
