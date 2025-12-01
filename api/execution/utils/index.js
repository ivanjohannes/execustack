import { v4 as uuidv4 } from "uuid";
import config from "../../config.js";
import jsonata from "jsonata";
import Handlebars from "handlebars";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import redis_client from "../../stack/redis/index.js";
import redlock_plugin from "../../stack/redlock/index.js";
import mongodb_client from "../../stack/mongodb/index.js";

/**
 * @description Timer function to precisely time operations.
 * @param {string} [name="timer"] - The name of the timer.
 * @param {boolean} [is_silent=false] - Whether to suppress console output.
 * @returns {object} - An object with `stop` and `tick` methods.
 */
export function precisionTimer(name = "unnamed", is_silent = !config.show_timer_logs) {
  const _start = process.hrtime();
  if (!is_silent) console.log(`⚪ - start timer ${name}`);
  return function (tick_name = "tick") {
    const _end = process.hrtime(_start);
    const msSinceStart = _end[0] * 1000 + _end[1] / 1000000;
    if (!is_silent) console.log(`⚪ - ${tick_name} timer ${name} - since start: ${msSinceStart}ms`);
    return msSinceStart;
  };
}

/**
 * Creates a hash from a string
 * @param {string} unhashed_string
 * @returns {string}
 */
export function createHash(unhashed_string) {
  return crypto.createHash("sha256").update(unhashed_string).digest("hex");
}

/**
 * @description Generates a random string of specified length.
 * @param {number} length - The length of the random string to generate.
 * @returns {string} - The generated random string.
 */
export function generateRandomString(length = 20) {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);
}

/**
 * @description Generate a unique document ID for a given collection and database.
 * @param {string} collection_name - The name of the collection.
 * @param {import("../../types/index.js").ExecutionContext} execution_context - The tech stack containing the MongoDB instance.
 * @returns {Promise<string>} - The generated document ID.
 */
export async function generateESID(collection_name, execution_context) {
  let uuid = uuidv4();
  const es_id = `${collection_name}~${uuid}`;

  const mongodb = mongodb_client.db(execution_context.client_settings.client_id);
  const duplicate = await mongodb?.collection(collection_name).findOne({ es_id });
  if (duplicate) return generateESID(collection_name, execution_context);

  return es_id;
}

/**
 * @description extracts the collection_name from the es_id assuming the es_id always ends with ~[uuid]
 * @param {string} es_id - The es ID of the document.
 * @returns {string} - The collection name.
 */
export function extractCollectionNameFromESID(es_id) {
  const parts = es_id.split("~");
  parts.pop(); // remove the uuid part
  return parts.join("~");
}

/**
 * @description Function to create a new version document
 * @param {import("mongodb").Document} document - The document to create a version for.
 * @param {import("../../types/index.js").ExecutionContext} execution_context - The tech stack containing the MongoDB instance.
 * @returns {Promise<object>} - The result of the version creation and update.
 */
