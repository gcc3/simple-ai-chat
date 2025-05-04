export function getSystemConfigurations() {
  // Welcome message
  let welcome_message = process.env.WELCOME_MESSAGE ? process.env.WELCOME_MESSAGE : "";
  if (!process.env.ROOT_PASS) welcome_message = "Hi, you need to setup the `.env` to initialize the program.\n\nFollow this [guide](https://github.com/gcc3/simple-ai-chat?tab=readme-ov-file#env) to setup.";
  if (!process.env.OPENAI_API_KEY) welcome_message = "`OPENAI_API_KEY` is required.";
  if (!process.env.MODEL) welcome_message = "`MODEL` is required.";

  const model = process.env.MODEL ? process.env.MODEL : "";
  const base_url = process.env.OPENAI_BASE_URL ? process.env.OPENAI_BASE_URL : "";
  const role_content_system = process.env.ROLE_CONTENT_SYSTEM ? process.env.ROLE_CONTENT_SYSTEM : "";
  const querying = process.env.QUERYING ? process.env.QUERYING : "Querying...";
  const generating = process.env.GENERATING ? process.env.GENERATING : "";
  const searching = process.env.SEARCHING ? process.env.SEARCHING : "";
  const waiting = process.env.WAITING ? process.env.WAITING : "";
  const init_placeholder = process.env.INIT_PLACEHOLDER ? process.env.INIT_PLACEHOLDER : ":help";
  const enter = process.env.ENTER ? process.env.ENTER : "";
  const temperature = process.env.TEMPERATURE ? Number(process.env.TEMPERATURE) : 1;
  const top_p = process.env.TOP_P ? Number(process.env.TOP_P) : 1;
  const use_function_calling = process.env.USE_FUNCTION_CALLING == "true" ? true : false;
  const use_node_ai = process.env.USE_NODE_AI == "true" ? true : false;
  const use_user_accounts = process.env.USE_USER_ACCOUNTS == "true" ? true : false;
  const use_payment = process.env.USE_PAYMENT == "true" ? true : false;
  const use_access_control = process.env.USE_ACCESS_CONTROL == "true" ? true : false;
  const use_email = process.env.USE_EMAIL == "true" ? true : false;
  const minimalist = process.env.MINIMALIST == "true" ? true : false;
  const default_functions = process.env.DEFAULT_FUNCTIONS ? process.env.DEFAULT_FUNCTIONS : "";
  const default_role = process.env.DEFAULT_ROLE ? process.env.DEFAULT_ROLE : "";
  const default_stores = process.env.DEFAULT_STORES ? process.env.DEFAULT_STORES : "";
  const default_node = process.env.DEFAULT_NODE ? process.env.DEFAULT_NODE : "";

  return {
    model: model,
    base_url: base_url,
    role_content_system: role_content_system,
    welcome_message: welcome_message,
    querying: querying,
    generating: generating,
    searching: searching,
    waiting: waiting,
    init_placeholder: init_placeholder,
    enter: enter,
    temperature: temperature,
    top_p: top_p,
    use_function_calling: use_function_calling,
    use_node_ai: use_node_ai,
    use_user_accounts: use_user_accounts,
    use_payment: use_payment,
    use_access_control: use_access_control,
    use_email: use_email,
    minimalist: minimalist,
    default_functions: default_functions,
    default_role: default_role,
    default_stores: default_stores,
    default_node: default_node,
  };
}
