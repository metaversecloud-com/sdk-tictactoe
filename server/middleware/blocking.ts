import { NextFunction, Request, Response } from "express";
import DataObject from "../topia/DataObject.js";
import { Visitor } from "@rtsdk/topia";

const LockDO = new DataObject<Visitor, boolean>("locking");

/**
 * This middleware is used to allow only one request to an endpoint per `urlSlug` reach the `next` handler. Any more
 * requests will be dropped and responded with status 409.
 *
 * CAUTION: This middleware must be used only after `auth` middleware.
 */
export default async (req: Request, res: Response, next: NextFunction) => {
  let actionType: "select" | "cell" | "reset" | "" = "";

  if (req.originalUrl.includes("select-player")) {
    actionType = "select";
  } else if (req.originalUrl.includes("click")) {
    actionType = "cell";
  } else if (req.originalUrl.includes("reset")) {
    actionType = "reset";
  }

  const lockId = `${req.credentials.urlSlug}_${actionType}`;
  console.debug(`blocking key for visitor ${req.visitor.id}: `, lockId);
  const r = await LockDO.write(req.visitor, true, { lockId, releaseLock: false });
  console.log(`r: `, JSON.stringify(r, null, 2));
  if (!r)
    return res.status(409).send({ message: "Currently processing a request." });
  return next();
}
