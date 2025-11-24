import config from "../../config.js";
import { createHash } from "../../execution/utils/index.js";
import mongodb_client from "../../stack/mongodb/index.js";

export async function attachClientSettings(req, res, next) {
  try {
    const bearer_token = req.headers["authorization"];
    const api_key = bearer_token?.split(" ")[1];

    if (api_key) {
      const api_key_hash = createHash(api_key);

      const client_doc = await mongodb_client.db(config.admin_client_id).collection("clients").findOne({ api_key_hash });
      if (!client_doc) throw new Error("Invalid API key");

      req.client_settings = client_doc.settings;
    }
  } catch (err) {
    console.error(err);
  } finally {
    next();
  }
}