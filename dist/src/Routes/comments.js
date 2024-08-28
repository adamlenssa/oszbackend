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
exports.commentsRouter = void 0;
const express_1 = require("express");
const app_1 = require("../app");
require("express-async-errors");
const zod_express_middleware_1 = require("zod-express-middleware");
const zod_1 = require("zod");
const auth_1 = require("../../auth");
const middleware_1 = require("../../middleware");
const commentsRouter = (0, express_1.Router)();
exports.commentsRouter = commentsRouter;
commentsRouter.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send(yield app_1.prisma.comment.findMany({ orderBy: { time: "desc" } }));
}));
commentsRouter.post("/", auth_1.checkAuth, (0, zod_express_middleware_1.validateRequestBody)(zod_1.z.object({ songId: zod_1.z.number(), comment: zod_1.z.string() })), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { body } = req;
    const verifiedToken = (0, middleware_1.getTokenData)(req);
    if (!verifiedToken)
        throw new Error("Unathorized");
    const newComment = yield app_1.prisma.comment
        .create({ data: Object.assign(Object.assign({}, body), { userId: verifiedToken.id }) })
        .catch(next);
    if (!newComment)
        throw new Error("Server Error");
    res.status(201).json(newComment);
}));
commentsRouter.patch("/:id", auth_1.checkAuth, middleware_1.paramsIdCheck, (0, zod_express_middleware_1.validateRequestBody)(zod_1.z.object({ comment: zod_1.z.string() })), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { params: { id }, body, } = req;
    const tokenData = (0, middleware_1.getTokenData)(req);
    const numId = +id;
    const comment = yield app_1.prisma.comment.findUniqueOrThrow({
        where: { id: numId },
    });
    if (!tokenData)
        return next(new Error("Unverified token"));
    if (tokenData.id !== (comment === null || comment === void 0 ? void 0 : comment.userId))
        return next(new Error("Unauthorized"));
    yield app_1.prisma.comment
        .update({
        where: { id: numId },
        data: Object.assign({}, body),
    })
        .then((comment) => res.send(comment))
        .catch((e) => next(e));
}));
commentsRouter.delete("/:id", auth_1.checkAuth, middleware_1.paramsIdCheck, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { params: { id }, } = req;
    const tokenData = (0, middleware_1.getTokenData)(req);
    const numId = +id;
    const comment = yield app_1.prisma.comment.findUniqueOrThrow({
        where: { id: numId },
    });
    if (!tokenData)
        return next(new Error("Unverified token"));
    if (tokenData.id !== (comment === null || comment === void 0 ? void 0 : comment.userId))
        return next(new Error("Unauthorized"));
    return yield app_1.prisma.comment
        .delete({ where: { id: numId } })
        .then(() => res.sendStatus(200))
        .catch((e) => next(e));
}));
//# sourceMappingURL=comments.js.map