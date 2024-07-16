import { Router } from "express";
import { prisma } from "../app";
import { validateRequestBody } from "zod-express-middleware";
import { z } from "zod";
import { checkAuth } from "../../auth";
import { getTokenData, paramsIdCheck } from "../../middleware";

const likesRouter = Router();

likesRouter.get("/", async (_req, res) => {
  const likes = await prisma.like.findMany();
  res.status(200).send(likes);
});

likesRouter.post(
  "/",
  validateRequestBody(z.object({ songId: z.number() })),
  checkAuth,
  async (req, res, next) => {
    const { body } = req;
    const tokendata = getTokenData(req);
    if (!tokendata) return next(new Error("Unverified Token"));
    await prisma.like
      .create({ data: { ...body, userId: tokendata.id } })
      .then((like) => res.status(201).send(like))
      .catch((e) => next(e));
  }
);

likesRouter.delete("/:id", checkAuth, paramsIdCheck, async (req, res, next) => {
  const {
    params: { id },
  } = req;
  const numId = +id;
  const tokenData = getTokenData(req);
  if (isNaN(numId)) return next(new Error("Invalid Id"));
  if (!tokenData) return new Error("Unauthorized");
  return await prisma.like
    .delete({
      where: { id: numId, userId: tokenData.id },
    })
    .then((like) => res.status(200).send(like))
    .catch((e) => next(e));
});

export { likesRouter };
