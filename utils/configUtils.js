export function loadConfig() {
  return {
    time: sessionStorage.getItem("time"),
    session: sessionStorage.getItem("session"), 
    model: sessionStorage.getItem("model"),
    base_url: sessionStorage.getItem("baseUrl"),
    mem_length: sessionStorage.getItem("memLength"),
    functions: localStorage.getItem("functions"),
    role: sessionStorage.getItem("role"),
    stores: sessionStorage.getItem("stores"),           
    node: sessionStorage.getItem("node"),
    use_stats: localStorage.getItem("useStats"),
    use_eval: localStorage.getItem("useEval"),
    use_location: localStorage.getItem("useLocation"),    
    location: localStorage.getItem("location"),
    lang: localStorage.getItem("lang").replace("force", "").trim(),            
    use_system_role: localStorage.getItem("useSystemRole"), 
  }
}
