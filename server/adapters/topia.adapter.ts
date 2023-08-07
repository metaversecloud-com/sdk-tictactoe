import { InteractiveAsset, Position } from "../topia/topia.models.js";
import { initDroppedAsset, initUser, initWorld, initWorldActivity } from "../topia/topia.factories.js";
import { DroppedAsset, DroppedAssetInterface, Visitor } from "@rtsdk/topia";

const topiaAdapter = {
  createText: async (options: {
    position: Position,
    requestBody: any,
    text: string,
    textColor: string,
    textSize: number,
    textWidth: number,
    uniqueName: string,
    urlSlug: string,
    interactivePublicKey: string
  }): Promise<DroppedAsset | null> => {
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
      // return Promise.reject(r);
      return null;
    }
  },

  createWebImage: async (options: {
    position: Position,
    requestBody: any,
    imageUrl: string,
    uniqueName: string,
    urlSlug: string,
    interactivePublicKey: string
  }) => {
    try {
      const webImageAsset = await InteractiveAsset({
        ...{
          id: process.env.WEB_IMAGE || "rXLgzCs1wxpx96YLZAN5",
        }, ...options,
      });
      await webImageAsset.updateWebImageLayers("", options.imageUrl);
      return webImageAsset;
    } catch (e) {
      const r = "Error creating web image";
      console.log(r, e);
      return Promise.reject(r);
    }
  },

  // findWebhooks: async (urlSlug: string) => {
  //     const r = await _axios.get<{
  //         "assetId": null | string,
  //         "webhookId": null | string,
  //         "urlSlug": string,
  //         "url": string,
  //         "enteredBy": null | string,
  //         "enteredByUid": null | string,
  //         "type": string,
  //         "description": string,
  //         "dateAdded": {
  //             "_seconds": number,
  //             "_nanoseconds": number
  //         },
  //         "isUniqueOnly": boolean,
  //         "active": boolean,
  //         "title": string
  //     }[]>(`/world/${urlSlug}/webhooks`,
  //         {headers: {Authorization: process.env.API_KEY}})
  //     return r.data
  // },

  // addWorldWebhook: async (urlSlug: string) => {
  //     const existingWebhooks = await topiaAdapter.findWebhooks(urlSlug)
  //     const ourWebhooks = existingWebhooks.filter(wh => wh.type === "join").filter(wh => wh.url.startsWith("https://mini-topia.infinityweb.dev"))
  //     if (ourWebhooks.length)
  //         return ourWebhooks[0]
  //
  //     const payload = {
  //         active: true,
  //         description: "Rings the doorbell",
  //         enteredBy: "Alok",
  //         dataObject: {},
  //         isUniqueOnly: false,
  //         title: "Ring on join",
  //         type: "join",
  //         url: "https://mini-topia.infinityweb.dev/doorbell",
  //         urlSlug
  //     }
  //
  //     const r = await _axios.post(`/world/${urlSlug}/webhooks`, payload, {headers: {Authorization: process.env.API_KEY}})
  //     return r.data
  // },

  listAssets: async (email: string, requestBody: any) => {
    const user = initUser().create({
      credentials: requestBody,
      urlSlug: requestBody.urlSlug,
      visitorId: Number(requestBody.visitorId),
    });
    await user.fetchAssets();
    return Object.values(user.assets);
  },

  dropAsset: async (urlSlug: string, options: {
    assetId: string,
    position: Position,
    uniqueName?: string, interactivePublicKey: string
  }, requestBody: any): Promise<DroppedAsset | null> => InteractiveAsset({
    id: options.assetId, position: options.position,
    uniqueName: options.uniqueName || Date.now() + "", requestBody, urlSlug,
    interactivePublicKey: options.interactivePublicKey,
  }),

  dropScene: async (urlSlug: string, config: {
    sceneId: string,
    position: {
      x: number,
      y: number
    },
    assetSuffix: string
  }, requestBody: any) => initWorld().create(urlSlug, { credentials: requestBody }).dropScene(config),

  removeDroppedAsset: async (urlSlug: string, droppedAssetId: string, requestBody: any) => {
    const droppedAsset = initDroppedAsset().create(droppedAssetId, urlSlug, { credentials: requestBody });
    await droppedAsset.deleteDroppedAsset();
    console.log(`Removed ${droppedAssetId} from ${urlSlug}.`);
  },

  removeDroppedAssets: async (urlSlug: string, assetIds: string[], requestBody: any) =>
    Promise.allSettled(assetIds.map(id => topiaAdapter.removeDroppedAsset(urlSlug, id, requestBody))),

  /**
   * Using interactive credentials
   *
   * @param requestBody
   * @return {Promise<Visitor[]>}
   */
  getCurrentVisitors: async (requestBody: any) => {
    const worldActivity = await initWorldActivity().create(requestBody.urlSlug, { credentials: requestBody });
    const visitors = Object.values(await worldActivity.currentVisitors());
    console.log(`Found ${visitors.length} visitors in world ${requestBody.urlSlug}.`);
    return visitors;
  },

  getDroppedAssets: async (requestBody: any, options?: { urlSlug?: string, nameSubstr: string }) => {
    try {
      const world = requestBody ? initWorld().create(requestBody.urlSlug, { credentials: requestBody }) :
        initWorld().create(options?.urlSlug);

      await world.fetchDroppedAssets();
      let droppedAssets = Object.values(world.droppedAssets) as DroppedAssetInterface[];

      if (options?.nameSubstr)
        // @ts-ignore
        droppedAssets = droppedAssets.filter(da => da.uniqueName).filter(da => da.uniqueName.indexOf(options.nameSubstr) > -1);

      console.log(`Found ${droppedAssets.length} dropped assets in world ${requestBody ? requestBody.urlSlug : options?.urlSlug}.`);
      return droppedAssets;
    } catch (e) {
      console.error(`Error occurred in fetching dropped assets`, e);
      return [];
    }
  },
};

export default topiaAdapter;
