import { Asset, DroppedAsset } from "../topiaInit.js";
import { Credentials } from "../../types/credentialsInterface";

export const dropTextAsset = async ({
  credentials,
  position,
  style = {
    textColor: "#333333",
    textSize: 20,
    textWidth: 300,
  },
  text = "",
  uniqueName,
}: {
  credentials: Credentials;
  position: { x: number; y: number };
  style?: {
    textColor: string;
    textSize: number;
    textWidth: number;
  };
  text: string;
  uniqueName: string;
}) => {
  const { interactivePublicKey, urlSlug } = credentials;

  const asset = Asset.create(process.env.CUSTOM_TEXT || "rXLgzCs1wxpx96YLZAN5", {
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
