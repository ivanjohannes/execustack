/**
 * @typedef {object} ExecutionContext
 * @property {string} [es_id]
 * @property {string} [queued_from_execution_es_id]
 * @property {object} client_settings
 * @property {string} [client_settings.client_id]
 * @property {ExecutionDefinition} [execution_definition]
 * @property {ExecutionMetrics} [execution_metrics]
 * @property {Record<string, TaskDefinition>} [evaluated_tasks_definitions]
 * @property {Record<string, TaskMetrics>} [tasks_metrics]
 * @property {Record<string, TaskResults>} [tasks_results]
 * @property {Array<Function>} [on_error_callbacks]
 * @property {Array<TaskDefinition>} [queued_tasks]
 */

/**
 * @typedef {object} ExecutionMetrics
 * @property {number} [execution_time_ms]
 * @property {boolean} [is_success]
 * @property {string} [error_message]
 */

/**
 * @typedef {object} ExecutionDefinition
 * @property {Record<string, TaskDefinition>} tasks_definitions
 */

/**
 * @typedef {object} TaskDefinition
 * @property {string} function
 * @property {string} [name]
 * @property {number} [execution_order]
 * @property {object} [params]
 * @property {TaskPreValidation[]} [pre_validations]
 * @property {TaskPostValidation[]} [post_validations]
 * @property {string} [is_secret_task_results]
 * @property {string} [error_message]
 * @property {boolean} [is_non_essential]
 * @property {boolean} [is_queue] - if true, the task will be executed in a separate queue worker
 * @property {boolean} [is_broadcast] - if true, the task will be broadcasted to all available queue workers
 */

/**
 * @typedef {object} TaskMetrics
 * @property {boolean} is_attempted
 * @property {number} [ms_since_execution_start]
 * @property {number} [execution_time_ms]
 * @property {boolean} [is_success]
 * @property {string} [error_message]
 * @property {boolean} [is_reverted]
 * @property {boolean} [is_queue]
 */

/**
 * @typedef {any} TaskResults
 */

/**
 * @typedef {object} TaskPreValidation
 * @property {string} expression
 * @property {string} [error_message]
 */

/**
 * @typedef {object} TaskPostValidation
 * @property {string} expression
 * @property {string} [error_message]
 */
