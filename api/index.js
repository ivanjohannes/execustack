import config from "./config.js";

try {
  console.log("🟠 - ExecuStack starting");

  // Stack
  await Promise.all([
    import("./stack/mongodb/index.js"),
    import("./stack/redis/index.js"),
    import("./stack/redlock/index.js"),
    import("./stack/rabbitmq/index.js"),
  ]);
  // END Stack

  // Startup Tasks
  await import("./startup.js");
  // END Startup Tasks

  // Interfaces
  if (config.http.port) {
    await import("./interfaces/socketio/index.js");
    const http_server = await import("./interfaces/http/index.js").then((mod) => mod.default);
    await new Promise((resolve, reject) => {
      http_server.listen(config.http.port, (err) => {
        if (err) {
          return reject(new Error("HTTP server failed to start:", err));
        }
        console.log(`🟢 - HTTP server listening on port ${config.http.port}`);
        resolve();
      });
    });
  } else {
    console.log("🟠 - HTTP interface not started because no HTTP_PORT is configured");
  }
  // END Interfaces

  console.log("🟢 - ExecuStack started");
} catch (err) {
  console.error("🔴 - ExecuStack failed to start:", err);
  process.exit(1);
}
