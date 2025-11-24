import rabbitmq_client from "../../stack/rabbitmq/index.js";

export const default_channel = rabbitmq_client && await rabbitmq_client.createChannel();

export async function close() {
  if (!rabbitmq_client) return;
  await default_channel.close();
  await rabbitmq_client.close();
}

export async function queue_publish(
  /** @type {String} The queue name */ queue_name,
  /** @type {String} The message */ message
) {
  if (!rabbitmq_client) return;
  await default_channel.assertQueue(queue_name, {
    durable: true,
  });
  default_channel.sendToQueue(queue_name, Buffer.from(message), {
    persistent: true,
  });
}

export async function queue_consume(
  /** @type {String} The queue name */ queue_name,
  /** @type {Function} The callback function */ callback
) {
  if (!rabbitmq_client) return;
  await default_channel.assertQueue(queue_name, {
    durable: true,
  });
  default_channel.consume(queue_name, (msg) => {
    if (msg !== null) {
      callback(msg);
      default_channel.ack(msg);
    }
  }, { noAck: false });
}

export async function fanout_publish(
  /** @type {String} The exchange name */ exchange_name,
  /** @type {String} The message */ message
) {
  if (!rabbitmq_client) return;
  await default_channel.assertExchange(exchange_name, "fanout", {
    durable: true,
  });
  default_channel.publish(exchange_name, "", Buffer.from(message), {
    persistent: true,
  });
}

export async function fanout_consume(
  /** @type {String} The exchange name */ exchange_name,
  /** @type {Function} The callback function */ callback
) {
  if (!rabbitmq_client) return;
  await default_channel.assertExchange(exchange_name, "fanout", {
    durable: true,
  });
  const { queue } = await default_channel.assertQueue("", {
    exclusive: true,
  });
  await default_channel.bindQueue(queue, exchange_name, "");
  default_channel.consume(queue, (msg) => {
    if (msg !== null) {
      callback(msg);
    }
  }, { noAck: true });
}