import { InteractiveAsset, Position } from "../topia/topia.models.js";
import axios from "axios";
import { initDroppedAsset, initWorld, initWorldActivity } from "../topia/topia.factories.js";
import { DroppedAsset, Visitor } from "../../types/index.js";

const _axios = axios.create({
  baseURL: "https://api.topia.io/api",
});

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
  }): Promise<DroppedAsset> => {
    try {
      const textAsset = await InteractiveAsset({
        ...{
          id: process.env.CUSTOM_TEXT!!,
        }, ...options,
      });

      await textAsset.updateCustomTextAsset({
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

  listTopiaScenes: async (email: string, apiKey: string) => {
    const r = await _axios.get(`/scenes/topia-scenes?email=${email}`, {
      headers: { Authorization: apiKey },
    });
    return r.data;
  },

  /**
   *
   * @param email     {string}
   * @param apiKey    {string}
   * @return {Promise<{id: string, assetName: string, addedOn: string, specialType: string, isVideoPlayer: boolean, topLayerURL: string, bottomLayerURL: string}[]>}
   */
  listAssets: async (email: string, apiKey: string) => {
    const assets: {
      "id": string,
      "assetName": string,
      "addedOn": string,
      "specialType": string,
      "isVideoPlayer": boolean,
      "topLayerURL": string,
      "bottomLayerURL": string
    }[] = [];
    let r = await _axios.get(`/assets/topia-assets?email=${email}`, {
      headers: { Authorization: apiKey },
    });
    assets.push(...(r.data));
    r = await _axios.get(`/assets/my-assets?email=${email}`, {
      headers: { Authorization: apiKey },
    });
    assets.push(...(r.data));
    return assets;
  },

  dropAsset: async (urlSlug: string, options: {
    assetId: string,
    position: Position,
    uniqueName?: string
  }, requestBody: any): Promise<DroppedAsset> =>
    InteractiveAsset({
      id: options.assetId, position: options.position,
      uniqueName: options.uniqueName || Date.now() + "", requestBody, urlSlug,
    }),

  dropScene: async (urlSlug: string, config: {
    sceneId: string,
    position: {
      x: number,
      y: number
    },
    assetSuffix: string
  }, apiKey: string) => {
    const r = await _axios.post(`/world/${urlSlug}/drop-scene`, config,
      { headers: { Authorization: apiKey } });
    return r.data;
  },

  removeDroppedAsset: async (urlSlug: string, droppedAssetId: string, requestBody: any) => {
    const droppedAsset = initDroppedAsset().create(droppedAssetId, urlSlug, { credentials: requestBody });
    await droppedAsset.deleteDroppedAsset();
    console.log(`Removed ${droppedAssetId} from ${urlSlug}.`);
  },

  removeDroppedAssets: async (urlSlug: string, assetIds: string[], requestBody: any) =>
    Promise.allSettled(assetIds.map(id => topiaAdapter.removeDroppedAsset(urlSlug, id, requestBody))),

  getVisitor: async (urlSlug: string, visitorId: string, apiKey: string) => {
    const r = await _axios.get<{ [p: string]: Visitor }>(`/world/${urlSlug}/visitors`,
      { headers: { Authorization: apiKey } });
    return r.data[visitorId];
  },

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

  /**
   *
   * @param requestBody   {any|undefined}
   * @param options   {{apiKey?: string, urlSlug?: string, nameSubstr: string}|undefined}
   * @return {Promise<DroppedAsset[]>}
   */
  getDroppedAssets: async (requestBody: any, options?: { apiKey?: string, urlSlug?: string, nameSubstr: string }) => {
    try {
      const world = requestBody ?
        await initWorld().create(requestBody.urlSlug, { credentials: requestBody }) :
        await initWorld(options?.apiKey).create(options?.urlSlug);

      await world.fetchDroppedAssets();
      let droppedAssets: DroppedAsset[] = Object.values(world.droppedAssets);

      if (options?.nameSubstr)
        droppedAssets = droppedAssets.filter(da => da.uniqueName)
          .filter(da => da.uniqueName.indexOf(options.nameSubstr) > -1);

      console.log(`Found ${droppedAssets.length} dropped assets in world ${requestBody ? requestBody.urlSlug : options?.urlSlug}.`);
      return droppedAssets;
    } catch (e) {
      console.error(`Error occurred in fetching dropped assets`, e);
      return [];
    }
  },
};

export default topiaAdapter;
