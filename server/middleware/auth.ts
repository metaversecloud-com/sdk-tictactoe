import { NextFunction, Request, Response } from "express";
import { initVisitor, initWorld } from "../topia/topia.factories.js";
import utils from "../utils.js";
import { DroppedAssetInterface } from "@rtsdk/topia";

export default async (req: Request, res: Response, next: NextFunction) => {
  console.log(`req.body`, req.body);
  console.log(`req.query`, req.query);

  try {
    const credentials = utils.credentialsFromRequest(req);
    const visitor = await initVisitor().get(credentials.visitorId!!, credentials.urlSlug!!,
      { credentials });
    req.visitor = visitor;

    if (!visitor) {
      const message = "401 Please use Topia.io to use this app.";
      console.error(message);
      return res.status(401).send({ message });
    }

    // todo Remove immediately after use
    // Get Ids of all the placed assets
    const world = initWorld().create(credentials.urlSlug!!, { credentials });
    await world.fetchDroppedAssets();
    Object.values(world.droppedAssets).map(da => da as DroppedAssetInterface)
      .forEach(da => console.log(`da.id: `, da.id, "\nda.assetId: ", da.assetId, "\nda.layer0: ",
        da.layer0, "\nda.layer1: ", da.layer1, "\nda.assetScale: ", da.assetScale));

    return next();
  } catch (e: any) {
    console.error(`Error occurred`, e);
    res.status(400).send({ message: e.message });
  }
}
