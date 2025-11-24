import Redlock from "redlock";
import redis_client from "../redis/index.js";

let redlock_plugin;

if (redis_client) {
  redlock_plugin = new Redlock([redis_client], {
    driftFactor: 0.01, // time in ms
    retryCount: 10,
    retryDelay: 200, // time in ms
    retryJitter: 200, // time in ms
  });

  console.log("🟢 - Redlock ready");
}

export default redlock_plugin;
