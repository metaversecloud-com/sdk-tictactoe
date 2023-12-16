import { Request, Response } from "express";
import { WorldActivity } from "../topia/index.js";

export default {
  list: async (req: Request, res: Response) => {
    try {
      const world = await WorldActivity.create(req.body.urlSlug, {});
      const visitors = await world.currentVisitors();
      res.status(200).send(visitors);
    } catch (e: any) {
      console.error(`Error occurred in listing scenes`, e);
      res.status(409).send({ message: e.message });
    }
  },
};
