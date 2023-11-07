import { NextFunction, Request, Response } from "express";
import { RequestQueue } from "../models";

const queue: RequestQueue = new RequestQueue();

/**
 * This middleware is used to allow only one request to an endpoint per `urlSlug` reach the `next` handler. Any more
 * requests will be dropped and responded with status 409.
 *
 * CAUTION: This middleware must be used only after `auth` middleware.
 */
export default (req: Request, res: Response, next: NextFunction) => queue.enqueue(req, res, next)
