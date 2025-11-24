import mongodb_client from "../../stack/mongodb/index.js";
import { generateExecustackID } from "../utils/index.js";

/**
 * @description Creates a document in the specified collection.
 * @param {import("../../types/index.js").TaskDefinition} task_definition
 * @param {import("../../types/index.js").TaskMetrics} task_metrics
 * @param {import("../../types/index.js").TaskResults} task_results
 * @param {import("../../types/index.js").ExecutionContext} execution_context
 * @returns {Promise<object>} - The result of the document creation.
 */
export default async function (task_definition, task_metrics, task_results, execution_context) {

  const { collection_name, payload } = task_definition.params;

  // Validate input
  if (!collection_name || !payload) {
    throw "Invalid task definition";
  }

  // generate the execustack_id
  const execustack_id = await generateExecustackID(collection_name, execution_context);

  // create the document
  const timestamp = new Date();
  const mongodb = mongodb_client.db(execution_context.client_settings.client_id);
  const document = await mongodb.collection(collection_name).findOneAndUpdate(
    { execustack_id },
    {
      $set: {
        ...payload,
        execustack_id,
        execustack_version: 1,
        from_execustack_version: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
    }
  );

  // set a callback to delete the created document
  execution_context.on_error_callbacks.push(async () => {
    await mongodb.collection(collection_name).deleteOne({ execustack_id });
  });

  task_results.document = document;

  task_metrics.is_success = true;
}
