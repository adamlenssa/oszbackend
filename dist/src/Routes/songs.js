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
Object.defineProperty(exports, "__esModule", { value: true });
exports.songsRouter = void 0;
const express_1 = require("express");
const app_1 = require("../app");
const zod_express_middleware_1 = require("zod-express-middleware");
const zod_1 = require("zod");
const auth_1 = require("../../auth");
const middleware_1 = require("../../middleware");
const songsRouter = (0, express_1.Router)();
exports.songsRouter = songsRouter;
songsRouter.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const songs = yield app_1.prisma.song.findMany({
        include: { _count: true },
        orderBy: { id: "asc" },
    });
    res.status(200).send(songs);
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
    const trendingSongs = yield app_1.prisma.song.findMany({
        where: { public: true },
        take: 4,
        orderBy: { likes: { _count: "desc" } },
        include: { _count: { select: { likes: true } } },
    });
    console.log(trendingSongs);
    res.send(trendingSongs);
}));
//# sourceMappingURL=songs.js.map