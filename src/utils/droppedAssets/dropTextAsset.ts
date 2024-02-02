import { Asset, DroppedAsset } from "../topiaInit.js";
import { Credentials } from "../../types/credentialsInterface";

export const dropTextAsset = async ({
  credentials,
  position,
  style = {},
  text = "",
  uniqueName,
}: {
  credentials: Credentials;
  position: { x: number; y: number };
  style?: {
    textColor?: string;
    textSize?: number;
    textWidth?: number;
  };
  text: string;
  uniqueName: string;
}) => {
  const { interactivePublicKey, urlSlug } = credentials;

  const asset = Asset.create(process.env.TEXT_ASSET_ID, {
    credentials,
  });

  const droppedAsset = await DroppedAsset.drop(asset, {
    isInteractive: true,
    interactivePublicKey,
    position,
    text,
    uniqueName,
    urlSlug,
    ...style,
  });

  return droppedAsset;
};
