import { getSystemConfigurations } from "utils/systemUtils.js";
import log from "../../../log.js";

export default async function (req, res) {
  try {
    // System configurations
    const sysconf = getSystemConfigurations();

    // Access log
    await log(req);
    
    res.status(200).json({
      result: {
        model: sysconf.model,
        base_url: sysconf.base_url,
        role_content_system: "***",
        welcome_message: sysconf.welcome_message,
        querying: sysconf.querying,
        generating: sysconf.generating,
        searching: sysconf.searching,
        waiting: sysconf.waiting,
        init_placeholder: sysconf.init_placeholder,
        enter: sysconf.enter,
        temperature: sysconf.temperature,
        top_p: sysconf.top_p,
        use_node_ai: sysconf.use_node_ai,
        use_payment: sysconf.use_payment,
        use_email: sysconf.use_email,
        minimalist: sysconf.minimalist,
        default_functions: sysconf.default_functions,
        default_role: sysconf.default_role,
        default_stores: sysconf.default_stores,
        default_node: sysconf.default_node,
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
