import { evaluateTemplate, generateESID, precisionTimer } from "./utils/index.js";
import * as task_functions from "./tasks/index.js";
import mongodb_client from "../stack/mongodb/index.js";
import _ from "lodash";
import { getExecutionBroadcastExchangeName, getExecutionQueueName, publish } from "./utils/rabbitmq.js";

/**
 * @param {import("../types/index.js").ExecutionDefinition} execution_definition - The definition of the execution to perform.
 * @param {string} client_id - The client ID for which the execution is performed.
 * @returns {Promise<import("../types/index.js").ExecutionContext>} - The execution context containing task results.
 */
export default async function execution(execution_definition, client_id) {
  // build an execution_context
  /** @type {import("../types/index.js").ExecutionContext} */
  const execution_context = {};

  // populate execution_context
  execution_context.client_settings = { client_id };

  // set execution_definition
  execution_context.execution_definition = execution_definition;

  const timer = precisionTimer("execution");
  // check there is a execution_definition
  if (!execution_context || !execution_context.execution_definition) {
    throw "No execution_definition provided in execution_context";
  }

  // set is_success to true
  execution_context.execution_metrics = {};
  execution_context.execution_metrics.is_success = true;

  // set the on_error_callbacks
  execution_context.on_error_callbacks = [];

  try {
    // default tasks_definitions to {}
    if (!execution_context.execution_definition.tasks_definitions)
      execution_context.execution_definition.tasks_definitions = {};

    // get the ordered list of tasks_definitions to execute
    const ordered_task_definitions = Object.entries(execution_context.execution_definition.tasks_definitions)
      .reduce((acc, [task_name, task_definition]) => {
        // validate function
        if (!task_definition.function || !(task_definition.function in task_functions)) {
          throw `Invalid function: ${task_definition.function}`;
        }

        // set defaults
        if (!task_definition.name) task_definition.name = task_name;
        if (!task_definition.execution_order) task_definition.execution_order = Number.MAX_SAFE_INTEGER;
        acc.push(task_definition);
        return acc;
      }, [])
      .sort((a, b) => a.execution_order - b.execution_order);

    // generate es_id
    execution_context.es_id = await generateESID("es-executions", execution_context);

    // set tasks_metrics to { is_attempted: false }
    execution_context.tasks_metrics = ordered_task_definitions.reduce((acc, task_definition) => {
      acc[task_definition.name] = { is_attempted: false };
      return acc;
    }, {});

    // set tasks_results to {}
    execution_context.tasks_results = {};
    execution_context.evaluated_tasks_definitions = {};
    execution_context.queued_tasks = [];

    // execute tasks_definitions in order
    for (const task_definition of ordered_task_definitions) {
      const evaluated_task_definition = await evaluateTemplate(_.cloneDeep(task_definition), execution_context);
      execution_context.evaluated_tasks_definitions[evaluated_task_definition.name] = evaluated_task_definition;

      const is_essential = !evaluated_task_definition.is_non_essential;
      const error_message = evaluated_task_definition.error_message || `Error: ${evaluated_task_definition.name}`;

      // pre-validation
      const pre_validations = evaluated_task_definition.pre_validations || [];
      const pre_validation_error = pre_validations.find((pv) => !Boolean(pv.expression));
      if (pre_validation_error) {
        if (is_essential) {
          execution_context.execution_metrics.error_message =
            pre_validation_error.error_message || `Error: ${evaluated_task_definition.name} pre-validation failed`;
          throw "Task pre-validation failed";
        } else {
          continue;
        }
      }

      // task
      const task_metrics = execution_context.tasks_metrics[evaluated_task_definition.name];
      if (evaluated_task_definition.is_queue || evaluated_task_definition.is_broadcast) {
        execution_context.queued_tasks.push(evaluated_task_definition);
        task_metrics.is_attempted = false;
        task_metrics.is_queue = Boolean(evaluated_task_definition.is_broadcast || evaluated_task_definition.is_queue);
        continue;
      }

      const task_timer = precisionTimer(evaluated_task_definition.name);
      task_metrics.ms_since_execution_start = timer(evaluated_task_definition.name);
      task_metrics.is_attempted = true;
      try {
        // register a is_reverted callback
        const task_results = (execution_context.tasks_results[evaluated_task_definition.name] = {});
        execution_context.on_error_callbacks.push(function () {
          task_metrics.is_reverted = true;
          for (const key of Object.keys(task_results)) {
            delete task_results[key];
          }
        });
        await task_functions[evaluated_task_definition.function](
          evaluated_task_definition,
          task_metrics,
          task_results,
          execution_context
        );
      } catch (err) {
        console.error("🔴 - Task error -", evaluated_task_definition.name, err);
        task_metrics.error_message = String(err);
      }
      task_metrics.execution_time_ms = task_timer("stop");

      if (!task_metrics.is_success && is_essential) {
        execution_context.execution_metrics.error_message = error_message;
        throw "Task failed";
      }

      // post-validation
      const post_validations = await evaluateTemplate(task_definition.post_validations || [], execution_context);
      const post_validation_error = post_validations.find((pv) => !Boolean(pv.expression));
      if (post_validation_error) {
        if (is_essential) {
          execution_context.execution_metrics.error_message =
            post_validation_error.error_message ?? `Error: ${evaluated_task_definition.name} post-validation failed`;
          throw "Task post-validation failed";
        } else {
          continue;
        }
      }
    }

    for (const [task_name, task_definition] of Object.entries(execution_context.evaluated_tasks_definitions)) {
      // remove secret task_results
      if (task_definition.is_secret_task_results && execution_context.tasks_results[task_name] !== undefined) {
        delete execution_context.tasks_results[task_name];
      }

      // task_definitions
      execution_context.execution_definition.tasks_definitions[task_name] = {
        name: task_definition.name,
        function: task_definition.function,
      };

      execution_context.evaluated_tasks_definitions[task_name] = {
        name: task_definition.name,
        function: task_definition.function,
      };
    }

    // queue any queued tasks
    for (const queued_task of execution_context.queued_tasks) {
      const payload = {
        queued_from_execution_es_id: execution_context.es_id,
        tasks_definitions: {
          [queued_task.name]: queued_task,
        },
      };

      if (queued_task.is_broadcast) {
        await publish(payload, {
          exchange_options: {
            exchange_name: getExecutionBroadcastExchangeName(client_id),
            exchange_type: "fanout",
          },
        });
      } else {
        await publish(payload, {
          routing_key: getExecutionQueueName(client_id),
        });
      }
    }
  } catch (err) {
    console.error("🔴 - Execution error:", err);
    execution_context.execution_metrics.is_success = false;

    // execute the on_error_callbacks in reverse order
    for (let i = execution_context.on_error_callbacks.length - 1; i >= 0; i--) {
      try {
        await execution_context.on_error_callbacks[i](execution_context);
      } catch (callback_err) {
        console.error("🔴 - on_error_callback error:", callback_err);
      }
    }
  }

  // set execution time
  execution_context.execution_metrics.execution_time_ms = timer("stop");

  // create the execution document in the database
  const timestamp = new Date();
  await mongodb_client
    .db(client_id)
    .collection("es-executions")
    .findOneAndUpdate(
      { es_id: execution_context.es_id },
      {
        $set: {
          execution_definition: execution_context.execution_definition,
          execution_metrics: execution_context.execution_metrics,
          tasks_metrics: execution_context.tasks_metrics,
          es_id: execution_context.es_id,
          queued_from_execution_es_id: execution_context.queued_from_execution_es_id,
          es_version: 1,
          from_es_version: 0,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      }
    );

  return execution_context;
}
