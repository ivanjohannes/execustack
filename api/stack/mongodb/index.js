import { MongoClient } from "mongodb";
import config from "../../config.js";

let mongodb_client;

if (config.mongodb.url) {
  mongodb_client = new MongoClient(config.mongodb.url);

  await mongodb_client.connect().then(() => {
    console.log("🟢 - MongoDB connected");
  });
} else {
  throw new Error("MONGODB_CLIENT_URL is not configured");
}

export default mongodb_client;
