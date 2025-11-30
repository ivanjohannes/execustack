import config from "../../config.js";
import socketio_server from "../../interfaces/socketio/index.js";
import { createJWT, verifyJWT } from "../utils/index.js";

/**
 * @description Makes sure a namespace is prepared for WebSocket connections.
 * @param {import("../../types/index.js").TaskDefinition} task_definition
 * @param {import("../../types/index.js").TaskMetrics} task_metrics
 * @param {import("../../types/index.js").TaskResults} task_results
 * @param {import("../../types/index.js").ExecutionContext} execution_context
 * @returns {Promise<object>} - Updates task_results with websocket connection info.
 */
export default async function (task_definition, task_metrics, task_results, execution_context) {
  const { namespace = "" } = task_definition?.params ?? {};

  const client_id = execution_context.client_settings.client_id;

  const formatted_namespace = (namespace ?? "").trim().toLowerCase().replace(/\s+/g, "_");
  const client_namespace = `/${client_id}/` + formatted_namespace;

  // check if namespace exists already
  const namespace_exists = socketio_server._nsps.has(client_namespace);

  if (!namespace_exists) {
    // create namespace
    const nsp = socketio_server.of(client_namespace);

    nsp.on("connection", (socket) => {
      socket.on("join_rooms", async (msg) => {
        const token = msg.token;
        const rooms = msg?.rooms || [];

        const verified_token = await verifyJWT(token, client_id);

        const token_namespace = verified_token?.payload?.namespace ?? "";

        if (!verified_token || token_namespace !== formatted_namespace) {
          socket.emit("auth_error", "Authentication error");
          return;
        }

        let rooms_to_join = [];
        const allowed_rooms = verified_token.payload?.rooms || [];

        for (const room of rooms) {
          if (allowed_rooms.includes(room)) {
            rooms_to_join.push(room);
          } else {
            socket.emit("join_room_error", `Not allowed to join room: ${room}`);
            rooms_to_join = [];
            break;
          }
        }

        if (!rooms_to_join.length) return;

        for (const room of rooms_to_join) {
          // check if socket is already in room
          if (socket.rooms.has(room)) {
            continue;
          }
          socket.join(room);
        }

        console.log(`Socket ${socket.id} joined rooms:`, rooms_to_join);

        socket.emit("join_rooms_success", rooms_to_join);
      });

      socket.on("leave_rooms", async (msg) => {
        const rooms_to_leave = msg?.rooms || [];

        for (const room of rooms_to_leave) {
          // check if socket is actually in room
          if (!socket.rooms.has(room)) {
            continue;
          }
          socket.leave(room);
        }

        console.log(`Socket ${socket.id} left rooms:`, rooms_to_leave);

        socket.emit("leave_rooms_success", rooms_to_leave);
      });
    });

    nsp.use(async (socket, next) => {
      // authenticate the socket connection
      const token = socket.handshake.auth.token;

      const verified_token = await verifyJWT(token, client_id);

      const token_namespace = verified_token?.payload?.namespace ?? "";

      if (!verified_token || token_namespace !== formatted_namespace) {
        next(new Error("Authentication error"));
        socket.disconnect(true);
        return;
      }

      next();
    });
  }

  task_results.url = config.http.host + ":" + config.http.port + client_namespace;

  task_results.client_id = client_id;

  task_results.token = await createJWT({
    payload: {
      namespace: formatted_namespace,
    },
    client_id: execution_context.client_settings.client_id,
  });

  task_metrics.is_success = true;
}
