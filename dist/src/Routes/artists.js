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
exports.artistRouter = void 0;
const express_1 = require("express");
const app_1 = require("../app");
require("express-async-errors");
const auth_1 = require("../../auth");
const zod_express_middleware_1 = require("zod-express-middleware");
const zod_1 = require("zod");
const middleware_1 = require("../../middleware");
const artistRouter = (0, express_1.Router)();
exports.artistRouter = artistRouter;
artistRouter.get("/", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send(yield app_1.prisma.artist.findMany());
}));
artistRouter.post("/", auth_1.checkAuth, (0, zod_express_middleware_1.validateRequestBody)(zod_1.z.object({
    firstName: zod_1.z.string(),
    lastName: zod_1.z.string(),
    fullName: zod_1.z.string(),
})), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { body: data } = req;
    const tokenData = (0, middleware_1.getTokenData)(req);
    if (!tokenData)
        return next(new Error("Unverified Token"));
    return yield app_1.prisma.artist
        .create({ data })
        .then((artist) => res.status(201).json(artist))
        .catch((e) => next(e));
}));
//# sourceMappingURL=artists.js.map