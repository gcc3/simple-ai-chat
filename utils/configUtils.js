import { getSetting, setSetting } from "../utils/settingsUtils.js";


export function loadConfig() {
  return {
    time: getSetting("time"),
    session: getSetting("session"), 
    model: getSetting("model"),
    base_url: getSetting("baseUrl"),
    mem_length: getSetting("memLength"),
    functions: getSetting("functions"),
    role: getSetting("role"),
    stores: getSetting("stores"),           
    node: getSetting("node"),
    use_stats: getSetting("useStats"),
    use_eval: getSetting("useEval"),
    use_location: getSetting("useLocation"),    
    location: getSetting("location"),
    lang: getSetting("lang").replace("force", "").trim(),            
    use_system_role: getSetting("useSystemRole"), 
  }
}
