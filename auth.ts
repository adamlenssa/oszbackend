import { user } from "@prisma/client";
import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";

export const encryptedPassword = async (password: string) => {
  return await bcrypt.hash(password, 11);
};
export const createJWT = (user: user) => {
  const { username, role, id } = user;
  const userInfo = { id, username, role };
  const token = jwt.sign(userInfo, process.env.SecretKey!);
  return token;
};
const tokenSchema = z.object({
  username: z.string(),
  role: z.enum(["admin", "listner"]),
  id: z.number(),
  iat: z.number(),
});
export const comapreToken = (token: string) => {
  if (!token) {
    return null;
  }
  try {
    return tokenSchema.parse(jwt.verify(token, process.env.SecretKey!));
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const comparePasswords = async (
  password: string,
  encryptedPassword: string
) => {
  const result = await bcrypt.compare(password, encryptedPassword);
  return result;
};

export const checkAuth = (req: Request, res: Response, next: NextFunction) => {
  const { headers } = req;
  const { authorization } = headers;
  if (!authorization) {
    return res.status(401).json({ message: "unauthorized" });
  }
  const [, token] = authorization.split(" ");
  const data = comapreToken(token);
  if (typeof data !== "object" || !data) {
    throw new Error("invalid token");
  }
  next();
  return data;
};
