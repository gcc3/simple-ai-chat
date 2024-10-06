export function loadConfig() {
  return {
    /*  1 */ time: sessionStorage.getItem("time"),
    /*  2 */ session: sessionStorage.getItem("session"), 
    /*  3 */ mem_length: sessionStorage.getItem("memLength"),
    /*  4 */ functions: localStorage.getItem("functions"),
    /*  5 */ role: sessionStorage.getItem("role"),
    /*  6 */ store: sessionStorage.getItem("stores"),           
    /*  7 */ node: sessionStorage.getItem("node"),
    /*  8 */ use_stats: localStorage.getItem("useStats"),
    /*  9 */ use_eval: localStorage.getItem("useEval"),
    /* 10 */ use_location: localStorage.getItem("useLocation"),    
    /* 11 */ location: localStorage.getItem("location"),
    /* 12 */ lang: localStorage.getItem("lang").replace("force", "").trim(),            
    /* 13 */ use_system_role: localStorage.getItem("useSystemRole"), 
  }
}
