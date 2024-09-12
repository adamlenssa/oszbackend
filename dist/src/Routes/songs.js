"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.songsRouter = void 0;
const express_1 = require("express");
const app_1 = require("../app");
const zod_express_middleware_1 = require("zod-express-middleware");
const zod_1 = require("zod");
const auth_1 = require("../../auth");
const middleware_1 = require("../../middleware");
const ytdl_core_1 = __importDefault(require("@distube/ytdl-core"));
const multer_1 = __importDefault(require("multer"));
const client_s3_1 = require("@aws-sdk/client-s3");
const dotenv_1 = __importDefault(require("dotenv"));
const crypto_1 = __importDefault(require("crypto"));
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const cookies = {
    name: "ssid",
    value: "AO8y9M3nBETxg_15f",
    domain: ".youtube.com",
    path: "/",
    hostOnly: false,
    secure: true,
};
dotenv_1.default.config();
const bucketName = process.env.Bucket_Name;
const bucketZone = process.env.Bucket_Zone;
const bucketAcessKey = process.env.Bucket_Acess_Key;
const bucketSecretAccessKey = process.env.Bucket_Secret_Access_Key;
const songsRouter = (0, express_1.Router)();
exports.songsRouter = songsRouter;
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage });
const agent = ytdl_core_1.default.createAgent([cookies]);
songsRouter.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const songs = yield app_1.prisma.song.findMany({
        include: { _count: true },
        orderBy: { id: "asc" },
    });
    const s3 = new client_s3_1.S3Client({
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
        const command = new client_s3_1.GetObjectCommand(getObjectParams);
        const url = yield (0, s3_request_presigner_1.getSignedUrl)(s3, command, { expiresIn: 60 * 10 });
        song.link = url;
    }
    res.status(200).send(songs);
}));
songsRouter.post("/image", (0, zod_express_middleware_1.validateRequestBody)(zod_1.z.object({ link: zod_1.z.string() })), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { link } = req.body;
    const { videoDetails: { thumbnails }, } = yield ytdl_core_1.default.getInfo(link, { agent });
    const image = thumbnails.find((thumbnail) => thumbnail.height == 1080);
    if (!image)
        return res.send({
            link: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Flag_of_the_Oromia_Region.svg/800px-Flag_of_the_Oromia_Region.svg.png",
        });
    return res.send({ link: image.url });
}));
songsRouter.post("/download", (0, zod_express_middleware_1.validateRequestBody)(zod_1.z.object({ link: zod_1.z.string() })), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { link } = req.body;
    const videoInfo = yield ytdl_core_1.default.getInfo(link);
    // const title = videoInfo.videoDetails.title;
    const endingPath = ytdl_core_1.default.chooseFormat(videoInfo.formats, { quality: "140" });
    // const stream = createWriteStream(
    //   `src/temp/${title}.${endingPath.container}`
    // );
    try {
        ytdl_core_1.default.downloadFromInfo(videoInfo, { format: endingPath, agent }).pipe(res);
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
    }
    catch (error) {
        res.sendStatus(400);
    }
}));
songsRouter.post("/", auth_1.checkAuth, (0, zod_express_middleware_1.validateRequestBody)(zod_1.z
    .object({
    songname: zod_1.z.string(),
    singer: zod_1.z.string(),
    link: zod_1.z.string(),
    type: zod_1.z.enum([
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
    .strict()), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { body } = req;
    const { singer, songname, link, type } = body;
    const verifiedToken = (0, middleware_1.getTokenData)(req);
    if (!verifiedToken) {
        throw new Error("unAuthorized");
    }
    const publicBoolean = verifiedToken.role == "admin" ? true : false;
    const newSong = yield app_1.prisma.song
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
}));
songsRouter.post("/l", auth_1.checkAuth, upload.single("song"), (0, zod_express_middleware_1.validateRequestBody)(zod_1.z.object({
    singer: zod_1.z.string(),
    songname: zod_1.z.string(),
    type: zod_1.z.enum([
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
    image: zod_1.z.string(),
})), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const verifiedToken = (0, middleware_1.getTokenData)(req);
    if (!verifiedToken)
        new Error("unauthorized");
    const { id: uploadedBy, role } = verifiedToken;
    const { singer, songname, type, image } = req.body;
    const s3 = new client_s3_1.S3Client({
        credentials: {
            accessKeyId: bucketAcessKey,
            secretAccessKey: bucketSecretAccessKey,
        },
        region: bucketZone,
    });
    try {
        const randomBytes = crypto_1.default.randomBytes(20).toString("hex");
        const params = {
            Bucket: bucketName,
            Key: randomBytes,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        };
        const command = new client_s3_1.PutObjectCommand(params);
        yield s3.send(command);
        const song = yield app_1.prisma.song.create({
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
    }
    catch (e) {
        next(e);
    }
}));
songsRouter.patch("/:id", auth_1.checkAuth, middleware_1.paramsIdCheck, (0, zod_express_middleware_1.validateRequestBody)(zod_1.z.object({
    songname: zod_1.z.string().optional(),
    singer: zod_1.z.string().optional(),
    link: zod_1.z.string().optional(),
    type: zod_1.z
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
    public: zod_1.z.boolean().optional(),
})), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { params: { id }, body, } = req;
    const numId = +id;
    const userInfo = (0, middleware_1.getTokenData)(req);
    if (!userInfo)
        return res.status(401).json({ message: "unverified token" });
    if (userInfo.role !== "admin")
        throw new Error("unauthorized");
    const updatedSong = yield app_1.prisma.song
        .update({
        where: { id: numId },
        data: Object.assign({}, body),
    })
        .catch((e) => next(e));
    if (!updatedSong)
        return;
    res.status(200).send(updatedSong);
}));
songsRouter.delete("/:id", middleware_1.paramsIdCheck, auth_1.checkAuth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { params: { id }, } = req;
    const numId = +id;
    const tokendata = (0, middleware_1.getTokenData)(req);
    const song = yield app_1.prisma.song
        .findUnique({ where: { id: numId } })
        .catch(() => next(new Error("Song doesn't exist")));
    if (!song)
        return res.sendStatus(500);
    const s3 = new client_s3_1.S3Client({
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
    const command = new client_s3_1.DeleteObjectCommand(params);
    yield s3.send(command);
    if (!tokendata)
        return next(new Error("unverified token"));
    if (tokendata.role !== "admin" || tokendata.id !== song.uploadedBy)
        return next(new Error("unauthorized"));
    const deletedSong = yield app_1.prisma.song
        .delete({ where: { id: numId } })
        .catch((e) => next(e));
    if (!deletedSong)
        return;
    return res.sendStatus(200);
}));
songsRouter.get("/trending", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const s3 = new client_s3_1.S3Client({
        credentials: {
            accessKeyId: bucketAcessKey,
            secretAccessKey: bucketSecretAccessKey,
        },
        region: bucketZone,
    });
    const trendingSongs = yield app_1.prisma.song.findMany({
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
        const command = new client_s3_1.GetObjectCommand(getObjectParams);
        const url = yield (0, s3_request_presigner_1.getSignedUrl)(s3, command, { expiresIn: 60 * 10 });
        song.link = url;
    }
    res.send(yield trendingSongs);
}));
//# sourceMappingURL=songs.js.map