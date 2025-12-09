import rabbitmq_client from "../../stack/rabbitmq/index.js";

/**
 * @typedef ExchangeOptions
 * @property {string} [exchange_name] - Name of the exchange
 * @property {'direct'|'topic'|'fanout'|'headers'} [exchange_type] - Exchange type
 * @property {boolean} [is_durable] - Whether exchange is durable
 * @property {boolean} [is_internal] - Whether exchange is internal
 * @property {boolean} [is_auto_delete] - Whether exchange auto-deletes
 */

/**
 * @typedef QueueOptions
 * @property {string} [queue_name] - Queue name
 * @property {ExchangeOptions} [exchange_options] - Exchange options
 * @property {string} [routing_key] - Routing key
 * @property {object} [headers] - Headers for headers exchange
 * @property {boolean} [is_durable] - Whether queue is durable
 * @property {boolean} [is_exclusive] - Whether queue is exclusive
 * @property {boolean} [is_auto_delete] - Whether queue auto-deletes
 * @property {object} [arguments] - Additional queue arguments
 * @property {number} [arguments.ttl] - Message TTL in milliseconds
 * @property {string} [arguments.dlx_exchange_name] - Dead-letter exchange name
 * @property {string} [arguments.dlx_routing_key] - Dead-letter routing key
 */

/**
 * @typedef PublishOptions
 * @property {string} [routing_key] - Routing key
 * @property {ExchangeOptions} [exchange_options] - Exchange options
 * @property {boolean} [is_persistent] - Whether message is persistent
 */

/**
 * @typedef ConsumeOptions
 * @property {QueueOptions} queue_options
 * @property {number} [prefetch] - Prefetch count
 * @property {boolean} [is_manual_ack] - Whether manual ack is enabled
 * @property {(msg: import('amqplib').ConsumeMessage, ack: Function, nack: Function, reject: Function) => void} onMessage - Message handler
 */

/**
 * @typedef {string|Buffer|object} Payload
 */

// Create a default channel for all RabbitMQ operations
// If rabbitmq_client is not available, default_channel will be undefined
const default_channel = rabbitmq_client && (await rabbitmq_client.createChannel());

/**
 * Generate a standardized exchange name for client executions
 * @param {string} client_id - The client ID
 * @returns {string} Formatted exchange name
 */
export function getExecutionBroadcastExchangeName(client_id) {
  return `es-${client_id}-executions`;
}

/**
 * Generates a standardized queue name for client executions
 * @param {string} client_id
 * @returns {string} Formatted queue name
 */
export function getExecutionQueueName(client_id) {
  return `es-${client_id}-executions`;
}

/**
 * Set up a RabbitMQ exchange with the specified configuration
 * @param {ExchangeOptions} [exchange_options]
 * @returns {Promise<string>} The exchange name
 */
export async function setupExchange(exchange_options) {
  // Verify channel is initialized before attempting operations
  if (!default_channel) throw new Error("RabbitMQ client is not initialized");
  if (!exchange_options) return "";
  const { exchange_name = "", exchange_type, is_durable, is_internal, is_auto_delete } = exchange_options;

  // Only create exchange if a name is provided
  if (exchange_name && exchange_type) {
    await default_channel.assertExchange(exchange_name, exchange_type, {
      durable: is_durable ?? false, // Survive broker restarts (default: true)
      internal: is_internal ?? false, // Only accessible by other exchanges (default: false)
      autoDelete: is_auto_delete ?? false, // Delete when no bindings exist (default: false)
    });
  }

  return exchange_name;
}

/**
 * Set up a RabbitMQ queue and bind it to an exchange
 * @param {QueueOptions} queue_options
 * @returns {Promise<string>} The queue name
 */
