import { NextFunction, Request, Response } from "express";

/**
 * `key` is urlSlug. This makes sure that only one of the multiple simultaneous calls to the same endpoint is processed.
 */
let processing: { [key: string]: boolean } = {};

/**
 * This middleware is used to allow only one request to an endpoint per `urlSlug` reach the `next` handler. Any more
 * requests will be dropped and responded with status 409.
 *
 * CAUTION: This middleware must be used only after `auth` middleware.
 */
export default async (req: Request, res: Response, next: NextFunction) => {
  const key = req.credentials.urlSlug;
  try {
    if (processing[key])
      return res.status(409).send({ message: "Currently processing a request." });
    processing[key] = true;
    return next();
  } finally {
    processing[key] = false;
  }
}
