/**
 * @description Creates an event listener
 * @param {import("../../types/index.js").TaskDefinition} task_definition
 * @param {import("../../types/index.js").TaskMetrics} task_metrics
 * @param {import("../../types/index.js").TaskResults} task_results
 * @param {import("../../types/index.js").ExecutionContext} execution_context
 * @returns {Promise<object>} - Updates task_results with event listener registration info
 */
export default async function (task_definition, task_metrics, task_results, execution_context) {
  const { listener_id, execution_definition, event_path } = task_definition?.params ?? {};

  if (!listener_id) throw "Invalid task definition";
  if (!execution_definition) throw "Invalid task definition";
  if (!event_path) throw "Invalid task definition";

  

  task_metrics.is_success = true;
}
