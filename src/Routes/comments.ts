import { Router } from "express";
import { prisma } from "../app";
import "express-async-errors";
import { validateRequestBody } from "zod-express-middleware";
import { z } from "zod";
import { checkAuth } from "../../auth";
import { getTokenData, paramsIdCheck } from "../../middleware";

const commentsRouter = Router();

commentsRouter.get("/", async (req, res) => {
  res.send(await prisma.comment.findMany({ orderBy: { time: "desc" } }));
});

commentsRouter.post(
  "/",
  checkAuth,
  validateRequestBody(z.object({ songId: z.number(), comment: z.string() })),
  async (req, res, next) => {
    const { body } = req;
    const verifiedToken = getTokenData(req);
    if (!verifiedToken) throw new Error("Unathorized");
    const newComment = await prisma.comment
      .create({ data: { ...body, userId: verifiedToken.id } })
      .catch(next);
    if (!newComment) throw new Error("Server Error");
    res.status(201).json(newComment);
  }
);

commentsRouter.patch(
  "/:id",
  checkAuth,
  paramsIdCheck,
  validateRequestBody(z.object({ comment: z.string() })),
  async (req, res, next) => {
    const {
      params: { id },
      body,
    } = req;
    const tokenData = getTokenData(req);
    const numId = +id;
    const comment = await prisma.comment.findUniqueOrThrow({
      where: { id: numId },
    });

    if (!tokenData) return next(new Error("Unverified token"));
    if (tokenData.id !== comment?.userId)
      return next(new Error("Unauthorized"));
    await prisma.comment
      .update({
        where: { id: numId },
        data: { ...body },
      })
      .then((comment) => res.send(comment))
      .catch((e) => next(e));
  }
);

commentsRouter.delete(
  "/:id",
  checkAuth,
  paramsIdCheck,
  async (req, res, next) => {
    const {
      params: { id },
    } = req;
    const tokenData = getTokenData(req);
    const numId = +id;
    const comment = await prisma.comment.findUniqueOrThrow({
      where: { id: numId },
    });
    if (!tokenData) return next(new Error("Unverified token"));
    if (tokenData.id !== comment?.userId)
      return next(new Error("Unauthorized"));
    return await prisma.comment
      .delete({ where: { id: numId } })
      .then(() => res.sendStatus(200))
      .catch((e) => next(e));
  }
);

export { commentsRouter };
