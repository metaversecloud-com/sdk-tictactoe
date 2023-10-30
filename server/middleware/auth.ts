import { NextFunction, Request, Response } from "express";
import { initVisitor } from "../topia/topia.factories.js";
import utils from "../utils.js";

export default async (req: Request, res: Response, next: NextFunction) => {
  console.log(`req.body`, req.body);
  console.log(`req.query`, req.query);

  try {
    const credentials = utils.credentialsFromRequest(req);
    console.log(`Extracted credentials: `, credentials);

    const visitor = await initVisitor().get(credentials.visitorId!!, credentials.urlSlug!!, { credentials });
    req.visitor = visitor;
    console.log(`req.visitor.credentials: `, req.visitor.credentials);

    req.visitor.credentials = credentials;

    console.log(`req.visitor.credentials: `, req.visitor.credentials);
    if (!visitor) {
      const message = "401 Please visit Topia.io to use this app.";
      console.error(message);
      return res.status(401).send({ message });
    }

    return next();
  } catch (e: any) {
    console.error(`Error occurred`, e);
    res.status(400).send({ message: e.message });
  }
}
