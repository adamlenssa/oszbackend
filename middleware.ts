import { NextFunction, Request, Response } from "express";
import { z, ZodError } from "zod";
import { comapreToken } from "./auth";

export const backendUrl = "https://oromosoundz.xyz/";
export const frontendUrl = "https://www.oromosoundz.com/";

export const LoginParse = z.object({
  username: z.string(),
  role: z.enum(["admin", "listner"]),
  id: z.number(),
  iat: z.number(),
  exp: z.number(),
});

export const errorHandleMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  if (err instanceof ZodError) {
    const errMessage = err.issues[0].message;
    console.log(errMessage);
    return res.status(400).send({ message: errMessage });
  }
  console.error(err.message);
  return res.status(500).send(err.message);
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

export const allowCrossDomain = function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
};
