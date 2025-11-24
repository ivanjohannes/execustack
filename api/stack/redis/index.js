import { Redis } from "ioredis";
import config from "../../config.js";

let redis_client;

if (config.redis.url) {
  redis_client = new Redis(config.redis.url);

  await new Promise((resolve, reject) => {
    checkStatus();
    function checkStatus(n = 0) {
      if (n >= 100) {
        reject(new Error("Redis connection timed out"));
      } else if (redis_client.status === "ready") {
        console.log("🟢 - Redis connected");
        resolve();
      } else if (redis_client.status === "end" || redis_client.status === "reconnecting") {
        reject(new Error("Redis connection failed"));
      } else {
        setTimeout(() => checkStatus(n + 1), 100);
      }
    }
  });
} else {
  console.log("🟠 - Redis not started because no REDIS_CLIENT_URL is configured");
}

export default redis_client;
