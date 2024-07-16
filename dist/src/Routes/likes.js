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
exports.likesRouter = void 0;
const express_1 = require("express");
const app_1 = require("../app");
const zod_express_middleware_1 = require("zod-express-middleware");
const zod_1 = require("zod");
const auth_1 = require("../../auth");
const middleware_1 = require("../../middleware");
const likesRouter = (0, express_1.Router)();
exports.likesRouter = likesRouter;
likesRouter.get("/", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const likes = yield app_1.prisma.like.findMany();
    res.status(200).send(likes);
}));
likesRouter.post("/", (0, zod_express_middleware_1.validateRequestBody)(zod_1.z.object({ songId: zod_1.z.number() })), auth_1.checkAuth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { body } = req;
    const tokendata = (0, middleware_1.getTokenData)(req);
    if (!tokendata)
        return next(new Error("Unverified Token"));
    yield app_1.prisma.like
        .create({ data: Object.assign(Object.assign({}, body), { userId: tokendata.id }) })
        .then((like) => res.status(201).send(like))
        .catch((e) => next(e));
}));
likesRouter.delete("/:id", auth_1.checkAuth, middleware_1.paramsIdCheck, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { params: { id }, } = req;
    const numId = +id;
    const tokenData = (0, middleware_1.getTokenData)(req);
    if (isNaN(numId))
        return next(new Error("Invalid Id"));
    if (!tokenData)
        return new Error("Unauthorized");
    return yield app_1.prisma.like
        .delete({
        where: { id: numId, userId: tokenData.id },
    })
        .then((like) => res.status(200).send(like))
        .catch((e) => next(e));
}));
//# sourceMappingURL=likes.js.map