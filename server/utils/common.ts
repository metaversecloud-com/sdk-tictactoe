// common functions

import { DroppedAssetFactory, VisitorFactory, WorldFactory } from "@rtsdk/topia";
import { Credentials } from "./types";
import myTopiaInstance from "./topiaInstance";

// returns the credentials from the query
export const credentialsFromQuery = (req: any): Credentials => {
  const requiredFields = ["interactiveNonce", "interactivePublicKey", "urlSlug", "visitorId", "assetId"];
  const { query } = req;
  const missingFields = requiredFields.filter((variable) => !query[variable]);
  if (missingFields.length > 0) {
    throw new Error(`Missing required query parameters: ${missingFields.join(", ")}`);
  }

  return {
    interactiveNonce: query.interactiveNonce as string,
    interactivePublicKey: query.interactivePublicKey as string,
    urlSlug: query.urlSlug as string,
    visitorId: query.visitorId as string,
    assetId: query.assetId as string,
  };
};



export const extractImageURL = (url: string) => {
  return `https://${url.split("https%3A//")[1].split("?")[0]}`
}

// GET DATA OBJECT FROM DROPPEDASSETID
export const getDataObjectFromDroppedAsset = async (droppedAssetId: string, credentials: Credentials, key?: string) => {
  try {
    const asset = await new DroppedAssetFactory(myTopiaInstance).get(droppedAssetId, credentials.urlSlug, {
      credentials,
    });

    const { dataObject } = asset;

    if (!key) {
      return dataObject;
    }

    return dataObject[key];
  } catch (error) {
    console.error("getDataObjectFromDroppedAsset: error", error);
    return {};
  }
};

export const getProfile = async (credentials: Credentials) => {
  try {
    const visitor = await new VisitorFactory(myTopiaInstance).get(
      parseInt(credentials.visitorId),
      credentials.urlSlug,
      {
        credentials,
      },
    );

    const { isAdmin, profileId, username } = visitor as any;

    return { isAdmin, profileId, username };
  } catch (error) {
    console.error("getProfile: error", error);
    return {};
  }
};

// GET PROFILE INFOMRATION FROM VISITORID
export const getProfileInformationFromVisitorId = (visitorId: string) => {};

// WRITE DATA OBJECT TO DROPPEDASSETID
export const writeDataObjectToDroppedAssetId = async (credentials: Credentials, droppedAssetId: string, dataObject: any = {}) => {

  // either empty dataObject
  // or we need to update a key
  // or we need to delete a key

  const writeObject = await new DroppedAssetFactory(myTopiaInstance).create(
    credentials.assetId,
    credentials.urlSlug,
    {
      credentials,
    },
  );

  await writeObject.updateDataObject({ dataObject });

};

// GET DROPPED ASSET BY NAME FROM SCENEDROPID

// returns an array where the key is the dropped assets or asset
export const getDroppedAssetByNameFromSceneDropId = async (name: string[], credentials: Credentials) => {
  try {
    const world = new WorldFactory(myTopiaInstance).create(credentials.urlSlug, { credentials });
    const { sceneDropIds } = (await world.fetchSceneDropIds()) as any;
    // only works for one scene drop id for now
    const assetsList = (await world.fetchDroppedAssetsBySceneDropId({ sceneDropId: sceneDropIds[0] })) as any;

    const assets = name.map((name) => {
      return {
        name,
        assets: assetsList.filter((asset: any) => asset.assetName === name),
      };
    });

    return assets;
  } catch (error) {
    console.error(error);
  }
};

