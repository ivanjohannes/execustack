import { evaluateTemplate, generateExecustackID, precisionTimer } from "./utils/index.js";
import * as task_functions from "./tasks/index.js";
import { fanout_publish } from "./utils/rabbitmq.js";
import mongodb_client from "../stack/mongodb/index.js";

/**
 * @param {import("../types/index.js").ExecutionContext} execution_context
 * @returns {Promise<import("../types/index.js").ExecutionContext>} - The execution context containing task results.
 */
export default async function (execution_context) {
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

    // generate execustack_id
    execution_context.execustack_id = await generateExecustackID("execustack-executions", execution_context);

    // set tasks_metrics to { is_attempted: false }
    execution_context.tasks_metrics = ordered_task_definitions.reduce((acc, task_definition) => {
      acc[task_definition.name] = { is_attempted: false };
      return acc;
    }, {});

    // set tasks_results to {}
    execution_context.tasks_results = {};
    execution_context.evaluated_tasks_definitions = {};

    // execute tasks_definitions in order
    for (const task_definition of ordered_task_definitions) {
      const evaluated_task_definition = await evaluateTemplate(task_definition, execution_context);
      execution_context.evaluated_tasks_definitions[evaluated_task_definition.name] = evaluated_task_definition;
      const task_metrics = execution_context.tasks_metrics[evaluated_task_definition.name];
      task_metrics.is_conditions_passed = (evaluated_task_definition.conditions ?? []).every((c) =>
        Boolean(c.expression)
      );
      if (!task_metrics.is_conditions_passed) continue;
      const task_timer = precisionTimer(task_definition.name);
      task_metrics.ms_since_execution_start = timer(evaluated_task_definition.name);
      const task_results = (execution_context.tasks_results[evaluated_task_definition.name] = {});
      task_metrics.is_attempted = true;
      // register a is_reverted callback
      execution_context.on_error_callbacks.push(function () {
        task_metrics.is_reverted = true;
      });
      try {
        await task_functions[evaluated_task_definition.function](
          evaluated_task_definition,
          task_metrics,
          task_results,
          execution_context
        );
      } catch (err) {
        console.error("🔴 - Task error -", evaluated_task_definition.name, err);
        task_metrics.error = String(err);
      }
      task_metrics.execution_time_ms = task_timer("stop");
      if (!task_metrics.is_success) {
        if (evaluated_task_definition.is_continue_if_error) {
          console.log(`🟠 - Task error but continuing: ${evaluated_task_definition.name}`);
        } else {
          if (evaluated_task_definition.if_error_message) {
            execution_context.execution_metrics.error_message = evaluated_task_definition.if_error_message;
          } else {
            execution_context.execution_metrics.error_message = `Task failed: ${evaluated_task_definition.name}`;
          }
          throw "Task failed";
        }
      }
    }

    for (const [task_name, task_definition] of Object.entries(execution_context.evaluated_tasks_definitions)) {
      // publish task_results to a fanout exchange
      const task_results = execution_context.tasks_results[task_name];
      if (task_results) {
        const exchange_name = `execustack-tasks.${execution_context.client_settings.client_id}.${task_definition.function}`;
        fanout_publish(
          exchange_name,
          JSON.stringify({
            task_name,
            task_results,
            evaluated_task_definition: task_definition,
          })
        );
      }

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
  const mongodb = mongodb_client.db(execution_context.client_settings.client_id);
  await mongodb.collection("execustack-executions").insertOne({
    execustack_id: execution_context.execustack_id,
    execution_definition: execution_context.execution_definition,
    execution_metrics: execution_context.execution_metrics,
    tasks_metrics: execution_context.tasks_metrics,
    created_at: new Date(),
  });

  return execution_context;
}
