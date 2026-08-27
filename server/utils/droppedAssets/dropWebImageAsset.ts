import { DroppedAssetClickType } from "@rtsdk/topia";
import { Asset, DroppedAsset } from "../topiaInit.js";
import { Credentials } from "../../types/credentialsInterface.js";

export const dropWebImageAsset = async ({
  credentials,
  layer0 = "",
  layer1 = "",
  position,
  uniqueName,
  clickType,
  clickableLink,
  clickableLinkTitle,
}: {
  credentials: Credentials;
  layer0?: string;
  layer1?: string;
  position?: { x?: number; y?: number };
  uniqueName: string;
  clickType?: DroppedAssetClickType;
  clickableLink?: string;
  clickableLinkTitle?: string;
}) => {
  const { interactivePublicKey, sceneDropId, urlSlug } = credentials;

  const asset = Asset.create(process.env.WEB_IMAGE_ASSET_ID || "webImageAsset", { credentials });

  const droppedAsset = await DroppedAsset.drop(asset, {
    isInteractive: true,
    interactivePublicKey,
    layer0,
    layer1,
    // @ts-ignore
    position,
    sceneDropId,
    uniqueName,
    urlSlug,
    // LINK-type assets (reset / info / leaderboard buttons) open a URL in the
    // drawer; passing undefined here is a no-op so plain image drops are
    // unchanged.
    clickType,
    clickableLink,
    clickableLinkTitle,
    isOpenLinkInDrawer: true,
  });

  return droppedAsset;
};
