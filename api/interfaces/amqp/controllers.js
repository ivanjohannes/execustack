import execution from "../../execution/index.js";

/**
 * @param {string} client_id
 * @param {import("amqplib").ConsumeMessage} msg
 */
export async function execution_controller(client_id, msg) {
  try {
    const execution_definition = JSON.parse(msg.content?.toString());

    if (!client_id) {
      throw "no client_id";
    }

    if (!execution_definition) {
      throw "no execution_definition";
    }

    const tasks_definitions = execution_definition.tasks_definitions || {};
    for (const [task_name, task_definition] of Object.entries(tasks_definitions)) {
      // remove is_queue and is_broadcast from task_definition
      if (task_definition.is_queue !== undefined) {
        delete task_definition.is_queue;
      }
      if (task_definition.is_broadcast !== undefined) {
        delete task_definition.is_broadcast;
      }
    }

    // execute
    const execution_context = await execution(execution_definition, client_id);

    if (!execution_context?.execution_metrics?.is_success) {
      throw execution_context?.execution_metrics?.error_message || "execution failed";
    }

    return execution_context;
  } catch (err) {
    const error_message = {
      error: String(err),
      original_message: msg.content?.toString(),
    };

    return;
  }
}