export async function setupQueue(queue_options) {
  // Verify channel is initialized before attempting operations
  if (!default_channel) throw new Error("RabbitMQ client is not initialized");
  const { queue_name, exchange_options, routing_key, arguments: args, headers } = queue_options;

  // Ensure the exchange exists before creating the queue
  const exchange_name = await setupExchange(exchange_options);

  let queueName = queue_name;
  if (!queueName) {
    // Create an anonymous queue (broker-generated name) for temporary use
    const q = await default_channel.assertQueue("", { exclusive: true, autoDelete: true });
    queueName = q.queue;
  } else {
    // Set up queue-specific arguments using RabbitMQ's x-* convention
    if (args?.ttl) {
      queue_options.arguments["x-message-ttl"] = args.ttl; // Message expiration time
    }
    if (args?.dlx_exchange_name ?? args?.dlx_routing_key) {
      queue_options.arguments["x-dead-letter-exchange"] = args.dlx_exchange_name ?? ""; // Where rejected/expired messages go
      queue_options.arguments["x-dead-letter-routing-key"] = args.dlx_routing_key ?? ""; // Routing key for dead-lettered messages
    }
    await default_channel.assertQueue(queueName, {
      durable: queue_options.is_durable ?? false, // Survive broker restarts (default: true)
      exclusive: queue_options.is_exclusive ?? false, // Limited to this connection (default: false)
      autoDelete: queue_options.is_auto_delete ?? false, // Delete when consumers disconnect (default: false)
      arguments: queue_options.arguments,
    });
  }

  // Bind the queue to the exchange with the specified routing key
  // Headers parameter is used for 'headers' exchange type, ignored for others
  if (exchange_name) {
    await default_channel.bindQueue(queueName, exchange_name, routing_key ?? "", headers);
  }

  return queueName;
}

/**
 * Publish a message to a RabbitMQ exchange
 * @param {Payload} payload - Message payload (string, Buffer, or object)
 * @param {PublishOptions} publish_options - Publish options
 */
export async function publish(payload, publish_options) {
  // Verify channel is initialized before attempting operations
  if (!default_channel) throw new Error("RabbitMQ client is not initialized");
  const { exchange_options } = publish_options;

  // Ensure the exchange exists before publishing
  const exchange_name = await setupExchange(exchange_options);

  // Convert payload to Buffer based on its type
  // RabbitMQ requires messages to be sent as buffers
  const buffer = Buffer.isBuffer(payload)
    ? payload // Already a buffer
    : typeof payload === "string"
    ? Buffer.from(payload) // Convert string to buffer
    : Buffer.from(JSON.stringify(payload)); // Serialize object to JSON and convert to buffer

  const { routing_key, is_persistent } = publish_options;

  // Publish the message to the exchange
  // Persistent messages survive broker restarts if the queue is durable
  default_channel.publish(exchange_name, routing_key ?? "", buffer, {
    persistent: is_persistent ?? true,
  });
}

/**
 * Consume messages from a RabbitMQ queue
 * @param {ConsumeOptions} consume_options
 */
export async function consume(consume_options) {
  // Verify channel is initialized before attempting operations
  if (!default_channel) throw new Error("RabbitMQ client is not initialized");
  const { queue_options, onMessage, prefetch, is_manual_ack } = consume_options;

  // Set up the queue and its binding
  const queueName = await setupQueue(queue_options);

  // Set prefetch count when using manual acknowledgment
  // This limits how many unacknowledged messages the consumer can have
  if (is_manual_ack) {
    default_channel.prefetch(prefetch ?? 1);
  }

  // Start consuming messages from the queue
  await default_channel.consume(
    queueName,
    (msg) => {
      // Null message indicates consumer was cancelled
      if (!msg) return;

      // Provide helper functions for message acknowledgment
      const ack = () => default_channel.ack(msg); // Acknowledge successful processing
      const nack = () => default_channel.nack(msg, false, true); // Negative ack, requeue message
      const reject = () => default_channel.reject(msg, false); // Reject message, don't requeue

      // Pass message and ack functions to the user-provided handler
      onMessage(msg, ack, nack, reject);
    },
    {
      noAck: !is_manual_ack, // Automatically ack messages if manual ack is disabled
    }
  );
}