export async function saveDocumentVersion(document, execution_context) {
  const versions_collection_name = "es-versions";

  if (!document) {
    throw "Cannot save document version: Document not found";
  }

  // create the version document
  const version_es_id = await generateESID(versions_collection_name, execution_context);
  const version_doc = {
    document_es_id: document.es_id,
    es_version: document.es_version,
    from_es_version: document.from_es_version,
    execution_es_id: execution_context.es_id,
    document,
    createdAt: new Date(),
  };
  const mongodb = mongodb_client.db(execution_context.client_settings.client_id);
  await mongodb.collection(versions_collection_name).findOneAndUpdate(
    {
      document_es_id: document.es_id,
      es_version: document.es_version,
    },
    {
      $set: version_doc,
      $setOnInsert: {
        es_id: version_es_id,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
    }
  );

  return {
    es_id: version_es_id,
  };
}

/**
 * @description Evaluates a template using Handlebars or JSONata based on the context provided.
 * @param {any} [template]
 * @param {any} [context]
 * @returns {Promise<any>}
 */
export async function evaluateTemplate(template, context) {
  if (template === undefined) return;
  if (!context) return template;
  let result;

  if (Array.isArray(template)) {
    const promises = template.map((item) => evaluateTemplate(item, context));
    result = await Promise.all(promises);
  } else if (typeof template === "object") {
    const promises = Object.entries(template).map(async ([key, value]) => {
      const evaluatedValue = await evaluateTemplate(value, context);
      return [key, evaluatedValue];
    });
    result = Object.fromEntries(await Promise.all(promises));
  } else if (typeof template === "string") {
    // get the templating key from the start of the template (if any). The templating key must be at the start of the template inside two square brackets like [[jsonata]] = templating language - jsonata
    const templating_key = template.match(/^\[\[(.*?)\]\]/)?.[1];

    if (templating_key === "jsonata") {
      const template_part = template.match(/^\[\[jsonata\]\](.*)/)?.[1] ?? "";
      result = await jsonata(template_part).evaluate(context);
    } else {
      // default to handlebars
      const template_function = Handlebars.compile(template);
      result = template_function(context);
    }
  } else {
    result = template;
  }
  return result;
}

/**
 * @description execute a function by first getting a lock on redis
 * @param {string} lock_key
 * @param {import("../../types/index.js").ExecutionContext} execution_context
 * @param {Function} func
 * @returns {Function}
 */
export function executeWithRedisLock(lock_key, execution_context, func) {
  const resource_key = `${execution_context.client_settings.client_id}:locks:${lock_key}`;
  const lock_ttl_ms = 10000; // 10 seconds

  return async function (...args) {
    const lock = await redlock_plugin.acquire([resource_key], lock_ttl_ms);

    const interval = setInterval(async () => {
      try {
        await lock.extend(lock_ttl_ms);
      } catch (err) {
        console.error("🔴 - Failed to extend redis lock:", err);
      }
    }, lock_ttl_ms / 2);

    try {
      return await func(...args);
    } catch (err) {
      throw err;
    } finally {
      clearInterval(interval);
      await redlock_plugin.release(lock);
    }
  };
}

/**
 * @description Creates a jwt token with custom payload.
 * @param {object} param0
 * @param {object} param0.payload - The payload to include in the JWT.
 * @param {number} [param0.expiry_ms] - The expiry time in milliseconds.
 * @param {number} [param0.allowed_uses] - The allowed uses for the token.
 * @param {string} param0.client_id - The client ID for whom the token is generated.
 * @returns {Promise<string>} - The generated JWT token.
 */
export async function createJWT({ payload, expiry_ms, allowed_uses, client_id }) {
  const ninety_days_ms = 90 * 24 * 60 * 60 * 1000;
  if (!expiry_ms) expiry_ms = ninety_days_ms;

  const expiry_seconds = Math.floor(expiry_ms / 1000);

  const token_id = generateRandomString(24);

  // generate token for client
  const token = jwt.sign(
    {
      sub: client_id,
      jti: token_id,
      payload,
    },
    config.jwt_keys.private,
    {
      algorithm: "RS256",
      keyid: config.jwt_keys.key_id,
      expiresIn: expiry_seconds,
    }
  );

  // store in redis
  if (redis_client) {
    const redis_key = `${client_id}:tokens:${token_id}`;
    const redis_value = Number.isInteger(+allowed_uses) ? String(parseInt(allowed_uses.toString(), 10)) : "active";
    await redis_client.set(redis_key, redis_value, "EX", expiry_seconds);
  }

  return token;
}

/**
 * @description Verifies a JWT token
 * @param {string} token
 * @returns {Promise<object|null>} - The verified token payload or null if verification fails.
 */
export async function verifyJWT(token) {
  try {
    const verified_token = await new Promise((resolve, reject) => {
      jwt.verify(token, config.jwt_keys.public, { algorithms: ["RS256"] }, (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded);
      });
    });

    const client_id = verified_token.sub;
    if (!client_id) {
      throw new Error("Invalid token subject");
    }

    if (!redis_client) return verified_token;

    const redis_key = `${client_id}:tokens:${verified_token.jti}`;
    const token_status = await redis_client.get(redis_key);

    if (token_status === "active") {
      return verified_token;
    } else if (!isNaN(parseInt(token_status, 10))) {
      const remaining_uses = await redis_client.decr(redis_key);
      if (remaining_uses <= 0) {
        await redis_client.del(redis_key);
      }
      if (remaining_uses < 0) {
        return null;
      } else {
        return verified_token;
      }
    }

    return null;
  } catch (err) {
    return null;
  }
}

/**
 * @description Deletes a JWT token
 * @param {string} token
 * @returns {Promise<boolean>} - True if deletion was successful, false otherwise.
 */
export async function deleteJWT(token) {
  try {
    const verified_token = await new Promise((resolve, reject) => {
      jwt.verify(token, config.jwt_keys.public, { algorithms: ["RS256"] }, (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded);
      });
    });

    const client_id = verified_token.sub;

    if (!redis_client) return false;

    const redis_key = `${client_id}:tokens:${verified_token.jti}`;
    const result = await redis_client.del(redis_key);
    if (result === 1) {
      return true;
    }

    return false;
  } catch (err) {
    return false;
  }
}

/**
 * @description Checks if a token could be a jwt by looking at its structure
 * @param {string} token
 * @returns {boolean}
 */
export function isJWT(token) {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [headerB64, payloadB64, signatureB64] = parts;

  // check header
  try {
    const headerJson = Buffer.from(headerB64, "base64").toString("utf-8");
    const header = JSON.parse(headerJson);
    if (!header.alg || !header.typ) return false;
  } catch (err) {
    return false;
  }

  // check payload
  try {
    const payloadJson = Buffer.from(payloadB64, "base64").toString("utf-8");
    JSON.parse(payloadJson);
  } catch (err) {
    return false;
  }

  // check signature
  if (!signatureB64 || signatureB64.length === 0) return false;

  return true;
}
