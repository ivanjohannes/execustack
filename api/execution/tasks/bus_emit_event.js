import { fanout_publish } from "../utils/rabbitmq.js";

/**
 * @description Emits an event to a path
 * @param {import("../../types/index.js").TaskDefinition} task_definition
 * @param {import("../../types/index.js").TaskMetrics} task_metrics
 * @param {import("../../types/index.js").TaskResults} task_results
 * @param {import("../../types/index.js").ExecutionContext} execution_context
 * @returns {Promise<object>} - Updates task_results with event emission info
 */
export default async function (task_definition, task_metrics, task_results, execution_context) {
  const { event_path, event_payload = true } = task_definition?.params ?? {};

  if (!event_path) throw "Invalid task definition";

  const client_id = execution_context.client_settings.client_id;
  const exchange_name = `es-bus.${client_id}`;

  await fanout_publish(exchange_name, JSON.stringify(event_payload));

  task_metrics.is_success = true;
}
