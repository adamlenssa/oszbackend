"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.checkVerificationToken = exports.checkAuth = exports.loginAuth = exports.comparePasswords = exports.comapreToken = exports.createJWT = exports.encryptedPassword = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const nodemailer = __importStar(require("nodemailer"));
const app_1 = require("./src/app");
const middleware_1 = require("./middleware");
const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "oromosoundz@gmail.com",
        pass: "tdky mndf aded szeb",
    },
});
const encryptedPassword = (password) => __awaiter(void 0, void 0, void 0, function* () {
    return yield bcrypt_1.default.hash(password, 11);
});
exports.encryptedPassword = encryptedPassword;
const createJWT = (user) => {
    const { username, role, id } = user;
    const userInfo = { id, username, role };
    const token = jsonwebtoken_1.default.sign(userInfo, process.env.SecretKey);
    return token;
};
exports.createJWT = createJWT;
const tokenSchema = zod_1.z.object({
    username: zod_1.z.string(),
    role: zod_1.z.enum(["admin", "listner"]),
    id: zod_1.z.number(),
    iat: zod_1.z.number(),
});
const comapreToken = (token) => {
    if (!token) {
        return null;
    }
    try {
        return tokenSchema.parse(jsonwebtoken_1.default.verify(token, process.env.SecretKey));
    }
    catch (e) {
        console.error(e);
        return null;
    }
};
exports.comapreToken = comapreToken;
const comparePasswords = (password, encryptedPassword) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield bcrypt_1.default.compare(password, encryptedPassword);
    return result;
});
exports.comparePasswords = comparePasswords;
const loginAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { headers, body } = req;
    const { authorization } = headers;
    const bodyparser = zod_1.z.object({
        username: zod_1.z.string(),
        passwordHash: zod_1.z.string(),
    });
    const parsedBody = bodyparser.parse(body);
    const email = yield app_1.prisma.user.findUnique({
        where: { username: parsedBody.username },
    });
    if (!email)
        return res.status(400).send({ message: "incorrect username" });
    console.log((0, exports.comparePasswords)(parsedBody.passwordHash, email.passwordHash));
    if (!(yield (0, exports.comparePasswords)(parsedBody.passwordHash, email.passwordHash)))
        return res.status(400).send({ message: "incorrect password" });
    if (!authorization) {
        const token = jsonwebtoken_1.default.sign({ username: body.username, role: email.role, id: email.id }, process.env.SecretKey, {
            expiresIn: "10m",
        });
        const emailResults = transporter.sendMail({
            from: `"OromoSoundz" <${process.env.email}>`, // sender address
            to: email.email, // list of receivers
            subject: "Login Conformation", // Subject line
            text: `Click on this link to confirm you are logging in. ${middleware_1.backendUrl}users/login-noauth/${token}`, // plain text body
            html: `Click on this link to confirm you are logging in.<br> ${middleware_1.backendUrl}users/login-noauth/${token}`, // html body
        }, (err, info) => {
            if (err) {
                console.log({ err });
                return res.status(400).send({ message: "Error occured" });
            }
            else {
                console.log(info);
                return res.status(400).send({ message: "Email verification sent" });
            }
        });
        return emailResults;
    }
    next();
});
exports.loginAuth = loginAuth;
const checkAuth = (req, res, next) => {
    const { headers } = req;
    const { authorization } = headers;
    if (!authorization) {
        return res.status(401).json({ message: "unauthorized" });
    }
    const [, token] = authorization.split(" ");
    const data = (0, exports.comapreToken)(token);
    if (typeof data !== "object" || !data) {
        return res.status(404).send({ message: "invalid token" });
    }
    next();
};
exports.checkAuth = checkAuth;
const checkVerificationToken = (token) => {
    if (!token)
        return null;
    try {
        return jsonwebtoken_1.default.verify(token, process.env.SecretKey);
    }
    catch (e) {
        console.log(e);
        return null;
    }
};
exports.checkVerificationToken = checkVerificationToken;
//# sourceMappingURL=auth.js.map