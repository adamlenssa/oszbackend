import express from "express";
import { allowCrossDomain, errorHandleMiddleware } from "../middleware";
import { PrismaClient } from "@prisma/client";
import { songsRouter } from "./Routes/songs";
import { userRouter } from "./Routes/users";
import { commentsRouter } from "./Routes/comments";
import { artistRouter } from "./Routes/artists";
import "express-async-errors";
import { likesRouter } from "./Routes/likes";
import cors from "cors";

export const prisma = new PrismaClient();
export const url = "http://localhost:5173";
const port = +process.env.Port! || 3002;
const app = express();
app.use(express.json());
app.use(cors());
app.use(allowCrossDomain);
app.use(express.urlencoded({ extended: true }));
app.get("/", (_req, res) => {
  return res.send("Welcome to Oromo Soundz");
});
app.use("/songs", songsRouter);
app.use("/users", userRouter);
app.use("/comments", commentsRouter);
app.use("/artists", artistRouter);
app.use("/likes", likesRouter);
app.use(errorHandleMiddleware);

app.listen(port, () => {
  console.log("Server is ready at port " + port);
});

export default app;
