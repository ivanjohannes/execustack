import _ from "lodash";
import {
  consume,
  getExecutionBroadcastExchangeName,
  getExecutionQueueName,
  setupQueue,
} from "../../execution/utils/rabbitmq.js";
import mongodb_client from "../../stack/mongodb/index.js";
import config from "../../config.js";
import { execution_controller } from "./controllers.js";

// retrieve all the clients from the database
const admin_db = mongodb_client.db(config.admin_client_id);
const clients = await admin_db.collection("clients").find({}).toArray();

// consume broadcast message for new clients
consume({
  is_manual_ack: true,
  prefetch: 1,
  queue_options: {
    exchange_options: {
      exchange_name: config.admin_client_id + "-broadcast",
      exchange_type: "fanout",
    },
  },
  onMessage: async (msg, ack, nack, reject) => {
    try {
      const client = JSON.parse(msg.content?.toString());
      const client_id = client.settings?.client_id;
      if (!client_id) {
        nack();
        return;
      }

      await setupConsumers(client_id);
      ack();
    } catch (err) {
      nack();
    }
  },
});

// organize listeners by client_id
for (const client of clients) {
  const client_id = client.settings.client_id;
  if (!client_id) continue;

  setupConsumers(client_id);
}

/**
 * @param {string} client_id
 */
async function setupConsumers(client_id) {
  // setup dlx queue to store failed messages
  const executions_exchange_name = getExecutionBroadcastExchangeName(client_id);
  const errors_queue_name = `${executions_exchange_name}-errors`;
  await setupQueue({
    queue_name: errors_queue_name,
  });

  // fanout consume
  await consume({
    is_manual_ack: true,
    prefetch: 1,
    queue_options: {
      exchange_options: {
        exchange_name: executions_exchange_name,
        exchange_type: "fanout",
      },
      arguments: {
        dlx_exchange_name: "",
        dlx_routing_key: errors_queue_name,
      },
    },
    onMessage,
  });

  // queue consume
  const executions_queue_name = getExecutionQueueName(client_id);
  await consume({
    is_manual_ack: true,
    prefetch: 1,
    queue_options: {
      arguments: {
        dlx_exchange_name: "",
        dlx_routing_key: errors_queue_name,
      },
      queue_name: executions_queue_name,
    },
    onMessage,
  });

  async function onMessage(msg, ack, nack, reject) {
    try {
      const ec = await execution_controller(client_id, msg);

      if (ec?.execution_metrics?.is_success) {
        ack();
      } else {
        nack();
      }
    } catch (err) {
      nack();
    }
  }
}
