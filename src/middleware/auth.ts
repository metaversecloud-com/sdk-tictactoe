import { NextFunction, Request, Response } from "express";
import { errorHandler, getCredentials } from "../utils/index.js";
import { Visitor } from "../utils/topiaInit.js";

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const credentials = getCredentials(req.body);
    req.credentials = credentials;

    const visitor = await Visitor.get(credentials.visitorId, credentials.urlSlug, { credentials });
    if (!visitor) throw "Visitor not found in world.";

    return next();
  } catch (error: any) {
    return errorHandler({
      error,
      functionName: "auth",
      message: "Error validating visitor in world",
      req,
      res,
    });
  }
};
