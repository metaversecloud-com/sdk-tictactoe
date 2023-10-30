// common functions

import { initDroppedAsset, initVisitor, initWorld } from "../topia/topia.factories";
import { InteractiveCredentials } from "@rtsdk/topia";

// returns the credentials from the query
export const credentialsFromQuery = (req: any): InteractiveCredentials => {
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
    visitorId: Number(query.visitorId),
    assetId: query.assetId as string,
  };
};

export const getProfile = async (credentials: InteractiveCredentials) => {
  try {
    const visitor = await initVisitor().get(credentials.visitorId, credentials.urlSlug, { credentials });

    const { isAdmin, profileId, username } = visitor as any;

    return { isAdmin, profileId, username };
  } catch (error) {
    console.error("getProfile: error", error);
    return {};
  }
};

// GET PROFILE INFOMRATION FROM VISITORID
export const getProfileInformationFromVisitorId = (visitorId: string) => {
};

// WRITE DATA OBJECT TO DROPPEDASSETID
export const writeDataObjectToDroppedAssetId = async (credentials: InteractiveCredentials, droppedAssetId: string, dataObject: any = {}) => {

  // either empty dataObject
  // or we need to update a key
  // or we need to delete a key

  const writeObject = initDroppedAsset().create(credentials.assetId, credentials.urlSlug, { credentials });
  await writeObject.updateDataObject({ dataObject });

};

// GET DROPPED ASSET BY NAME FROM SCENEDROPID

// returns an array where the key is the dropped assets or asset
export const getDroppedAssetByNameFromSceneDropId = async (name: string[], credentials: InteractiveCredentials) => {
  try {
    const world = initWorld().create(credentials.urlSlug, { credentials });
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

