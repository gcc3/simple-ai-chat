import { getMaxTokens } from "utils/tokenUtils";

export function getSystemConfigurations() {
  const model = process.env.MODEL ? process.env.MODEL : "";
  const model_v = process.env.MODEL_V ? process.env.MODEL_V : "";
  const role_content_system = process.env.ROLE_CONTENT_SYSTEM ? process.env.ROLE_CONTENT_SYSTEM : "";
  const temperature = process.env.TEMPERATURE ? Number(process.env.TEMPERATURE) : 0.7;  // default is 0.7
  const top_p = process.env.TOP_P ? Number(process.env.TOP_P) : 1;                      // default is 1
  const init_placeholder = process.env.INIT_PLACEHOLDER ? process.env.INIT_PLACEHOLDER : "";
  const waiting = process.env.WAITING ? process.env.WAITING : "";
  const generating = process.env.GENERATING ? process.env.GENERATING : "";
  const querying = process.env.QUERYING ? process.env.QUERYING : "Querying...";
  const enter = process.env.ENTER ? process.env.ENTER : "";
  const max_tokens = process.env.MAX_TOKENS ? Number(process.env.MAX_TOKENS) : getMaxTokens(model);
  const use_function_calling = process.env.USE_FUNCTION_CALLING == "true" ? true : false;
  const use_node_ai = process.env.USE_NODE_AI == "true" ? true : false;
  const use_payment = process.env.USE_PAYMENT == "true" ? true : false;
  const use_access_control = process.env.USE_ACCESS_CONTROL == "true" ? true : false;
  const use_email = process.env.USE_EMAIL == "true" ? true : false;
  const welcome_message = process.env.WELCOME_MESSAGE ? process.env.WELCOME_MESSAGE : "";
  const minimalist = process.env.MINIMALIST == "true" ? true : false;

  return {
    model: model,
    model_v: model_v,
    role_content_system: role_content_system,
    welcome_message: welcome_message,
    querying: querying,
    generating: generating,
    waiting: waiting,
    init_placeholder: init_placeholder,
    enter: enter,
    temperature: temperature,
    top_p: top_p,
    max_tokens: max_tokens,
    use_function_calling: use_function_calling,
    use_node_ai: use_node_ai,
    use_payment: use_payment,
    use_access_control: use_access_control,
    use_email: use_email,
    minimalist: minimalist,
  };
}