import { Asset, DroppedAsset } from "../topiaInit.js";
import { Credentials } from "../../types/credentialsInterface.js";

export const dropWebImageAsset = async ({
  credentials,
  layer0 = "",
  layer1 = "",
  position,
  uniqueName,
}: {
  credentials: Credentials;
  layer0?: string;
  layer1?: string;
  position?: { x?: number; y?: number };
  uniqueName: string;
}) => {
  const { interactivePublicKey, urlSlug } = credentials;

  const asset = Asset.create(process.env.WEB_IMAGE || "webImageAsset", {
    credentials,
  });

  const droppedAsset = await DroppedAsset.drop(asset, {
    isInteractive: true,
    interactivePublicKey,
    layer0,
    layer1,
    // @ts-ignore
    position,
    uniqueName,
    urlSlug,
  });

  return droppedAsset;
};
