import execution from "../../execution/index.js";

export async function ping_controller(req, res) {
  try {
    res.status(200).send("ExecuStack is alive!");
  } catch (err) {
    console.error("🔴 - Error occurred in ping_controller:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function execution_controller(req, res) {
  try {
    const client_settings = req.client_settings;
    if (!client_settings?.client_id) {
      throw "no client_id";
    }

    // build an execution_context
    const execution_context = {};

    // populate execution_context
    execution_context.client_settings = client_settings;

    // set execution_definition
    execution_context.execution_definition = req.execution_definition || req.body;

    if (!execution_context.execution_definition) {
      throw "no execution_definition";
    }

    // execute
    await execution(execution_context);

    res.status(execution_context?.execution_metrics?.is_success ? 200 : 422).json(execution_context);
  } catch (err) {
    console.error("🔴 - Error occurred in execution_controller:", err);
    res.status(500).json({ error: err.message });
  }
}
