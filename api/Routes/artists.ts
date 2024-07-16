import { Router } from "express";
import { prisma } from "../app";
import "express-async-errors";
import { checkAuth } from "../../auth";
import { validateRequestBody } from "zod-express-middleware";
import { z } from "zod";
import { getTokenData } from "../../middleware";

const artistRouter = Router();

artistRouter.get("/", async (_req, res) => {
  res.send(await prisma.artist.findMany());
});

artistRouter.post(
  "/",
  checkAuth,
  validateRequestBody(
    z.object({
      firstName: z.string(),
      lastName: z.string(),
      fullName: z.string(),
    })
  ),
  async (req, res, next) => {
    const { body: data } = req;
    const tokenData = getTokenData(req);
    if (!tokenData) return next(new Error("Unverified Token"));
    return await prisma.artist
      .create({ data })
      .then((artist) => res.status(201).json(artist))
      .catch((e) => next(e));
  }
);

export { artistRouter };
