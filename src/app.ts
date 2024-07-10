import express from "express";
import { errorHandleMiddleware } from "../middleware";
import { PrismaClient } from "@prisma/client";
import { songsRouter } from "./Routes/songs";
import { userRouter } from "./Routes/users";
import { commentsRouter } from "./Routes/comments";
import { artistRouter } from "./Routes/artists";
import "express-async-errors";

export const prisma = new PrismaClient();
const app = express();
app.use(express.json());

app.use("/songs", songsRouter);
app.use("/users", userRouter);
app.use("/comments", commentsRouter);
app.use("/artists", artistRouter);
app.use(errorHandleMiddleware);

app.listen(3002, () => {
  console.log("Server is ready");
});