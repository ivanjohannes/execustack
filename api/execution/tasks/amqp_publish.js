import { publish } from "../utils/rabbitmq.js";

/**
 * @description Published a payload to an AMQP exchange or queue.
 * @param {import("../../types/index.js").TaskDefinition} task_definition
 * @param {import("../../types/index.js").TaskMetrics} task_metrics
 * @param {import("../../types/index.js").TaskResults} task_results
 * @param {import("../../types/index.js").ExecutionContext} execution_context
 * @returns {Promise<object>} - The result of the AMQP publish task.
 */
export default async function (task_definition, task_metrics, task_results, execution_context) {
  const { payload, publish_options } = task_definition.params;
  const client_id = execution_context.client_settings.client_id;

  if (publish_options?.routing_key) publish_options.routing_key = client_id + "-" + publish_options.routing_key;
  if (publish_options?.exchange_options?.exchange_name)
    publish_options.exchange_options.exchange_name = client_id + "-" + publish_options.exchange_options.exchange_name;

  await publish(payload, publish_options);

  task_metrics.is_success = true;
}
