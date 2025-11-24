import { Server } from "socket.io";
import http_server from "../http/index.js";
import config from "../../config.js";

const socketio_server = new Server(http_server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

console.log("🟢 - Socket.IO server listening on port", config.http.port);

export default socketio_server;
