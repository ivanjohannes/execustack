import amqp from "amqplib";
import config from "../../config.js";

let rabbitmq_client;

if (config.rabbitmq.url) {
  rabbitmq_client = await amqp.connect(config.rabbitmq.url);

  console.log("🟢 - RabbitMQ connected");
} else {
  console.log("🟠 - RabbitMQ not started because no RABBITMQ_CLIENT_URL is configured");
}

export default rabbitmq_client;
