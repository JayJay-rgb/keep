import "dotenv/config"
import express from "express"
import http from "http"
import { initSocket } from "./config/socket.mjs"
import mongoose from "mongoose"
import connect from "./config/db.mjs"
import corsOptions from "./config/cors.mjs"
import cors from "cors"
import authRouter from "./routes/auth.mjs"
import registerRouter from "./routes/register.mjs"
import groupRouter from "./routes/groups.mjs"
import albumRouter from "./routes/album.mjs"
import userRouter from "./routes/user.mjs"
import mediaRouter from "./routes/media.mjs"
import notificationRouter from "./routes/notification.mjs"
import googleRouter from "./routes/google.mjs"
import passport from "passport"
import cookieParser from "cookie-parser"

const app = express();
const server = http.createServer(app);
initSocket(server, corsOptions);
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

connect();

app.use("/v1",googleRouter);
app.use("/v1/auth", registerRouter);
app.use("/v1/auth", authRouter);
app.use("/v1/groups", groupRouter);
app.use("/v1/albums", albumRouter);
app.use("/v1/users", userRouter);
app.use("/v1/media", mediaRouter);
app.use("/v1/notifications", notificationRouter)

mongoose.connection.once("open", () => {
    server.listen(process.env.PORT, () => {
        console.log(`Server is running on http://localhost:${process.env.PORT}`);
    });
});