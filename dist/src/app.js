"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.url = exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const middleware_1 = require("../middleware");
const client_1 = require("@prisma/client");
const songs_1 = require("./Routes/songs");
const users_1 = require("./Routes/users");
const comments_1 = require("./Routes/comments");
const artists_1 = require("./Routes/artists");
require("express-async-errors");
const likes_1 = require("./Routes/likes");
const cors_1 = __importDefault(require("cors"));
exports.prisma = new client_1.PrismaClient();
exports.url = "http://localhost:5173";
const port = +process.env.Port || 3002;
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.get("/", (_req, res) => {
    return res.send("Welcome to Oromo Soundz");
});
app.use("/songs", songs_1.songsRouter);
app.use("/users", users_1.userRouter);
app.use("/comments", comments_1.commentsRouter);
app.use("/artists", artists_1.artistRouter);
app.use("/likes", likes_1.likesRouter);
app.get;
app.use(middleware_1.errorHandleMiddleware);
app.listen(port, () => {
    console.log("Server is ready at port " + port);
});
exports.default = app;
//# sourceMappingURL=app.js.map