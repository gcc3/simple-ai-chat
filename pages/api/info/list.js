import { getMaxTokens } from "utils/tokenUtils";

export default async function (req, res) {
  try {
    // configurations
    const model = process.env.MODEL ? process.env.MODEL : "";
    const role_content_system = process.env.ROLE_CONTENT_SYSTEM ? process.env.ROLE_CONTENT_SYSTEM : "";
    const temperature = process.env.TEMPERATURE ? Number(process.env.TEMPERATURE) : 0.7;  // default is 0.7
    const top_p = process.env.TOP_P ? Number(process.env.TOP_P) : 1;                      // default is 1
    const init_placeholder = process.env.INIT_PLACEHOLDER ? process.env.INIT_PLACEHOLDER : "";
    const waiting = process.env.WAITING ? process.env.WAITING : "";
    const querying = process.env.QUERYING ? process.env.QUERYING : "Querying...";
    const enter = process.env.ENTER ? process.env.ENTER : "";
    const max_tokens = process.env.MAX_TOKENS ? Number(process.env.MAX_TOKENS) : getMaxTokens(model);
    const use_function_calling = process.env.USE_FUNCTION_CALLING == "true" ? true : false;
    const use_node_ai = process.env.USE_NODE_AI == "true" ? true : false;
    const force_node_ai_query = process.env.FORCE_NODE_AI_QUERY == "true" ? true : false;
    const use_vector = process.env.USE_VECTOR == "true" ? true : false;
    const use_payment = process.env.USE_PAYMENT == "true" ? true : false;
    const use_email = process.env.USE_EMAIL == "true" ? true : false;

    // Output the result
    res.status(200).json({
      result: {
        role_content_system: role_content_system,
        temperature: temperature,
        top_p: top_p,
        init_placeholder: init_placeholder,
        waiting: waiting,
        querying: querying,
        enter: enter,
        max_tokens: max_tokens,
        use_function_calling: use_function_calling,
        use_node_ai: use_node_ai,
        force_node_ai_query: force_node_ai_query,
        use_vector: use_vector,
        use_payment: use_payment,
        use_email: use_email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: {
        message: "An error occurred during your request.",
      },
    });
  }
}
