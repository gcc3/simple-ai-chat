import React, { useEffect, useState, useCallback } from "react";
import { fetchUserInfo } from "utils/userUtils";
import { useTranslation } from "react-i18next";
import { setRtl } from "utils/rtlUtils.js";
import { getFunctions, getMcpFunctions } from "../function.js";
import { updateUserSetting } from '../utils/userUtils.js';
import { addStoreToSessionStorage, countStoresInSessionStorage, getActiveStores, isStoreActive, removeStoreFromSessionStorage } from "../utils/storageUtils.js";
import { getTime } from "utils/timeUtils.js";


function Settings() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [languages, setLanguages] = useState([]);
  const [lang, setLang] = useState(null);

  // Data sources
  // 1. roles
  const [userRoles, setUserRoles] = useState([]);
  const [currentRole, setCurrentRole] = useState(null);

  // 2. functions
  const [systemFunctions, setSystemFunctions] = useState([]);
  const [mcpFunctions, setMcpFunctions] = useState([]);
  const [enabledFunctions, setEnabledFunctions] = useState([]);

  // 3. stores
  const [userStores, setUserStores] = useState([]);
  const [groupStores, setGroupStores] = useState([]);
  const [systemStores, setSystemStores] = useState([]);
  const [activeStores, setActiveStores] = useState([]);
  
  // 4. nodes
  const [userNodes, setUserNodes] = useState([]);
  const [groupNodes, setGroupNodes] = useState([]);
  const [systemNodes, setSystemNodes] = useState([]);
  const [activeNode, setActiveNode] = useState([]);
  
  const [message, setMessage] = useState(null);

  const { t, i18n, ready } = useTranslation("settings");
  const { t: tt } = useTranslation("translation");

  useEffect(() => {
    const loadBasicSettings = async () => {
      // Load languages
      try {
        const response = await fetch("/api/system/languages");
        const data = await response.json();
        if (response.status !== 200) {
          console.log(data.error);
          throw data.error || new Error(`Request failed with status ${response.status}`);
        }

        if (data.success) {
          setLanguages(data.languages);
        }
      } catch (error) {
        console.error("Error loading languages:", error);
      }

      // Load data sources settings
      await Promise.all([
        listRoles(),
        listFunctions(),
        listStores(),
        listNodes()
      ]);
    }
    loadBasicSettings();

    // 1. List roles
    const listRoles = async () => {
      try {
        const response = await fetch("/api/role/list", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
  
        const data = await response.json();
        if (response.status !== 200) {
          throw data.error || new Error(`Request failed with status ${response.status}`);
        }
  
        if (data.result.system_roles.length === 0 && (!data.result.user_roles || Object.entries(data.result.user_roles).length === 0)) {
          return "No role found.";
        } else {
          if (localStorage.getItem("user")) {
            if (data.result.user_roles && Object.entries(data.result.user_roles).length > 0) {
              let roles = [];
              Object.entries(data.result.user_roles).forEach(([key, value]) => {
                roles.push(value.role);
              });
              setUserRoles(roles);
            }
          }
  
          if (sessionStorage.getItem("role")) {
            const currentRole = sessionStorage.getItem("role");
            setCurrentRole(currentRole);
          }
        }
      } catch (error) {
        console.error(error);
      }
    }

    // 2. List functions
    const listFunctions = async () => {
      let functions = getFunctions();
      let mcpFunctionList = await getMcpFunctions();
      const enabledFunctions = (localStorage.getItem("functions")).split(",");
      setEnabledFunctions(enabledFunctions);

      // System functions
      setSystemFunctions(functions.map((f) => {
        return f.name;
      }));

      // mcpFunctions
      setMcpFunctions(mcpFunctionList.map((f) => {
        return f.name;
      }));
    }

    // 3. List stores
    const listStores = async () => {
      try {
        const response = await fetch("/api/store/list", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
  
        const data = await response.json();
        if (response.status !== 200) {
          throw data.error || new Error(`Request failed with status ${response.status}`);
        }
  
        if (Object.entries(data.result.user_stores).length === 0
          && Object.entries(data.result.group_stores).length === 0
          && Object.entries(data.result.system_stores).length === 0) {
          return "No available store found.";
        } else {
          // For adding star to current store
          const activeStores = getActiveStores();
          setActiveStores(activeStores);
  
          // User stores
          if (data.result.user_stores && Object.entries(data.result.user_stores).length > 0) {
            let stores = [];
            Object.entries(data.result.user_stores).forEach(([key, value]) => {
              stores.push(value.name);
            });
            setUserStores(stores);
          }
  
          // Group stores
          if (data.result.group_stores && Object.entries(data.result.group_stores).length > 0) {
            let stores = [];
            Object.entries(data.result.group_stores).forEach(([key, value]) => {
              stores.push(value.name);
            });
            setGroupStores(stores);
          }
  
          // System stores
          if (data.result.system_stores && Object.entries(data.result.system_stores).length > 0) {
            let stores = [];
            Object.entries(data.result.system_stores).forEach(([key, value]) => {
              stores.push(value.name);
            });
            setSystemStores(stores);
          }
        }
      } catch (error) {
        console.error(error);
      }
    }

    // 4. List nodes
    const listNodes = async () => {
      try {
        const response = await fetch("/api/node/list", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
  
        const data = await response.json();
        if (response.status !== 200) {
          throw data.error || new Error(`Request failed with status ${response.status}`);
        }
  
        if (Object.entries(data.result.user_nodes).length === 0 
         && Object.entries(data.result.group_nodes).length === 0 
         && Object.entries(data.result.system_nodes).length === 0) {
          return "No available node found.";
        } else {
          // For adding star to current store
          const currentNode = sessionStorage.getItem("node");
          setActiveNode(currentNode);
  
          // User nodes
          if (data.result.user_nodes && Object.entries(data.result.user_nodes).length > 0) {
            let nodes = [];
            Object.entries(data.result.user_nodes).forEach(([key, value]) => {
              nodes.push(value.name);
            });
            setUserNodes(nodes);            
          }
  
          // Group nodes
          if (data.result.group_nodes && Object.entries(data.result.group_nodes).length > 0) {
            let nodes = [];
            Object.entries(data.result.group_nodes).forEach(([key, value]) => {
              nodes.push(value.name);
            });
            setGroupNodes(nodes);
          }
  
          // System nodes
          if (data.result.system_nodes && Object.entries(data.result.system_nodes).length > 0) {
            let nodes = [];
            Object.entries(data.result.system_nodes).forEach(([key, value]) => {
              nodes.push(value.name);
            });
            setSystemNodes(nodes);
          }
        }
      } catch (error) {
        console.error(error);
      }
    }

    const loadUserSettings = async () => {
      setLoading(true);
      const user = await fetchUserInfo()
      setUser(user);
      setLoading(false);
    }

    if (localStorage.getItem("user")) {
      loadUserSettings();
    } else {
      setLoading(false);
    }

    // Set initial language
    setLang(localStorage.getItem("lang").replace("force", "").trim());
  }, []);

  const updateUserSettings = async (key, value) => {
    const response = await fetch("/api/user/update/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key, value }),
    });

    const data = await response.json();
    if (response.status !== 200) {
      console.log(data.error);
      throw data.error || new Error(`Request failed with status ${response.status}`);
    }

    if (data.success) {
      localStorage.setItem(key, value);
      console.log("Settings updated." + " (" + getTime() + ")");
      setMessage(t("Settings updated." + " (" + getTime() + ")"));
    }
  }

  const handleSetUserRoles = useCallback((name) => async () => {
    if (sessionStorage.getItem("role") === name) {
      sessionStorage.setItem("role", "");
    } else {
      sessionStorage.setItem("role", name);
    }

    // Update state
    const currentRole = sessionStorage.getItem("role");
    setCurrentRole(currentRole);

    console.log("Settings updated." + " (" + getTime() + ")");
    setMessage(t("Settings updated." + " (" + getTime() + ")"));
  }, []);

  const handleSetSystemFunctions = useCallback((name) => async () => {
    const currentFunctions = (localStorage.getItem("functions")).split(",");
    if (currentFunctions.includes(name)) {
      const index = currentFunctions.indexOf(name);
      currentFunctions.splice(index, 1);
      localStorage.setItem("functions", currentFunctions.join(","));

      // Update user setting (remote)
      if (localStorage.getItem("user")) {
        updateUserSetting("functions", currentFunctions.join(","));
      }
    } else {
      currentFunctions.push(name)
      localStorage.setItem("functions", currentFunctions.join(","));

      // Update user setting (remote)
      if (localStorage.getItem("user")) {
        updateUserSetting("functions", currentFunctions.join(","));
      }
    }

    // Update state
    const enabledFunctions = (localStorage.getItem("functions")).split(",");
    setEnabledFunctions(enabledFunctions);

    console.log("Settings updated." + " (" + getTime() + ")");
    setMessage(t("Settings updated." + " (" + getTime() + ")"));
  }, []);

  const handleSetMcpFunctions = useCallback((name) => async () => {
    const currentFunctions = (localStorage.getItem("functions")).split(",");
    if (currentFunctions.includes(name)) {
      const index = currentFunctions.indexOf(name);
      currentFunctions.splice(index, 1);
      localStorage.setItem("functions", currentFunctions.join(","));

      // Update user setting (remote)
      if (localStorage.getItem("user")) {
        updateUserSetting("functions", currentFunctions.join(","));
      }
    } else {
      currentFunctions.push(name)
      localStorage.setItem("functions", currentFunctions.join(","));

      // Update user setting (remote)
      if (localStorage.getItem("user")) {
        updateUserSetting("functions", currentFunctions.join(","));
      }
    }

    // Update state
    const enabledFunctions = (localStorage.getItem("functions")).split(",");
    setEnabledFunctions(enabledFunctions);

    console.log("Settings updated." + " (" + getTime() + ")");
    setMessage(t("Settings updated." + " (" + getTime() + ")"));
  }, []);

  const handleSetUserStores = useCallback((name) => async () => {
    if (isStoreActive(name)) {
      removeStoreFromSessionStorage(name);
    } else {
      addStoreToSessionStorage(name);
    }

    // Update state
    const activeStores = getActiveStores();
    setActiveStores(activeStores);

    console.log("Settings updated." + " (" + getTime() + ")");
    setMessage(t("Settings updated." + " (" + getTime() + ")"));
  }, []);

  const handleSetGroupStores = useCallback((name) => async () => {
    if (isStoreActive(name)) {
      removeStoreFromSessionStorage(name);
    } else {
      addStoreToSessionStorage(name);
    }

    // Update state
    const activeStores = getActiveStores();
    setActiveStores(activeStores);

    console.log("Settings updated." + " (" + getTime() + ")");
    setMessage(t("Settings updated." + " (" + getTime() + ")"));
  }, []);

  const handleSetSystemStores = useCallback((name) => async () => {
    if (isStoreActive(name)) {
      removeStoreFromSessionStorage(name);
    } else {
      addStoreToSessionStorage(name);
    }

    // Update state
    const activeStores = getActiveStores();
    setActiveStores(activeStores);

    console.log("Settings updated." + " (" + getTime() + ")");
    setMessage(t("Settings updated." + " (" + getTime() + ")"));
  }, []);

  const handleSetUserNodes = useCallback((name) => async () => {
    if (sessionStorage.getItem("node") === name) {
      sessionStorage.setItem("node", "");
    } else {
      sessionStorage.setItem("node", name);
    }

    // Update state
    const currentNode = sessionStorage.getItem("node");
    setActiveNode(currentNode);

    console.log("Settings updated." + " (" + getTime() + ")");
    setMessage(t("Settings updated." + " (" + getTime() + ")"));
  }, []);

  const handleSetGroupNodes = useCallback((name) => async () => {
    if (sessionStorage.getItem("node") === name) {
      sessionStorage.setItem("node", "");
    } else {
      sessionStorage.setItem("node", name);
    }

    // Update state
    const currentNode = sessionStorage.getItem("node");
    setActiveNode(currentNode);

    console.log("Settings updated." + " (" + getTime() + ")");
    setMessage(t("Settings updated." + " (" + getTime() + ")"));
  }, []);

  const handleSetSystemNodes = useCallback((name) => async () => {
    if (sessionStorage.getItem("node") === name) {
      sessionStorage.setItem("node", "");
    } else {
      sessionStorage.setItem("node", name);
    }

    // Update state
    const currentNode = sessionStorage.getItem("node");
    setActiveNode(currentNode);

    console.log("Settings updated." + " (" + getTime() + ")");
    setMessage(t("Settings updated." + " (" + getTime() + ")"));
  }, []);

  const handleSetLanguage = useCallback((newLang) => async () => {
    // Set language
    const lang_ = newLang.replace("force", "").trim()
    setLang(lang_);
    const i18nLang = lang_.split("-")[0];
    i18n.changeLanguage(i18nLang)
    .then(async () => {
      console.log("Language: " + lang_ + ", i18n: " + i18n.language);
      console.log('Language test:', tt("hello"));
      setRtl(i18nLang === "ar");

      // Update user settings
      if (user) {
        await updateUserSettings("lang", newLang);
      }

      console.log("Settings updated." + " (" + getTime() + ")");
      setMessage(t("Settings updated." + " (" + getTime() + ")"));
    });
  }, [i18n, t, user]);

  const handleSubscribe = useCallback((subscription) => async () => {
    const response = await fetch("/api/user/update/email-subscription?" + new URLSearchParams({
      email: user.email,
      email_subscription: subscription,
    }, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }));

    const data = await response.json();
    if (response.status !== 200) {
      console.log(data.error);
      throw data.error || new Error(`Request failed with status ${response.status}`);
    }

    if (data.success) {
      console.log("Email subscription updated.");
      setMessage(t("Email subscription updated."));
    }
  }, [user, t]);

  const content = (
    <>
      {message && <div>
        {<div className="ml-2">{message}</div>}
      </div>}
      {userRoles && userRoles.length > 0 && <div>
        <div className="mt-3">- {t("User Roles")}</div>
        <div className="flex flex-wrap items-center mt-2">
          {userRoles.map((i) => (
            <button 
              className="ml-2 mb-1" 
              key={i}
              onClick={handleSetUserRoles(i)}
              style={{ backgroundColor: currentRole === i ? '#EAEAEA' : '' }}
            >
              {i}
            </button>
          ))}
        </div>
      </div>}
      {systemFunctions && systemFunctions.length > 0 && <div>
        <div className="mt-3">- {t("System Functions")}</div>
        <div className="flex flex-wrap items-center mt-2">
          {systemFunctions.map((i) => (
            <button 
              className="ml-2 mb-1" 
              key={i}
              onClick={handleSetSystemFunctions(i)}
              style={{ backgroundColor: enabledFunctions.includes(i) ? '#EAEAEA' : '' }}
            >
              {i}
            </button>
          ))}
        </div>
      </div>}
      {mcpFunctions && mcpFunctions.length > 0 && <div>
        <div className="mt-3">- {t("MCP Functions")}</div>
        <div className="flex flex-wrap items-center mt-2">
          {mcpFunctions.map((i) => (
            <button 
              className="ml-2 mb-1" 
              key={i}
              onClick={handleSetMcpFunctions(i)}
              style={{ backgroundColor: enabledFunctions.includes(i) ? '#EAEAEA' : '' }}
            >
              {i}
            </button>
          ))}
        </div>
      </div>}
      {userStores && userStores.length > 0 && <div>
        <div className="mt-3">- {t("User Stores")}</div>
        <div className="flex flex-wrap items-center mt-2">
          {userStores.map((i) => (
            <button 
              className="ml-2 mb-1" 
              key={i}
              onClick={handleSetUserStores(i)}
              style={{ backgroundColor: activeStores.includes(i) ? '#EAEAEA' : '' }}
            >
              {i}
            </button>
          ))}
        </div>
      </div>}
      {groupStores && groupStores.length > 0 && <div>
        <div className="mt-3">- {t("Group Stores")}</div>
        <div className="flex flex-wrap items-center mt-2">
          {groupStores.map((i) => (
            <button 
              className="ml-2 mb-1" 
              key={i}
              onClick={handleSetGroupStores(i)}
              style={{ backgroundColor: activeStores.includes(i) ? '#EAEAEA' : '' }}
            >
              {i}
            </button>
          ))}
        </div>
      </div>}
      {systemStores && systemStores.length > 0 && <div>
        <div className="mt-3">- {t("System Stores")}</div>
        <div className="flex flex-wrap items-center mt-2">
          {systemStores.map((i) => (
            <button 
              className="ml-2 mb-1" 
              key={i}
              onClick={handleSetSystemStores(i)}
              style={{ backgroundColor: activeStores.includes(i) ? '#EAEAEA' : '' }}
            >
              {i}
            </button>
          ))}
        </div>
      </div>}
      {userNodes && userNodes.length > 0 && <div>
        <div className="mt-3">- {t("User Nodes")}</div>
        <div className="flex flex-wrap items-center mt-2">
          {userNodes.map((i) => (
            <button 
              className="ml-2 mb-1" 
              key={i}
              onClick={handleSetUserNodes(i)}
              style={{ backgroundColor: activeNode === i ? '#EAEAEA' : '' }}
            >
              {i}
            </button>
          ))}
        </div>
      </div>}
      {groupNodes && groupNodes.length > 0 && <div>
        <div className="mt-3">- {t("Group Nodes")}</div>
        <div className="flex flex-wrap items-center mt-2">
          {groupNodes.map((i) => (
            <button 
              className="ml-2 mb-1" 
              key={i}
              onClick={handleSetGroupNodes(i)}
              style={{ backgroundColor: activeNode === i ? '#EAEAEA' : '' }}
            >
              {i}
            </button>
          ))}
        </div>
      </div>}
      {systemNodes && systemNodes.length > 0 && <div>
        <div className="mt-3">- {t("System Nodes")}</div>
        <div className="flex flex-wrap items-center mt-2">
          {systemNodes.map((i) => (
            <button 
              className="ml-2 mb-1" 
              key={i}
              onClick={handleSetSystemNodes(i)}
              style={{ backgroundColor: currentRole === i ? '#EAEAEA' : '' }}
            >
              {i}
            </button>
          ))}
        </div>
      </div>}
      {languages && <div>
        <div className="mt-3">- {t("Language")}</div>
        <div className="flex flex-wrap items-center mt-2">
          {languages.map((l) => (
            <button 
              className="ml-2 mb-1" 
              key={l.language_code} 
              onClick={handleSetLanguage(l.language_code + " force")} 
              style={{ backgroundColor: l.language_code == lang ? '#EAEAEA' : '' }}
            >
              {l.native_name}
            </button>
          ))}
        </div>
      </div>}
      {user && <div>
        <div className="mt-2">- {t("Email Subscription")}</div>
        <div className="flex flex-wrap items-center mt-2">
          <button className="ml-2" onClick={handleSubscribe("1")}>{t("Subscribe")}</button>
          <button className="ml-2" onClick={handleSubscribe("0")}>{t("Unsubscribe")}</button>
        </div>
      </div>}
    </>
  );

  if (!ready) return (<div><br></br></div>);
  return (
    <div className="Settings">
      <div className="text-center mb-4">
        <div>{t("Settings")}</div>
      </div>
      {loading ? <div>{t("Loading...")}</div> : <div>{content}</div>}
    </div>
  );
}

export default Settings;