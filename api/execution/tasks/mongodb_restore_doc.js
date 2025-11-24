import mongodb_client from "../../stack/mongodb/index.js";
import { executeWithRedisLock, extractCollectionNameFromExecustackID } from "../utils/index.js";

/**
 * @description Restores a deleted document in the specified collection.
 * @param {import("../../types/index.js").TaskDefinition} task_definition
 * @param {import("../../types/index.js").TaskMetrics} task_metrics
 * @param {import("../../types/index.js").TaskResults} task_results
 * @param {import("../../types/index.js").ExecutionContext} execution_context
 * @returns {Promise<object>} - The result of the document restoration.
 */
export default async function (task_definition, task_metrics, task_results, execution_context) {
  const lock_key = task_definition.params?.execustack_id;

  async function task() {
    const { execustack_id } = task_definition.params;

    // Validate input
    if (!execustack_id) {
      throw "Invalid task definition";
    }

    // check db
    const collection_name = extractCollectionNameFromExecustackID(execustack_id);
    const versions_collection_name = "execustack-versions";
    const mongodb = mongodb_client.db(execution_context.client_settings.client_id);
    const db_result = await mongodb
      .collection(versions_collection_name)
      .aggregate([
        {
          $match: {
            document_execustack_id: execustack_id,
          },
        },
        {
          $sort: { execustack_version: -1 },
        },
        { $limit: 1 },
        {
          $lookup: {
            from: collection_name,
            localField: "document_execustack_id",
            foreignField: "execustack_id",
            as: "current_document",
          },
        },
        {
          $unwind: {
            path: "$current_document",
            preserveNullAndEmptyArrays: true,
          },
        },
      ])
      .toArray();
    const version_data = db_result[0];

    if (!version_data) {
      throw `Cannot restore document ${execustack_id}: No version history found`;
    }

    if (version_data.current_document) {
      throw `Cannot restore document ${execustack_id}: Document already exists`;
    }

    // restore the document
    const updated_document = await mongodb.collection(collection_name).findOneAndUpdate(
      { execustack_id },
      {
        $set: {
          ...version_data.document,
          execustack_version: version_data.execustack_version + 1,
          from_execustack_version: version_data.execustack_version,
        },
      },
      {
        returnDocument: "after",
        upsert: true,
      }
    );

    // set a callback to delete the recreated document
    execution_context.on_error_callbacks.push(async () => {
      await mongodb.collection(collection_name).deleteOne({ execustack_id });
    });

    task_results.document = updated_document;

    task_metrics.is_success = true;
  }

  const lockedTask = executeWithRedisLock(lock_key, execution_context, task);

  await lockedTask();
}
