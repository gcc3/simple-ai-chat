import { getSystemConfigurations } from "utils/sysUtils";
import { getIpInfo } from "utils/ipUtils";

export default async function (req, res) {
  try {
    // configurations
    const { model, model_v, role_content_system, welcome_message, querying, generating, waiting, init_placeholder, enter, temperature, top_p, max_tokens, use_function_calling, use_node_ai, use_payment, use_access_control, use_email, minimalist } = getSystemConfigurations();

    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const ipInfo = await getIpInfo(ip);
    const country = ipInfo.country === undefined ? "Unknown" : ipInfo.country;
    const city = ipInfo.city === undefined ? "Unknown" : ipInfo.city;

    res.status(200).json({
      result: {
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
        use_email: use_email,
        minimalist: minimalist,
        ip: ip,
        country: country,
        city: city,
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
