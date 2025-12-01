import { createJWT } from "../utils/index.js";

/**
 * @description Creates a jwt token with custom payload.
 * @param {import("../../types/index.js").TaskDefinition} task_definition
 * @param {import("../../types/index.js").TaskMetrics} task_metrics
 * @param {import("../../types/index.js").TaskResults} task_results
 * @param {import("../../types/index.js").ExecutionContext} execution_context
 * @returns {Promise<object>} - Updates task_results with jwt token.
 */
export default async function (task_definition, task_metrics, task_results, execution_context) {
  const { payload, expiry_ms, allowed_uses } = task_definition?.params ?? {};

  task_results.token = await createJWT({
    payload,
    expiry_ms,
    allowed_uses,
    client_id: execution_context.client_settings.client_id,
  });

  task_metrics.is_success = true;
}
