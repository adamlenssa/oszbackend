import { Router } from "express";
import { prisma } from "../app";
import { validateRequestBody } from "zod-express-middleware";
import { z } from "zod";
import { checkAuth } from "../../auth";
import { getTokenData, paramsIdCheck } from "../../middleware";

const songsRouter = Router();

songsRouter.get("/", async (req, res) => {
  const songs = await prisma.song.findMany();
  res.status(200).send(songs);
});

songsRouter.post(
  "/",
  checkAuth,
  validateRequestBody(
    z
      .object({
        songname: z.string(),
        singer: z.string(),
        link: z.string(),
        type: z.enum([
          "Shewa",
          "Wallaga",
          "Arsi",
          "Bale",
          "Jimma",
          "Wallo",
          "Hararghe",
          "Borana",
          "Guji",
          "Illubabor",
          "Karayuu",
          "Modern",
          "Oldies",
        ]),
      })
      .strict()
  ),
  async (req, res, next) => {
    const { body } = req;
    const { singer, songname, link, type } = body;
    const verifiedToken = getTokenData(req);
    if (!verifiedToken) {
      throw new Error("unAuthorized");
    }
    const publicBoolean = verifiedToken.role == "admin" ? true : false;
    const newSong = await prisma.song
      .create({
        data: {
          songname,
          singer,
          link,
          uploadedBy: verifiedToken.id,
          public: publicBoolean,
          type,
        },
      })
      .catch((e) => {
        if (e.code == "P2002") {
          return next(new Error("Song already exists"));
        }
        return next(e);
      });
    if (!newSong) {
      return;
    }
    res.status(201).json(newSong);
  }
);

songsRouter.patch(
  "/:id",
  checkAuth,
  paramsIdCheck,
  validateRequestBody(
    z.object({
      songname: z.string().optional(),
      singer: z.string().optional(),
      link: z.string().optional(),
      type: z
        .enum([
          "Shewa",
          "Wallaga",
          "Arsi",
          "Bale",
          "Jimma",
          "Wallo",
          "Hararghe",
          "Borana",
          "Guji",
          "Illubabor",
          "Karayuu",
          "Modern",
          "Oldies",
        ])
        .optional(),
      public: z.boolean().optional(),
    })
  ),
  async (req, res, next) => {
    const {
      params: { id },
      body,
    } = req;
    const numId = +id;
    const userInfo = getTokenData(req);
    if (!userInfo) return res.status(401).json({ message: "unverified token" });
    if (userInfo.role !== "admin") throw new Error("unauthorized");
    const updatedSong = await prisma.song
      .update({
        where: { id: numId },
        data: { ...body },
      })
      .catch((e) => next(e));
    if (!updatedSong) return;
    res.status(200).send(updatedSong);
  }
);

songsRouter.delete("/:id", paramsIdCheck, checkAuth, async (req, res, next) => {
  const {
    params: { id },
  } = req;
  const numId = +id;
  const tokendata = getTokenData(req);
  const song = await prisma.song
    .findUnique({ where: { id: numId } })
    .catch(() => next(new Error("Song doesn't exist")));
  if (!song) return res.sendStatus(500);
  if (!tokendata) return next(new Error("unverified token"));
  if (tokendata.role !== "admin" || tokendata.id !== song.uploadedBy)
    return next(new Error("unauthorized"));
  const deletedSong = await prisma.song
    .delete({ where: { id: numId } })
    .catch((e) => next(e));
  if (!deletedSong) return;
  return res.sendStatus(200);
});

export { songsRouter };
