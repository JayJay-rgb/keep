import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;

export const initSocket = (server, corsOptions) => {
    io = new Server(server, {
        cors: corsOptions,
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error("Authentication required"));
        }
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) return next(new Error("Invalid token"));
            socket.userId = decoded.id;
            next();
        });
    });

    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.userId}`);
        socket.join(socket.userId);

        socket.on("join-group", (groupId) => {
            socket.join(groupId);
        });

        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.userId}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) throw new Error("Socket.io not initialized");
    return io;
};