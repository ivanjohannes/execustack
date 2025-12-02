import mongodb_client from "../../stack/mongodb/index.js";
import mongodb_create_doc from "./mongodb_create_doc.js";
import mongodb_update_doc from "./mongodb_update_doc.js";

/**
 * @description Creates a document in the specified collection.
 * @param {import("../../types/index.js").TaskDefinition} task_definition
 * @param {import("../../types/index.js").TaskMetrics} task_metrics
 * @param {import("../../types/index.js").TaskResults} task_results
 * @param {import("../../types/index.js").ExecutionContext} execution_context
 * @returns {Promise<object>} - The result of the document creation.
 */
export default async function (task_definition, task_metrics, task_results, execution_context) {
  const { collection_name, es_id, payload } = task_definition.params;

  // Validate input
  if (!collection_name || !payload || !es_id) {
    throw "Invalid task definition";
  }

  const mongodb = mongodb_client.db(execution_context.client_settings.client_id);

  // determine if document exists
  const existing_document = await mongodb.collection(collection_name).findOne({ es_id });

  if (existing_document) {
    // perform update
    await mongodb_update_doc(task_definition, task_metrics, task_results, execution_context);
  } else {
    // add es_id to payload
    task_definition.params.payload.es_id = es_id;

    // create the document
    await mongodb_create_doc(task_definition, task_metrics, task_results, execution_context);
  }
}
