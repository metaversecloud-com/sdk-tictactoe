import { Request, Response } from "express";
import { errorHandler, getCredentials } from "../utils/index.js";
import { DroppedAssetInterface } from "@rtsdk/topia";
import { DroppedAsset } from "../utils/topiaInit.js";

export const alignDroppedAssets = async (req: Request, res: Response) => {
  try {
    const assets: string[] = req.body.assets;
    const direction: "left" | "top" | "right" | "bottom" = req.body.direction;

    if (!assets || !assets.length) return res.status(200).send({ message: "OK" });

    const credentials = getCredentials(req.query);
    const droppedAssets: DroppedAssetInterface[] = assets.map((id) => {
      return DroppedAsset.create(id, credentials.urlSlug, { credentials });
    });
    if (!droppedAssets) throw { message: "No dropped assets found" };

    switch (direction) {
      case "left":
        const minX = Math.min(...droppedAssets.map((asset) => asset.position.x));
        for (let asset of droppedAssets) asset.updatePosition(minX, asset.position.y, 0);
        break;
      case "right":
        const maxX = Math.max(...droppedAssets.map((asset) => asset.position.x));
        for (let asset of droppedAssets) asset.updatePosition(maxX, asset.position.y, 0);
        break;
      case "top":
        const minY = Math.min(...droppedAssets.map((asset) => asset.position.y));
        for (let asset of droppedAssets) asset.updatePosition(asset.position.x, minY, 0);
        break;
      case "bottom":
        const maxY = Math.max(...droppedAssets.map((asset) => asset.position.y));
        for (let asset of droppedAssets) asset.updatePosition(asset.position.x, maxY, 0);
        break;
    }

    return res.json({ success: true });
  } catch (error) {
    errorHandler({
      error,
      functionName: "alignDroppedAssets",
      message: "Error aligning dropping assets",
      req,
      res,
    });
  }
};
