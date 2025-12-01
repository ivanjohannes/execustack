import { generateRandomString } from "../utils/index.js";

/**
 * @description Creates a random string task.
 * @param {import("../../types/index.js").TaskDefinition} task_definition
 * @param {import("../../types/index.js").TaskMetrics} task_metrics
 * @param {import("../../types/index.js").TaskResults} task_results
 * @param {import("../../types/index.js").ExecutionContext} execution_context
 * @returns {Promise<object>} - The result of the random string task.
 */
export default async function (task_definition, task_metrics, task_results, execution_context) {
  const { length = 20 } = task_definition.params;

  // generate a random string
  task_results.random_string = generateRandomString(length);

  task_metrics.is_success = true;
}
