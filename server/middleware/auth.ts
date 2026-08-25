import { NextFunction, Request, Response } from "express";
import { errorHandler, getCredentials } from "../utils/index.js";
import { Visitor } from "../utils/topiaInit.js";

/**
 * Auth middleware.
 * Client GETs put credentials on the query string.
 * Webhook POSTs put credentials in the JSON body.
 * We accept either, favoring whichever has an interactiveNonce.
 */
export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const source =
      req.body && req.body.interactiveNonce
        ? req.body
        : req.query && req.query.interactiveNonce
        ? req.query
        : req.body;

    const credentials = getCredentials(source);
    req.credentials = credentials;

    const visitor = await Visitor.get(credentials.visitorId, credentials.urlSlug, { credentials });
    if (!visitor) throw new Error("Visitor not found in world.");

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
