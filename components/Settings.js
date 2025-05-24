import React, { useEffect, useState, useCallback } from "react";
import { fetchUserInfo } from "utils/userUtils";
import { useTranslation } from "react-i18next";
import { setRtl } from "utils/rtlUtils.js";
import { getFunctions, getMcpFunctions } from "../function.js";
import { updateUserSetting } from '../utils/userUtils.js';
import { addStoreToSessionStorage, getActiveStores, isStoreActive, removeStoreFromSessionStorage } from "../utils/storageUtils.js";
import { getTime } from "utils/timeUtils.js";
import { pingOllamaAPI, listOllamaModels } from "../utils/ollamaUtils.js";
import { setTheme } from "utils/themeUtils.js";
import { getSetting, setSetting } from "../utils/settingsUtils.js";


function Settings() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [languages, setLanguages] = useState([]);
  const [lang, setLang] = useState([]);

  // Models
  const [userModels, setUserModels] = useState([]);
  const [groupModels, setGroupModels] = useState([]);
  const [systemModels, setSystemModels] = useState([]);
  const [ollamaModels, setOllamaModels] = useState([]);
  const [currentModel, setCurrentModel] = useState(null);

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
        listModels(),
        listRoles(),
        listFunctions(),
        listStores(),
        listNodes()
      ]);
    }
    loadBasicSettings();

    // List models
    const listModels = async () => {
      try {
        const response = await fetch("/api/model/list", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        if (response.status !== 200) {
          throw data.error || new Error(`Request failed with status ${response.status}`);
        }

        if (Object.entries(data.result.user_models).length === 0
          && Object.entries(data.result.group_models).length === 0
          && Object.entries(data.result.system_models).length === 0) {
          return "No available model found.";
        } else {
          // For adding star to current store
          const currentModel = getSetting("model");
          setCurrentModel(currentModel);

          // User models
          if (data.result.user_models && Object.entries(data.result.user_models).length > 0) {
            let models = [];
            Object.entries(data.result.user_models).forEach(([key, value]) => {
              models.push(value.name);
            });
            setUserModels(models);
          }

          // Group models
          if (data.result.group_models && Object.entries(data.result.group_models).length > 0) {
            let models = [];
            Object.entries(data.result.group_models).forEach(([key, value]) => {
              models.push(value.name);
            });
            setGroupModels(models);
          }

          // System models
          if (data.result.system_models && Object.entries(data.result.system_models).length > 0) {
            let models = [];
            Object.entries(data.result.system_models).forEach(([key, value]) => {
              models.push(value.name);
            });
            setSystemModels(models);
          }

          // Ollama models
          if (await pingOllamaAPI()) {
            const ollamaModelList = await listOllamaModels();
            if (ollamaModelList && ollamaModelList.length > 0) {
              let models = [];
              ollamaModelList.forEach((model) => {
                models.push(model.name);
              });
              setOllamaModels(models);
            }
          }
        }
      } catch (error) {
        console.error(error);
      }
    }

    // Data resources
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
          if (getSetting("user")) {
            if (data.result.user_roles && Object.entries(data.result.user_roles).length > 0) {
              let roles = [];
              Object.entries(data.result.user_roles).forEach(([key, value]) => {
                roles.push(value.role);
              });
              setUserRoles(roles);
            }
          }

          if (getSetting("role")) {
            const currentRole = getSetting("role");
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
      const enabledFunctions = (getSetting("functions")).split(",");
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
          const currentNode = getSetting("node");
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

    if (getSetting("user")) {
      loadUserSettings();
    } else {
      setLoading(false);
    }

    // Set initial language
    setLang(getSetting("lang").trim());
  }, []);

  const handleSetUserRoles = useCallback((name) => async () => {
    if (getSetting("role") === name) {
      setSetting("role", "");
    } else {
      setSetting("role", name);
    }

    // Update state
    const currentRole = getSetting("role");
    setCurrentRole(currentRole);

    console.log("Settings updated." + " (" + getTime() + ")");
    setMessage(t("Settings updated.") + " (" + getTime() + ")");
  }, []);

  const handleSetSystemFunctions = useCallback((name) => async () => {
    const currentFunctions = (getSetting("functions")).split(",").filter(fn => fn);

    if (currentFunctions.includes(name)) {
      // Remove function
      const index = currentFunctions.indexOf(name);
      currentFunctions.splice(index, 1);
      setSetting("functions", currentFunctions.join(","));
    } else {
      // Add function
      currentFunctions.push(name)
      setSetting("functions", currentFunctions.join(","));
    }

    // Update user setting (remote)
    if (getSetting("user")) {
      updateUserSetting("functions", currentFunctions.join(","));
    }

    // Update state
    const enabledFunctions = (getSetting("functions")).split(",");
    setEnabledFunctions(enabledFunctions);

    console.log("Settings updated." + " (" + getTime() + ")");
    setMessage(t("Settings updated.") + " (" + getTime() + ")");
  }, []);

  const handleSetMcpFunctions = useCallback((name) => async () => {
    const currentFunctions = (getSetting("functions")).split(",").filter(fn => fn);

    if (currentFunctions.includes(name)) {
      // Remove function
      console.log("Removing function: ", name);
      const index = currentFunctions.indexOf(name);
      currentFunctions.splice(index, 1);
      setSetting("functions", currentFunctions.join(","));
    } else {
      // Add function
      console.log("Adding function: ", name);
      currentFunctions.push(name)
      setSetting("functions", currentFunctions.join(","));
    }

    // Update user setting (remote)
    if (getSetting("user")) {
      updateUserSetting("functions", currentFunctions.join(","));
    }

    // Update state
    const enabledFunctions = (getSetting("functions")).split(",");
    setEnabledFunctions(enabledFunctions);

    console.log("Settings updated." + " (" + getTime() + ")");
    setMessage(t("Settings updated.") + " (" + getTime() + ")");
  }, []);

  const handleSetUserModels = useCallback((name) => async () => {
    try {
      const response = await fetch("/api/model/" + name, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      // Model info
      const modelInfo = data.result;
      if (!modelInfo) {
        console.error("Model not found");
        return;
      }

      // Set model
      globalThis.model = modelInfo.model;
      globalThis.baseUrl = modelInfo.base_url;
      setSetting("model", modelInfo.model);
      setSetting("baseUrl", modelInfo.base_url);

      // Update state
      const currentModel = getSetting("model");
      setCurrentModel(currentModel);

      console.log("Settings updated." + " (" + getTime() + ")");
      setMessage(t("Settings updated.") + " (" + getTime() + ")");
    } catch (error) {
      console.error(error);
      return;
    }
  }, []);

  const handleSetGroupModels = useCallback((name) => async () => {
    try {
      const response = await fetch("/api/model/" + name, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      // Model info
      const modelInfo = data.result;
      if (!modelInfo) {
        console.error("Model not found");
        return;
      }

      // Set model
      globalThis.model = modelInfo.model;
      globalThis.baseUrl = modelInfo.base_url;
      setSetting("model", modelInfo.model);
      setSetting("baseUrl", modelInfo.base_url);

      // Update state
      const currentModel = getSetting("model");
      setCurrentModel(currentModel);

      console.log("Settings updated." + " (" + getTime() + ")");
      setMessage(t("Settings updated.") + " (" + getTime() + ")");
    } catch (error) {
      console.error(error);
      return;
    }
  }, []);

  const handleSetSystemModels = useCallback((name) => async () => {
    try {
      const response = await fetch("/api/model/" + name, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      // Model info
      const modelInfo = data.result;
      if (!modelInfo) {
        console.error("Model not found");
        return;
      }

      // Set model
      globalThis.model = modelInfo.model;
      globalThis.baseUrl = modelInfo.base_url;
      setSetting("model", modelInfo.model);
      setSetting("baseUrl", modelInfo.base_url);

      // Update state
      const currentModel = getSetting("model");
      setCurrentModel(currentModel);

      console.log("Settings updated." + " (" + getTime() + ")");
      setMessage(t("Settings updated.") + " (" + getTime() + ")");
    } catch (error) {
      console.error(error);
      return;
    }
  }, []);

  const handleSetOllamaModels = useCallback((name) => async () => {
    // Check local Ollama models
    if (await pingOllamaAPI()) {
      const ollamModels = await listOllamaModels();
      const ollamModelInfo = ollamModels.find((m) => m.name === name);
      if (ollamModelInfo) {
        // Set model to session storage
        globalThis.model = name;
        globalThis.baseUrl = ollamModelInfo.base_url;
        setSetting("model", name);
        setSetting("baseUrl", ollamModelInfo.base_url);

        // Update state
        const currentModel = getSetting("model");
        setCurrentModel(currentModel);

        console.log("Settings updated." + " (" + getTime() + ")");
        setMessage(t("Settings updated.") + " (" + getTime() + ")");
      } else {
        console.error("Ollama model not found.");
      }
    } else {
      console.error("Cannot connect to Ollama server.");
    }
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
    setMessage(t("Settings updated.") + " (" + getTime() + ")");
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
    setMessage(t("Settings updated.") + " (" + getTime() + ")");
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
    setMessage(t("Settings updated.") + " (" + getTime() + ")");
  }, []);

  const handleSetUserNodes = useCallback((name) => async () => {
    if (getSetting("node") === name) {
      setSetting("node", "");
    } else {
      setSetting("node", name);
    }

    // Update state
    const currentNode = getSetting("node");
    setActiveNode(currentNode);

    console.log("Settings updated." + " (" + getTime() + ")");
    setMessage(t("Settings updated.") + " (" + getTime() + ")");
  }, []);

  const handleSetGroupNodes = useCallback((name) => async () => {
    if (getSetting("node") === name) {
      setSetting("node", "");
    } else {
      setSetting("node", name);
    }

    // Update state
    const currentNode = getSetting("node");
    setActiveNode(currentNode);

    console.log("Settings updated." + " (" + getTime() + ")");
    setMessage(t("Settings updated.") + " (" + getTime() + ")");
  }, []);

  const handleSetSystemNodes = useCallback((name) => async () => {
    if (getSetting("node") === name) {
      setSetting("node", "");
    } else {
      setSetting("node", name);
    }

    // Update state
    const currentNode = getSetting("node");
    setActiveNode(currentNode);

    console.log("Settings updated." + " (" + getTime() + ")");
    setMessage(t("Settings updated.") + " (" + getTime() + ")");
  }, []);

  const handleSetTheme = useCallback((theme) => async () => {
    // Set theme
    setTheme(theme);
    setSetting("theme", theme);

    // Update user settings
    if (user) {
      await updateUserSetting("theme", theme);
    }

    console.log("Settings updated." + " (" + getTime() + ")");
    setMessage(t("Settings updated.") + " (" + getTime() + ")");
  }, [user, t]);

  const handleSetLanguage = useCallback((newLang) => async () => {
    // If new lang is current lang, unset
    let i18nLang;
    if (newLang === getSetting("lang")) {
      setLang(null);
      setSetting("lang", "");

      // Use the browser language to set the i18nLang
      const browserLang = navigator.language || navigator.userLanguage;
      console.log("Use browser language for UI: " + browserLang);

      // Set i18n language
      i18nLang = browserLang.split("-")[0];
      console.log("Language reset.");
    } else {
      // Set language
      const lang_ = newLang.trim()
      setLang(lang_);
      setSetting("lang", lang_);

      // Set i18n language
      i18nLang = lang_.split("-")[0];
      console.log("Language: " + lang_ + ", i18n: " + i18n.language);
    }

    i18n.changeLanguage(i18nLang)
    .then(async () => {
      console.log('Language test:', tt("hello"));
      setRtl(i18nLang === "ar");
      // Update user settings
      if (user) {
        await updateUserSetting("lang", newLang);
      }

      console.log("Settings updated." + " (" + getTime() + ")");
      setMessage(t("Settings updated.") + " (" + getTime() + ")");
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
      {userModels && userModels.length > 0 && <div>
        <div className="mt-3">- {t("User Models")}</div>
        <div className="flex flex-wrap items-center mt-2">
          {userModels.map((i) => (
            <button
              className={`ml-2 mb-1 ${currentModel === i ? 'selected' : ''}`}
              key={i}
              onClick={handleSetUserModels(i)}
            >
              {i}
            </button>
          ))}
        </div>
      </div>}
      {groupModels && groupModels.length > 0 && <div>
        <div className="mt-3">- {t("User Group Models")}</div>
        <div className="flex flex-wrap items-center mt-2">
          {groupModels.map((i) => (
            <button
              className={`ml-2 mb-1 ${currentModel === i ? 'selected' : ''}`}
              key={i}
              onClick={handleSetGroupModels(i)}
            >
              {i}
            </button>
          ))}
        </div>
      </div>}
      {systemModels && systemModels.length > 0 && <div>
        <div className="mt-3">- {t("System Models")}</div>
        <div className="flex flex-wrap items-center mt-2">
          {systemModels.map((i) => (
            <button
              className={`ml-2 mb-1 ${currentModel === i ? 'selected' : ''}`}
              key={i}
              onClick={handleSetSystemModels(i)}
            >
              {i}
            </button>
          ))}
        </div>
      </div>}
      {ollamaModels && ollamaModels.length > 0 && <div>
        <div className="mt-3">- {t("Ollama Models")}</div>
        <div className="flex flex-wrap items-center mt-2">
          {ollamaModels.map((i) => (
            <button
              className={`ml-2 mb-1 ${currentModel === i ? 'selected' : ''}`}
              key={i}
              onClick={handleSetOllamaModels(i)}
            >
              {i}
            </button>
          ))}
        </div>
      </div>}
      {userRoles && userRoles.length > 0 && <div>
        <div className="mt-3">- {t("User Roles")}</div>
        <div className="flex flex-wrap items-center mt-2">
          {userRoles.map((i) => (
            <button
              className={`ml-2 mb-1 ${currentRole === i ? 'selected' : ''}`}
              key={i}
              onClick={handleSetUserRoles(i)}
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
              className={`ml-2 mb-1 ${enabledFunctions.includes(i) ? 'selected' : ''}`}
              key={i}
              onClick={handleSetSystemFunctions(i)}
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
              className={`ml-2 mb-1 ${enabledFunctions.includes(i) ? 'selected' : ''}`}
              key={i}
              onClick={handleSetMcpFunctions(i)}
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
              className={`ml-2 mb-1 ${activeStores.includes(i) ? 'selected' : ''}`}
              key={i}
              onClick={handleSetUserStores(i)}
            >
              {i}
            </button>
          ))}
        </div>
      </div>}
      {groupStores && groupStores.length > 0 && <div>
        <div className="mt-3">- {t("User Group Stores")}</div>
        <div className="flex flex-wrap items-center mt-2">
          {groupStores.map((i) => (
            <button
              className={`ml-2 mb-1 ${activeStores.includes(i) ? 'selected' : ''}`}
              key={i}
              onClick={handleSetGroupStores(i)}
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
              className={`ml-2 mb-1 ${activeStores.includes(i) ? 'selected' : ''}`}
              key={i}
              onClick={handleSetSystemStores(i)}
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
              className={`ml-2 mb-1 ${activeNode === i ? 'selected' : ''}`}
              key={i}
              onClick={handleSetUserNodes(i)}
            >
              {i}
            </button>
          ))}
        </div>
      </div>}
      {groupNodes && groupNodes.length > 0 && <div>
        <div className="mt-3">- {t("User Group Nodes")}</div>
        <div className="flex flex-wrap items-center mt-2">
          {groupNodes.map((i) => (
            <button
              className={`ml-2 mb-1 ${activeNode === i ? 'selected' : ''}`}
              key={i}
              onClick={handleSetGroupNodes(i)}
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
              className={`ml-2 mb-1 ${currentRole === i ? 'selected' : ''}`}
              key={i}
              onClick={handleSetSystemNodes(i)}
            >
              {i}
            </button>
          ))}
        </div>
      </div>}
      {<div>
        <div className="mt-3">- {t("Theme")}</div>
        <div className="flex flex-wrap items-center mt-2">
          <button
            className={`ml-2 mb-1 ${"light" == getSetting("theme") ? 'selected' : ''}`}
            onClick={handleSetTheme("light")}
          >
            light
          </button>
          <button
            className={`ml-2 mb-1 ${"dark" == getSetting("theme") ? 'selected' : ''}`}
            onClick={handleSetTheme("dark")}
          >
            dark
          </button>
          <button
            className={`ml-2 mb-1 ${"terminal" == getSetting("theme") ? 'selected' : ''}`}
            onClick={handleSetTheme("terminal")}
          >
            terminal
          </button>
        </div>
      </div>}
      {languages && <div>
        <div className="mt-3">- {t("Language")}</div>
        <div className="flex flex-wrap items-center mt-2">
          {languages.map((l) => (
            <button
              className={`ml-2 mb-1 ${l.language_code == lang ? 'selected' : ''}`}
              key={l.language_code}
              onClick={handleSetLanguage(l.language_code)}
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
