import { createHash } from "../utils/index.js";

/**
 * @description Creates a hash of a string.
 * @param {import("../../types/index.js").TaskDefinition} task_definition
 * @param {import("../../types/index.js").TaskMetrics} task_metrics
 * @param {import("../../types/index.js").TaskResults} task_results
 * @param {import("../../types/index.js").ExecutionContext} execution_context
 * @returns {Promise<object>} - The result of the string to hash task.
 */
export default async function (task_definition, task_metrics, task_results, execution_context) {
  const { string } = task_definition.params;

  if (!string || typeof string !== "string") {
    throw "Invalid task definition";
  }

  // generate a hash
  task_results.hash = createHash(string);

  task_metrics.is_success = true;
}
