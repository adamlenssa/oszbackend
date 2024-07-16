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
exports.userRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const zod_express_middleware_1 = require("zod-express-middleware");
const app_1 = require("../app");
const auth_1 = require("../../auth");
require("express-async-errors");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const middleware_1 = require("../../middleware");
const userRouter = (0, express_1.Router)();
exports.userRouter = userRouter;
userRouter.post("/", (0, zod_express_middleware_1.validateRequestBody)(zod_1.z
    .object({
    username: zod_1.z.string({
        errorMap: () => ({ message: "String required for username" }),
    }),
    password: zod_1.z.string({
        errorMap: () => ({ message: "String required for password" }),
    }),
    firstName: zod_1.z.string({
        errorMap: () => ({ message: "String required for First Name" }),
    }),
    lastName: zod_1.z.string({
        errorMap: () => ({ message: "String required for Last Name" }),
    }),
    email: zod_1.z
        .string({
        errorMap: () => ({ message: "String required for email" }),
    })
        .email("Email required"),
})
    .strict()), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { body } = req;
    const newUser = yield app_1.prisma.user
        .create({
        data: {
            username: body.username,
            passwordHash: yield (0, auth_1.encryptedPassword)(body.password),
            email: body.email,
            firstName: body.firstName,
            lastName: body.lastName,
        },
    })
        .catch((e) => next(e));
    if (!newUser) {
        return;
    }
    const token = (0, auth_1.createJWT)(newUser);
    res.status(201).send({ token, newUser });
}));
userRouter.get("/", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield app_1.prisma.user.findMany({
        select: { id: true, username: true, firstName: true, lastName: true },
    });
    res.status(200).send(users);
}));
userRouter.get("/login", (0, zod_express_middleware_1.validateRequestBody)(zod_1.z.object({
    username: zod_1.z.string(),
    passwordHash: zod_1.z.string(),
})), auth_1.loginAuth, auth_1.checkAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { body } = req;
    const { passwordHash, username } = body;
    const user = yield app_1.prisma.user.findFirst({ where: { username } });
    if (!user) {
        return res.status(404).send({ message: "invalid username" });
    }
    const { passwordHash: actualPassword } = user;
    const result = yield (0, auth_1.comparePasswords)(passwordHash, actualPassword);
    if (!result) {
        return res.status(404).send({ message: "incorrect password" });
    }
    return res.status(200).json(user);
}));
userRouter.patch("/", (0, zod_express_middleware_1.validateRequest)({
    body: zod_1.z.object({
        username: zod_1.z.string().optional(),
        passwordHash: zod_1.z.string().optional(),
        email: zod_1.z.string().optional(),
        firstName: zod_1.z.string().optional(),
        lastName: zod_1.z.string().optional(),
    }),
}), auth_1.checkAuth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { body } = req;
    let { passwordHash } = body;
    const tokenData = (0, middleware_1.getTokenData)(req);
    if (!tokenData)
        return next(new Error("unauthorized"));
    const { id } = tokenData;
    if (passwordHash) {
        const newPassword = yield (0, auth_1.encryptedPassword)(passwordHash);
        passwordHash = newPassword;
    }
    const result = yield app_1.prisma.user
        .update({
        where: { id },
        data: body,
    })
        .catch((e) => next(e));
    if (!result) {
        return res.status(400).json({ message: "error occurred" });
    }
    return res.status(200).json(result);
}));
userRouter.get("/login-noauth/:token", (0, zod_express_middleware_1.validateRequestParams)(zod_1.z.object({ token: zod_1.z.string() })), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { params: { token }, } = req;
    try {
        jsonwebtoken_1.default.verify(token, process.env.SecretKey, (err, decoded) => {
            if ((err === null || err === void 0 ? void 0 : err.name) == "TokenExpiredError") {
                return res
                    .status(400)
                    .send("Token has expired, please sign in again");
            }
            if (err)
                return res.status(400).send(err.message);
            const info = middleware_1.LoginParse.parse(decoded);
            const { username, id, role } = info;
            const newToken = jsonwebtoken_1.default.sign({ username, id, role }, process.env.SecretKey);
            return res.redirect(`${middleware_1.frontendUrl}verify/${newToken}`);
        });
    }
    catch (e) {
        console.log(e);
    }
}));
//# sourceMappingURL=users.js.map