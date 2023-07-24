import topiaAdapter from "../adapters/topia.adapter.js";
import { Request, Response } from "express";

export default {
  list: async (req: Request, res: Response) => {
    try {
      res.status(200).send(await topiaAdapter.getCurrentVisitors(req.body));
    } catch (e: any) {
      console.error(`Error occurred in listing scenes`, e);
      res.status(409).send({ message: e.message });
    }
  },
};
