import mongodb_client from "../../stack/mongodb/index.js";
import { executeWithRedisLock, extractCollectionNameFromExecustackID, saveDocumentVersion } from "../utils/index.js";

/**
 * @description Reverts a document to a specific version.
 * @param {import("../../types/index.js").TaskDefinition} task_definition
 * @param {import("../../types/index.js").TaskMetrics} task_metrics
 * @param {import("../../types/index.js").TaskResults} task_results
 * @param {import("../../types/index.js").ExecutionContext} execution_context
 * @returns {Promise<object>} - The result of the document revert.
 */
export default async function (task_definition, task_metrics, task_results, execution_context) {
  const lock_key = task_definition.params?.execustack_id;

  async function task() {
    const { execustack_id, execustack_version } = task_definition.params;

    // Validate input
    if (!execustack_id) {
      throw "Invalid task definition";
    }

    // check db
    const collection_name = extractCollectionNameFromExecustackID(execustack_id);
    const versions_collection_name = "execustack-versions";
    const mongodb = mongodb_client.db(execution_context.client_settings.client_id);
    const db_result = await mongodb
      .collection(collection_name)
      .aggregate([
        {
          $match: {
            execustack_id,
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              document: "$$ROOT",
            },
          },
        },
        {
          $lookup: {
            from: versions_collection_name,
            let: { document_execustack_id: execustack_id, execustack_version: execustack_version },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$document_execustack_id", "$$document_execustack_id"] },
                      { $eq: ["$execustack_version", "$$execustack_version"] },
                    ],
                  },
                },
              },
            ],
            as: "revert_version",
          },
        },
        {
          $unwind: {
            path: "$revert_version",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: versions_collection_name,
            let: { document_execustack_id: execustack_id },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$document_execustack_id", "$$document_execustack_id"] }],
                  },
                },
              },
              { $sort: { execustack_version: -1 } },
              { $limit: 1 },
            ],
            as: "latest_version",
          },
        },
        {
          $unwind: {
            path: "$latest_version",
            preserveNullAndEmptyArrays: true,
          },
        },
      ])
      .toArray();
    const document_data = db_result[0];

    if (!document_data?.document) {
      throw `Cannot revert document ${execustack_id}: Document not found`;
    }

    if (!document_data?.revert_version?.document) {
      throw `Cannot revert document ${execustack_id} to version ${execustack_version}: Version not found`;
    }

    const doc_is_latest =
      document_data?.document?.execustack_version > document_data?.latest_version?.execustack_version;
    if (doc_is_latest) {
      // must save version before revert
      const version_result = await saveDocumentVersion(document_data.document, execution_context);

      // set a callback to delete the created version document
      execution_context.on_error_callbacks.push(async () => {
        await mongodb
          .collection(versions_collection_name)
          .deleteOne({ execustack_id: version_result.execustack_id });
      });
    }

    // revert the document
    const updated_document = await mongodb.collection(collection_name).findOneAndUpdate(
      { execustack_id },
      {
        $set: document_data.revert_version.document,
      },
      {
        returnDocument: "after",
        upsert: true,
      }
    );

    // set a callback to restore to previous version
    execution_context.on_error_callbacks.push(async () => {
      await mongodb.collection(collection_name).findOneAndUpdate(
        { execustack_id },
        {
          $set: document_data.document,
        },
        {
          returnDocument: "after",
          upsert: true,
        }
      );
    });

    task_results.document = updated_document;

    task_metrics.is_success = true;
  }

  const lockedTask = executeWithRedisLock(lock_key, execution_context, task);

  await lockedTask();
}
