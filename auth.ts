import { user } from "@prisma/client";
import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import * as nodemailer from "nodemailer";
import { prisma } from "./src/app";
import { backendUrl } from "./middleware";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "oromosoundz@gmail.com",
    pass: "tdky mndf aded szeb",
  },
});
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

export const loginAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { headers, body } = req;
  const { authorization } = headers;
  const bodyparser = z.object({
    username: z.string(),
    passwordHash: z.string(),
  });
  const parsedBody = bodyparser.parse(body);
  const email = await prisma.user.findUnique({
    where: { username: parsedBody.username },
  });
  if (!email) return res.status(400).send({ message: "incorrect username" });
  console.log(comparePasswords(parsedBody.passwordHash, email.passwordHash));

  if (!(await comparePasswords(parsedBody.passwordHash, email.passwordHash)))
    return res.status(400).send({ message: "incorrect password" });
  if (!authorization) {
    const token = jwt.sign(
      { username: body.username, role: email.role, id: email.id },
      process.env.SecretKey!,
      {
        expiresIn: "10m",
      }
    );
    const emailResults = transporter.sendMail(
      {
        from: `"OromoSoundz" <${process.env.email}>`, // sender address
        to: email.email, // list of receivers
        subject: "Login Conformation", // Subject line
        text: `Click on this link to confirm you are logging in. ${backendUrl}users/login-noauth/${token}`, // plain text body
        html: `Click on this link to confirm you are logging in.<br> ${backendUrl}users/login-noauth/${token}`, // html body
      },
      (err, info) => {
        if (err) {
          console.log({ err });
          return res.status(400).send({ message: "Error occured" });
        } else {
          console.log(info);
          return res.status(400).send({ message: "Email verification sent" });
        }
      }
    );
    return emailResults;
  }
  next();
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
    return res.status(404).send({ message: "invalid token" });
  }
  next();
};

export const checkVerificationToken = (token: string) => {
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.SecretKey!);
  } catch (e) {
    console.log(e);
    return null;
  }
};
