import { NextFunction, Request, Response } from "express";
import { Visitor } from "../topia/index.js";
import { errorHandler, getCredentials } from "../utils/index.js";

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const credentials = getCredentials(req.query);
    req.credentials = credentials;

    const visitor = await Visitor.get(credentials.visitorId, credentials.urlSlug, { credentials });
    if (!visitor) throw "Visitor not found in world.";

    return next();
  } catch (error: any) {
    errorHandler({
      error,
      functionName: "auth",
      message: "Error validating visitor in world",
      req,
      res,
    });
  }
};
