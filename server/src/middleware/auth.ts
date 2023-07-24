import { NextFunction, Request, Response } from "express";

const TOKEN_VALIDITY = 15 * 60 * 1000; // 15 minutes

export const noAuth = async (req: Request, res: Response, next: NextFunction) => await next();

export default async (req: Request, res: Response, next: NextFunction) => {
  console.log(`req.body`, req.body);

  // todo make it test interactive credentials

  let t = req.header("authorization");
  if (!t && req.query.token)
    t = req.query.token as string;
  if (!t)
    t = req.body.token;
  if (!t) {
    t = `${new Date(req.body.date).getTime()}`;
  }

  if (!t) {
    console.error("401 Token not supplied.");
    return res.status(401).send({ message: "Token is required. Please contact alok@clay.fish for more info." });
  }

  const time = Number(t);

  if (isNaN(time)) {
    console.error("401 Invalid token.");
    return res.status(401).send({ message: "Invalid token." });
  }

  const from = Date.now() - TOKEN_VALIDITY;
  const to = Date.now() + TOKEN_VALIDITY;

  if (from <= time && time <= to)
    return next();
  console.error("401 Token expired.");
  res.status(401).send({ message: "Token expired." });
}
