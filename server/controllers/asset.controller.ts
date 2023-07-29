import topiaAdapter from "../adapters/topia.adapter.js";
import { Request, Response } from "express";

export default {
  getDropped: async (req: Request, res: Response) =>
    res.status(200).send(await topiaAdapter.getDroppedAssets(req.body)),

  list: async (req: Request, res: Response) =>
    res.status(200).send(await topiaAdapter.listAssets(req.body.email, req.body)),

  align: async (req: Request, res: Response) => {
    const assets: string[] = req.body.assets;
    const direction: "left" | "top" | "right" | "bottom" = req.body.direction;

    if (!assets || !assets.length)
      return res.status(200).send({ message: "OK" });

    const droppedAssets = await topiaAdapter.getDroppedAssets(req.body);

    const selectedAssets = assets.map(id => droppedAssets.find(da => da.id === id));

    switch (direction) {
      case "left":
        const minX = Math.min(...(selectedAssets.map(sa => sa.position.x)));
        for (let sa of selectedAssets)
          sa.updatePosition(minX, sa.position.y);
        break;
      case "right":
        const maxX = Math.max(...(selectedAssets.map(sa => sa.position.x)));
        for (let sa of selectedAssets)
          sa.updatePosition(maxX, sa.position.y);
        break;

      case "top":
        const minY = Math.min(...(selectedAssets.map(sa => sa.position.y)));
        for (let sa of selectedAssets)
          sa.updatePosition(sa.position.x, minY);
        break;
      case "bottom":
        const maxY = Math.max(...(selectedAssets.map(sa => sa.position.y)));
        for (let sa of selectedAssets)
          sa.updatePosition(sa.position.x, maxY);
        break;
    }

    return res.status(200).send({ message: "OK" });
  },
};
