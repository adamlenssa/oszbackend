import { Router } from "express";
import { z } from "zod";
import { validateRequest, validateRequestBody } from "zod-express-middleware";
import { prisma } from "../app";
import {
  checkAuth,
  comparePasswords,
  createJWT,
  encryptedPassword,
} from "../../auth";
import "express-async-errors";
import { getTokenData } from "../../middleware";

const userRouter = Router();

userRouter.post(
  "/",
  validateRequestBody(
    z
      .object({
        username: z.string({
          errorMap: () => ({ message: "String required for username" }),
        }),
        password: z.string({
          errorMap: () => ({ message: "String required for password" }),
        }),
        firstName: z.string({
          errorMap: () => ({ message: "String required for First Name" }),
        }),
        lastName: z.string({
          errorMap: () => ({ message: "String required for Last Name" }),
        }),
        email: z
          .string({
            errorMap: () => ({ message: "String required for email" }),
          })
          .email("Email required"),
        role: z.string({ errorMap: () => ({ message: "" }) }),
      })
      .strict()
  ),
  async (req, res, next) => {
    const { body } = req;
    const newUser = await prisma.user
      .create({
        data: {
          username: body.username,
          passwordHash: await encryptedPassword(body.password),
          email: body.email,
          firstName: body.firstName,
          lastName: body.lastName,
          role: "admin",
        },
      })
      .catch((e) => next(e));
    if (!newUser) {
      return;
    }
    const token = createJWT(newUser);
    res.status(201).send({ token, newUser });
  }
);

userRouter.get("/", async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, firstName: true, lastName: true },
  });
  res.status(200).send(users);
});

userRouter.get(
  "/login",
  validateRequestBody(
    z.object({
      username: z.string(),
      password: z.string(),
    })
  ),
  checkAuth,
  async (req, res) => {
    const { body } = req;
    const { password, username } = body;
    const user = await prisma.user.findFirst({ where: { username } });
    if (!user) {
      return res.status(404).send({ message: "invalid username" });
    }
    const { passwordHash } = user;
    const result = await comparePasswords(password, passwordHash);
    if (!result) {
      return res.status(404).send({ message: "incorrect password" });
    }
    return res.status(200).json(user);
  }
);

userRouter.patch(
  "/",
  validateRequest({
    body: z.object({
      username: z.string().optional(),
      passwordHash: z.string().optional(),
      email: z.string().optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
    }),
  }),
  checkAuth,
  async (req, res, next) => {
    const { body } = req;
    let { passwordHash } = body;
    const tokenData = getTokenData(req);
    if (!tokenData) return next(new Error("unauthorized"));
    const { id } = tokenData;
    if (passwordHash) {
      const newPassword = await encryptedPassword(passwordHash);
      passwordHash = newPassword;
    }
    const result = await prisma.user
      .update({
        where: { id },
        data: body,
      })
      .catch((e) => next(e));
    if (!result) {
      return res.status(400).json({ message: "error occurred" });
    }
    return res.status(200).json(result);
  }
);

export { userRouter };
