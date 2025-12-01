import config from "../../config.js";
import { createHash, isJWT, verifyJWT } from "../../execution/utils/index.js";
import mongodb_client from "../../stack/mongodb/index.js";

export async function attachClientSettings(req, res, next) {
  try {
    const bearer_token = req.headers["authorization"];
    const token = bearer_token?.split(" ")[1] ?? req.query.token;

    if (token) {
      const is_jwt = isJWT(token);

      if (is_jwt) {
        const verified_token = await verifyJWT(token);
        if (!verified_token) throw new Error("Invalid JWT token");

        const execution_definition = verified_token.payload;
        const client_id = verified_token.sub;

        const client_doc = await mongodb_client
          .db(config.admin_client_id)
          .collection("clients")
          .findOne({ "settings.client_id": client_id });
        if (!client_doc) throw new Error("Invalid JWT token");

        req.client_settings = client_doc.settings;
        req.execution_definition = execution_definition;
      } else {
        const api_key_hash = createHash(token);

        const client_doc = await mongodb_client
          .db(config.admin_client_id)
          .collection("clients")
          .findOne({ api_key_hash });
        if (!client_doc) throw new Error("Invalid API key");

        req.client_settings = client_doc.settings;
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    next();
  }
}
