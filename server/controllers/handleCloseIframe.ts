import { Request, Response } from "express";
import { errorHandler, getCredentials, Visitor } from "../utils/index.js";
import { VisitorInterface } from "@rtsdk/topia";

/**
 * Close the visitor's iframe. Used by the "Stay Here" cta on the ?reset=true
 * flow when the visitor declines the reset.
 */
export const handleCloseIframe = async (req: Request, res: Response) => {
  try {
    const source =
      req.body && req.body.interactiveNonce ? req.body : req.query && req.query.interactiveNonce ? req.query : req.body;
    const credentials = getCredentials(source);
    const { assetId, urlSlug, visitorId } = credentials;

    const visitor: VisitorInterface = await Visitor.create(visitorId, urlSlug, { credentials });
    await visitor.closeIframe(assetId);
    return res.json({ success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleCloseIframe",
      message: "Error closing iframe",
      req,
      res,
    });
  }
};
