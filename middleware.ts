import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { comapreToken } from "./auth";

export const errorHandleMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  if (err instanceof ZodError) {
    console.error(err.message);
    return res.status(400).send(err);
  }
  console.error(err.message);
  return res.status(500).send(err);
};

export const getTokenData = (req: Request) => {
  const { headers } = req;
  const { authorization } = headers;
  if (!authorization) throw new Error("Unauthorized");
  const [, token] = authorization.split(" ");
  const verifiedToken = comapreToken(token);
  return verifiedToken;
};

export const paramsIdCheck = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const {
    params: { id },
  } = req;
  if (!id) throw new Error("No id present");
  const numId = +id;
  if (isNaN(numId)) throw new Error("Not a valid ID");
  next();
};
