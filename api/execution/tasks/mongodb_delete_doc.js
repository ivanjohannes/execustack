import mongodb_client from "../../stack/mongodb/index.js";
import { executeWithRedisLock, extractCollectionNameFromESID, saveDocumentVersion } from "../utils/index.js";

/**
 * @description Deletes a document in the specified collection.
 * @param {import("../../types/index.js").TaskDefinition} task_definition
 * @param {import("../../types/index.js").TaskMetrics} task_metrics
 * @param {import("../../types/index.js").TaskResults} task_results
 * @param {import("../../types/index.js").ExecutionContext} execution_context
 * @returns {Promise<object>} - The result of the document deletion.
 */
export default async function (task_definition, task_metrics, task_results, execution_context) {
  const lock_key = task_definition.params?.es_id;

  async function task() {
    const { es_id } = task_definition.params;

    // Validate input
    if (!es_id) {
      throw "Invalid task definition";
    }

    // check db
    const collection_name = extractCollectionNameFromESID(es_id);
    const versions_collection_name = "es-versions";
    const mongodb = mongodb_client.db(execution_context.client_settings.client_id);
    const db_result = await mongodb
      .collection(collection_name)
      .aggregate([
        {
          $match: {
            es_id,
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
            let: { document_es_id: es_id },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$document_es_id", "$$document_es_id"] }],
                  },
                },
              },
              { $sort: { es_version: -1 } },
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
      throw `Cannot delete document ${es_id}: Document not found`;
    }

    const doc_is_latest =
      document_data?.document?.es_version > document_data?.latest_version?.es_version;
    let latest_document;
    if (doc_is_latest) {
      latest_document = document_data.document;
    } else {
      // make it the latest document by updating its es_version
      latest_document = await mongodb.collection(collection_name).findOneAndUpdate(
        { es_id },
        {
          $set: {
            es_version: (document_data?.latest_version?.es_version || 0) + 1,
            from_es_version: document_data?.document?.es_version || 0,
            updatedAt: new Date(),
          },
        },
        {
          returnDocument: "after",
        }
      );

      // set a callback to undo the change
      execution_context.on_error_callbacks.push(async () => {
        await mongodb.collection(collection_name).findOneAndUpdate(
          { es_id },
          {
            $set: {
              es_version: document_data.document.es_version,
              from_es_version: document_data.document.from_es_version,
            },
          },
          {
            returnDocument: "after",
          }
        );
      });
    }

    // save the document version
    const version_result = await saveDocumentVersion(latest_document, execution_context);

    // set a callback to delete the created version document
    execution_context.on_error_callbacks.push(async () => {
      await mongodb
        .collection(versions_collection_name)
        .deleteOne({ es_id: version_result.es_id });
    });

    // delete the document
    await mongodb.collection(collection_name).deleteOne({ es_id });
    // set a callback to recreate the deleted document
    execution_context.on_error_callbacks.push(async () => {
      await mongodb.collection(collection_name).findOneAndUpdate(
        { es_id },
        {
          $set: latest_document,
        },
        {
          returnDocument: "after",
          upsert: true,
        }
      );
    });

    task_results.is_document_deleted = true;
    task_results.document = { es_id };

    task_metrics.is_success = true;
  }

  const lockedTask = executeWithRedisLock(lock_key, execution_context, task);

  await lockedTask();
}
