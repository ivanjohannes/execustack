import config from "./config.js";
import execution from "./execution/index.js";
import { createHash } from "./execution/utils/index.js";
import mongodb_client from "./stack/mongodb/index.js";

const admin_db = mongodb_client.db(config.admin_client_id);

// check that the admin client exists
const api_key = process.env.ADMIN_CLIENT_API_KEY || "execustack_default_key";
const api_key_hash = createHash(api_key);
const admin_client = await admin_db.collection("clients").findOne({
  "settings.client_id": config.admin_client_id,
});

if (admin_client) {
  const execustack_id = admin_client.execustack_id;

  // check that the hash matches
  if (admin_client.api_key_hash !== api_key_hash) {
    console.log("🟠 - Admin client API key hash does not match, updating...");

    // update the admin_client
    const execution_result = await execution({
      client_settings: admin_client.settings,
      execution_definition: {
        tasks_definitions: {
          update_client: {
            function: "mongodb_update_doc",
            params: {
              execustack_id,
              update: {
                $set: {
                  api_key_hash,
                },
              },
            },
          },
        },
      },
    });
    if (!execution_result?.execution_metrics?.is_success) throw new Error("Failed to update admin client");
  } else {
    console.log("🟢 - Admin client exists and API key hash matches");
  }
} else {
  console.log("🟠 - Admin client does not exist, creating...");

  // update the admin_client
  const execution_result = await execution({
    client_settings: {
      client_id: config.admin_client_id,
    },
    execution_definition: {
      tasks_definitions: {
        create_client: {
          function: "mongodb_create_doc",
          params: {
            collection_name: "clients",
            payload: {
              api_key_hash,
              settings: {
                client_id: config.admin_client_id,
                name: "ExecuStack Admin Client",
              },
            },
          },
        },
      },
    },
  });
  if (!execution_result?.execution_metrics?.is_success) throw new Error("Failed to create admin client");
}
