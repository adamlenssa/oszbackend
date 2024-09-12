import { Router } from "express";
import { prisma } from "../app";
import { validateRequestBody } from "zod-express-middleware";
import { z } from "zod";
import { checkAuth } from "../../auth";
import { getTokenData, paramsIdCheck } from "../../middleware";
import { createWriteStream, unlinkSync } from "fs";
import ytdl from "@distube/ytdl-core";
import { Cookie } from "@distube/ytdl-core";
import multer from "multer";
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import crypto from "crypto";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
const cookies: Cookie = {
  name: "ssid",
  value: "AO8y9M3nBETxg_15f",
  domain: ".youtube.com",
  path: "/",
  hostOnly: false,
  secure: true,
};

dotenv.config();

const bucketName = process.env.Bucket_Name;
const bucketZone = process.env.Bucket_Zone;
const bucketAcessKey = process.env.Bucket_Acess_Key;
const bucketSecretAccessKey = process.env.Bucket_Secret_Access_Key;

const songsRouter = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });
const agent = ytdl.createAgent([cookies]);

songsRouter.get("/", async (req, res) => {
  const songs = await prisma.song.findMany({
    include: { _count: true },
    orderBy: { id: "asc" },
  });
  const s3 = new S3Client({
    credentials: {
      accessKeyId: bucketAcessKey,
      secretAccessKey: bucketSecretAccessKey,
    },
    region: bucketZone,
  });
  for (const song of songs) {
    const getObjectParams = {
      Bucket: bucketName,
      Key: song.link,
    };
    const command = new GetObjectCommand(getObjectParams);
    const url = await getSignedUrl(s3, command, { expiresIn: 60 * 10 });
    song.link = url;
  }
  res.status(200).send(songs);
});

songsRouter.post(
  "/image",
  validateRequestBody(z.object({ link: z.string() })),
  async (req, res) => {
    const { link } = req.body;
    const {
      videoDetails: { thumbnails },
    } = await ytdl.getInfo(link, { agent });
    const image = thumbnails.find((thumbnail) => thumbnail.height == 1080);
    if (!image)
      return res.send({
        link: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Flag_of_the_Oromia_Region.svg/800px-Flag_of_the_Oromia_Region.svg.png",
      });
    return res.send({ link: image.url });
  }
);

songsRouter.post(
  "/download",
  validateRequestBody(z.object({ link: z.string() })),
  async (req, res) => {
    const { link } = req.body;

    const videoInfo = await ytdl.getInfo(link);
    // const title = videoInfo.videoDetails.title;
    const endingPath = ytdl.chooseFormat(videoInfo.formats, { quality: "140" });
    // const stream = createWriteStream(
    //   `src/temp/${title}.${endingPath.container}`
    // );
    try {
      ytdl.downloadFromInfo(videoInfo, { format: endingPath, agent }).pipe(res);
      // stream
      //   .on("error", (err) => {
      //     res.status(404).send(err);
      //     console.log(err);
      //   })
      //   .on("finish", () => {
      //     res.download(`src/temp/${title}.${endingPath.container}`, () => {
      //       unlinkSync(`src/temp/${title}.${endingPath.container}`);
      //     });
      //     console.log("done");
      //   });
    } catch (error) {
      res.sendStatus(400);
    }
  }
);

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

songsRouter.post(
  "/l",
  checkAuth,
  upload.single("song"),
  validateRequestBody(
    z.object({
      singer: z.string(),
      songname: z.string(),
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
      image: z.string(),
    })
  ),
  async (req, res, next) => {
    const verifiedToken = getTokenData(req);
    if (!verifiedToken) new Error("unauthorized");
    const { id: uploadedBy, role } = verifiedToken;
    const { singer, songname, type, image } = req.body;
    const s3 = new S3Client({
      credentials: {
        accessKeyId: bucketAcessKey,
        secretAccessKey: bucketSecretAccessKey,
      },
      region: bucketZone,
    });
    try {
      const randomBytes = crypto.randomBytes(20).toString("hex");
      const params: PutObjectCommandInput = {
        Bucket: bucketName,
        Key: randomBytes,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };
      const command = new PutObjectCommand(params);
      await s3.send(command);
      const song = await prisma.song.create({
        data: {
          singer,
          songname,
          type,
          uploadedBy,
          link: randomBytes,
          public: role === "admin" ? true : false,
          image,
        },
      });
      res.header("Access-Control-Allow-Origin", "*");
      return res.status(201).send(song);
    } catch (e) {
      next(e);
    }
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
  const s3 = new S3Client({
    credentials: {
      accessKeyId: bucketAcessKey,
      secretAccessKey: bucketSecretAccessKey,
    },
    region: bucketZone,
  });
  const params = {
    Bucket: bucketName,
    Key: song.link,
  };
  const command = new DeleteObjectCommand(params);
  await s3.send(command);

  if (!tokendata) return next(new Error("unverified token"));
  if (tokendata.role !== "admin" || tokendata.id !== song.uploadedBy)
    return next(new Error("unauthorized"));
  const deletedSong = await prisma.song
    .delete({ where: { id: numId } })
    .catch((e) => next(e));
  if (!deletedSong) return;
  return res.sendStatus(200);
});

songsRouter.get("/trending", async (req, res) => {
  const s3 = new S3Client({
    credentials: {
      accessKeyId: bucketAcessKey,
      secretAccessKey: bucketSecretAccessKey,
    },
    region: bucketZone,
  });
  const trendingSongs = await prisma.song.findMany({
    where: { public: true },
    take: 4,
    orderBy: { likes: { _count: "desc" } },
    include: { _count: { select: { likes: true } } },
  });

  for (const song of trendingSongs) {
    const getObjectParams = {
      Bucket: bucketName,
      Key: song.link,
    };
    const command = new GetObjectCommand(getObjectParams);
    const url = await getSignedUrl(s3, command, { expiresIn: 60 * 10 });
    song.link = url;
  }
  res.send(await trendingSongs);
});

export { songsRouter };
