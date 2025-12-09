/**
 * @description Provides a way to add context to an execution context
 * @param {import("../../types/index.js").TaskDefinition} task_definition
 * @param {import("../../types/index.js").TaskMetrics} task_metrics
 * @param {import("../../types/index.js").TaskResults} task_results
 * @param {import("../../types/index.js").ExecutionContext} execution_context
 * @returns {Promise<object>} - The result of the task
 */
export default async function (task_definition, task_metrics, task_results, execution_context) {
  for (const [key, value] of Object.entries(task_definition.params || {})) {
    task_results[key] = value;
  }

  task_metrics.is_success = true;
}
