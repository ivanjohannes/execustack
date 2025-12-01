import express from "express";
import { createServer } from "http";
import { attachClientSettings } from "./middleware.js";
import { execution_controller, ping_controller } from "./controllers.js";

const app = express();

// MIDDLEWARE
app.use(express.json());
app.use(attachClientSettings);
// END MIDDLEWARE

// ROUTES
app.get("/ping", ping_controller);
app.post("/", execution_controller);
app.get("/", execution_controller);
// END ROUTES

// HTTP Server
const http_server = createServer(app);

export default http_server;
