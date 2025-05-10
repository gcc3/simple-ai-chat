import Head from "next/head";
import { useState, useEffect, useRef } from "react";
import defaultStyles from "../styles/pages/index.module.css";
import fullscreenStyles from "../styles/pages/index.fullscreen.module.css";
import fullscreenSplitStyles from "../styles/pages/index.fullscreen.split.module.css";
import command, { getHistoryCommand, getHistoryCommandIndex, pushCommandHistory } from "command.js";
import { speak, trySpeak } from "utils/speakUtils.js";
import { setTheme } from "utils/themeUtils.js";
import { setRtl } from "utils/rtlUtils.js";
import { markdownFormatter } from "utils/markdownUtils.js";
import { passwordFormatter, maskPassword, isCommandMusked } from "utils/passwordUtils";
import UserDataPrivacy from "components/UserDataPrivacy";
import Usage from "components/Usage";
import Subscription from "components/Subscription";
import Documentation from "components/Documentation";
import Copyrights from "components/Copyrights";
import Settings from "components/Settings";
import hljs from 'highlight.js';
import { generateFileUrl } from "utils/awsUtils";
import { initializeSessionMemory, setSession, setTime } from "utils/sessionUtils";
import 'katex/dist/katex.min.css';
import { asciiframe } from "utils/donutUtils";
import { checkUserAgent } from "utils/userAgentUtils";
import { getLangCodes } from "utils/langUtils";
import { useTranslation } from 'react-i18next';
import { simulateKeyPress } from "utils/keyboardUtils";
import { getAutoCompleteOptions } from "utils/autocompleteUtils";
import { sleep } from "utils/sleepUtils";
import { loadConfig } from "utils/configUtils";
import OpenAI from "openai";
import { Readable } from "stream";
import { fetchUserInfo, clearUserWebStorage, setUserWebStorage, updateUserSetting } from "utils/userUtils";
import { pingOllamaAPI, listOllamaModels } from "utils/ollamaUtils";
import { useUI } from '../contexts/UIContext';
import { initializeSettings } from "utils/settingsUtils";
import PreviewImage from "../components/ui/PreviewImage.jsx";
import { callMcpTool, listMcpFunctions, pingMcpServer } from "utils/mcpUtils";
import { getTools, getMcpTools } from "../function";
import { isUrl } from "utils/urlUtils";
import { TYPE } from '../constants.js';
import { getHistorySession, getSessionLog } from "utils/sessionUtils";
import { toDataUri } from "utils/base64Utils";
import { getSetting, setSetting } from "../utils/settingsUtils.js";


// Status control
const STATES = { IDLE: 0, DOING: 1 };
globalThis.STATE = STATES.IDLE;  // a global state

// Front or back display
const DISPLAY = { FRONT: 0, BACK: 1 };

// Back display content
const CONTENT = {
  DOCUMENTATION: 0,
  USAGE: 1,
  SUBSCRIPTION: 2,
  PRIVACY: 3,
};

// Mutation observer
// will setup in useEffect
// For input change can handle by onChange
globalThis.outputMutationObserver = null;

// Global raw input/output buffer
globalThis.rawInput = "";
globalThis.rawOutput = "";
globalThis.rawPlaceholder = "";

// Initial placeholder
globalThis.initPlaceholder = "";

// Donut interval id
let dunutIntervalId = null;
const clearDonutInterval = () => {
  if (dunutIntervalId) {
    clearInterval(dunutIntervalId);
    dunutIntervalId = null;
  }
}

export default function Home() { 
  const { fullscreen, setFullscreen, enter, setEnter } = useUI();

  // States
  const [placeholder, setPlaceholder] = useState("");
  const [waiting, setWaiting] = useState("");
  const [querying, setQuerying] = useState("Querying...");
  const [generating, setGenerating] = useState("Generating...");
  const [searching, setSearching] = useState("Searching...");
  const [info, setInfo] = useState();
  const [stats, setStats] = useState();
  const [evaluation, setEvaluation] = useState();
  const [display, setDisplay] = useState(DISPLAY.FRONT);
  const [content, setContent] = useState(CONTENT.DOCUMENTATION);
  const [subscriptionDisplay, setSubscriptionDisplay] = useState(false);
  const [usageDisplay, setUsageDisplay] = useState(false);
  const [outputImages, setOutputImages] = useState([]);
  const [minimalist, setMinimalist] = useState(false);

  // Refs
  const elInputRef = useRef(null);
  const elOutputRef = useRef(null);
  const elWrapperRef = useRef(null);

  // i18n
  const { t, i18n } = useTranslation();
  const { t: tt } = useTranslation("translation");

  // Toggle display
  const toggleDisplay = () => {
    setDisplay(display === DISPLAY.FRONT ? DISPLAY.BACK : DISPLAY.FRONT);
  };

  // Print output
  const printOutput = (text, ignoreFormatter=true, append=false) => {
    const elOutput = elOutputRef.current;
    if (elOutput) {
      if (ignoreFormatter) {
        // Temproary stop observing
        // For some output, we don't want to format it
        globalThis.outputMutationObserver.disconnect();
      }

      // Print the output
      const textHtml = text.replaceAll(/&/g, "&amp;")
                           .replaceAll(/</g, "&lt;").replace(/>/g, "&gt;")
                           .replaceAll(/"/g, "&quot;").replace(/'/g, "&#039;")
                           .replaceAll("###RETURN###", '<br>');
      const textRaw = text.replaceAll("###RETURN###", '\n');

      if (append) {
        elOutput.innerHTML += textHtml;
        globalThis.rawOutput += textRaw;
      } else {
        elOutput.innerHTML = textHtml;
        globalThis.rawOutput = textRaw;
      }

      if (ignoreFormatter) {
        // Resume observing
        globalThis.outputMutationObserver.observe((elOutput), { 
          childList: true, 
          attributes: false, 
          subtree: true,
          characterData: true
        });
      }
    }
  };

  const buildImageDescriptor = (src) =>
    new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () =>
        resolve({
          src,
          alt: "",
          width: img.naturalWidth,
          height: img.naturalHeight,
          blurDataURL: src,
        });
      img.onerror = () =>
        // Fallback to “0 × 0” if loading fails
        resolve({ src, alt: "", width: 0, height: 0, blurDataURL: src });
      img.src = src;
    });

  // Print image output
  const printImage = async (image) => {
    try {
      const src = isUrl(image) ? image : toDataUri(image);
      const descriptor = await buildImageDescriptor(src);
      setOutputImages((current) => [...current, descriptor]);
      console.log(
        `Print ${isUrl(image) ? "URL" : "Base64"} image: ${src.slice(0, 50)}…`
      );
    } catch (e) {
      console.error("printImage failed:", e);
    }
  };

  // Print video output (support: YouTube)
  const printVideo = (videoId, targetRef, beforeOrAfter = "after") => {
    if (targetRef.current) {
      // Create a wrapper div to hold the iframe and control its aspect ratio
      const videoDiv = document.createElement('div');
      videoDiv.className = "mb-5 video-preview";
      
      // Here the padding-top is 56.25%, which is the result of (9 / 16 * 100).
      videoDiv.style.position = 'relative';
      videoDiv.style.paddingTop = '56.25%'; // Aspect ratio for 16:9
      
      // Create the iframe
      const iframe = document.createElement('iframe');
      iframe.className = "";
      iframe.style.position = 'absolute';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.left = '0';
      iframe.style.top = '0';
      iframe.style.outline = 'none';
      
      // Extract the YouTube video ID from the URL
      iframe.src = `https://www.youtube.com/embed/${videoId}`; // The URL for the YouTube video embed
      iframe.title = "YouTube video player";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      
      // Append the iframe to the wrapper div
      videoDiv.appendChild(iframe);
      
      // Append the videoWrapper to the div with the ref
      const elWrapperRef = targetRef.current.parentNode; // Assuming the parent node is where you want to insert the video
      if (beforeOrAfter === "after") {
        elWrapperRef.appendChild(videoDiv);
      } else if (beforeOrAfter === "before") {
        elWrapperRef.insertBefore(videoDiv, targetRef.current);
      }
    } else {
      console.error("Target ref is null.");
    }
  };

  // Print session log
  const printSessionLog = async function(log) {
    setTime(log["time"]);
    console.log("Session log:", JSON.stringify(log).slice(0, 500) + " ...");

    // Print the log
    clearPreviewImages();
    const resetInfo = () => {
      setInfo();
      setStats();
      setEvaluation();
    }
    resetInfo();
    clearOutput(true);

    // Print input
    globalThis.rawPlaceholder = log["input"].trim();
    reAdjustPlaceholder();

    // Print output
    printOutput(log["output"].trim());
    globalThis.rawOutput = log["output"].trim();

    // Print images
    if (log["images"]) {
      const images = JSON.parse(log["images"]);
      images.map((image_url) => {
        printImage(image_url);
      });
    }

    !minimalist && setInfo((
      <div>
        model: {log && log["model"].toLowerCase()}<br></br>
      </div>
    ));
    markdownFormatter(elOutputRef.current);
    hljs.highlightAll();
  }

  // Clear preview images
  const clearPreviewImages = () => {
    if (elWrapperRef.current) {
      const imageDivs = elWrapperRef.current.getElementsByClassName("image-preview");
      while (imageDivs.length > 0) {
        imageDivs[0].remove();
      }
    }
  }

  // Clear preview videos
  const clearPreviewVideos = () => {
    if (elWrapperRef.current) {
      const imageDivs = elWrapperRef.current.getElementsByClassName("video-preview");
      while (imageDivs.length > 0) {
        imageDivs[0].remove();
      }
    }
  }

  // Clear output
  const clearOutput = (all = false) => {
    printOutput("");
    if (all) {
      clearPreviewImages();
      clearPreviewVideos();
      setInfo();
      setStats();
      setEvaluation();
    }
  };

  // Get output
  const getOutput = () => {
    return elOutputRef.current.innerHTML;
  };

  // Set input
  const setInput = (text) => {
    elInputRef.current.value = text;
    globalThis.rawInput = text;
  }

  // Clear input
  const clearInput = () => {
    setInput("");
    reAdjustInputHeight();
    reAdjustPlaceholder();
  }

  // Clear hash tag
  const removeHashTag = () => {
    history.pushState(null, null, ' ' + window.location.href.split('#')[0]);
  };

  // Load script
  function loadScript(src, integrity, crossorigin) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.integrity = integrity;
      script.crossOrigin = crossorigin;
      script.onload = () => resolve(script);
      script.onerror = () => reject(new Error(`Script load error for ${src}`));
      document.head.appendChild(script);
    });
  }

  // Initializing
  useEffect(() => { 
    initializeSettings();
    initializeSessionMemory();

    // System and user configurations
    const getSystemInfo = async () => {
      // User info
      if (getSetting("user") !== null) {
        console.log("Fetching user info...");
        const user = await fetchUserInfo();
        if (user) {
          console.log("User info - settings: ", JSON.stringify(user.settings, null, 2));
      
          // Refresh local user data
          setUserWebStorage(user);
        } else {
          console.warn("User not found or authentication failed, clearing local user data...");
      
          // Clear local user data
          if (getSetting("user")) {
            clearUserWebStorage();
      
            // Clear auth cookie
            document.cookie = "auth=; Path=/;";
            console.log("User authentication failed, local user data cleared.");
          }
        }
      } else {
        console.log("User not logged in.");
      }
      
      // System info
      console.log("Fetching system info...");
      const systemInfoResponse = await fetch('/api/system/info');
      const systemInfo = (await systemInfoResponse.json()).result;
      console.log("System info:", JSON.stringify(systemInfo, null, 2));

      if (systemInfo.init_placeholder) {
        globalThis.initPlaceholder = systemInfo.init_placeholder;
        globalThis.rawPlaceholder = systemInfo.init_placeholder;
        setPlaceholder({ text: systemInfo.init_placeholder, height: null });  // Set placeholder text
      }
      if (systemInfo.enter) {
        dispatch(toggleEnterChange(systemInfo.enter));
      }
      if (systemInfo.waiting) setWaiting(systemInfo.waiting);  // Set waiting text
      if (systemInfo.querying) setQuerying(systemInfo.querying);  // Set querying text
      if (systemInfo.generating) setGenerating(systemInfo.generating);  // Set generating text
      if (systemInfo.searching) setSearching(systemInfo.searching);  // Set searching text
      if (systemInfo.use_payment) {
        // Set use payment
        setSubscriptionDisplay(true);
        setUsageDisplay(true);
      }
      if (systemInfo.minimalist) setMinimalist(true);  // Set minimalist

      // Set welcome message
      if (systemInfo.welcome_message && !getSetting("user")) {
        printOutput(systemInfo.welcome_message);
        markdownFormatter(elOutputRef.current);
      }

      // Set defaults
      if (!getSetting("functions")) setSetting("functions", systemInfo.default_functions);  // default functions
      if (!getSetting("role")) setSetting("role", systemInfo.default_role);    // default role
      if (!getSetting("stores")) setSetting("stores", systemInfo.default_stores);  // default stores
      if (!getSetting("node")) setSetting("node", systemInfo.default_node);    // default node

      // Set model
      // Auto setup the base URL too
      globalThis.model = systemInfo.model;
      globalThis.baseUrl = systemInfo.base_url;
      if (!getSetting("model")) {
        setSetting("model", systemInfo.model);  // default model
        setSetting("baseUrl", systemInfo.base_url);  // default base url
      } else {
        const modelName = getSetting("model");
        const modelInfoResponse = await fetch('/api/model/' + modelName);
        const modelInfo = (await modelInfoResponse.json()).result;
        if (modelInfo) {
          // Found remote model
          console.log("Set baseUrl: " + modelInfo.base_url);
          setSetting("baseUrl", modelInfo.base_url);
        } else {
          if (await pingOllamaAPI()) {
            const ollamaModels = await listOllamaModels();
            const ollamaModel = ollamaModels.find(o => o.name === modelName);
            if (ollamaModel) {
              // Found ollama model
              console.log("Set baseUrl: " + ollamaModel.base_url);
              setSetting("baseUrl", ollamaModel.base_url);
            } else {
              // Both remote and local model not found, set baseUrl to empty
              console.warn("Model `" + modelName + "` not found, set baseUrl to empty.");
              setSetting("baseUrl", "");
            }
          }
        }
      }
    }
    getSystemInfo();

    // Set styles and themes
    const dispatchFullscreen = (mode, force = false) => {
      const currentMode = getSetting('fullscreen');
      if (currentMode.includes("force") && !force) {
        // If current mode is forced, do not change it
        return;
      }

      setSetting('fullscreen', mode + (force ? " force" : ""));
      setFullscreen(mode);

      if (mode === "split") {
        // fullscreen split mode  use ⌃enter
        setEnter("⌃enter");
      } else {
        // fullscreen default mode use enter
        setEnter("enter");
      }
      
      // User logged in
      // If mode is forced, do not update user setting
      if (getSetting("user") && !force) {
        updateUserSetting("fullscreen", mode);
      }
      reAdjustInputHeight(mode); // Adjust input height
      reAdjustPlaceholder(mode);  // Adjust placeholder
    }

    // Dispatch fullscreen
    const userAgentInfo = checkUserAgent();
    console.log("User agent:", userAgentInfo.userAgent);
    if (userAgentInfo.isIPhone || userAgentInfo.isAndroid) {
      console.log("Mobile device (iPhone/Android) detected.");

      // Mobile device
      if (window.innerWidth < 768) {
        // Don't use fullscreen mode if the screen is small
        dispatchFullscreen("off", true);
        console.log("Force fullscreen off: mobile device width < 768.");
      }
    } else {
      dispatchFullscreen(getSetting("fullscreen"));
    }

    // Lanuage
    let lang = "en-US";
    if (getSetting("lang").includes("force")) {
      // Use forced language
      // If user set language, it will be forced
      lang = getSetting("lang").replace("force", "").trim();
    } else {
      // Use browser language
      const browserLang = navigator.language || navigator.userLanguage;
      if (getLangCodes().includes(browserLang)) {
        lang = browserLang;
        setSetting("lang", lang);  // Not `force`
      } else {
        lang = getSetting("lang");
      }
    }

    const i18nLang = lang.split("-")[0];  // i18n language, e.g. en for en-US
    if (i18n.language !== i18nLang) {
      i18n.changeLanguage(i18nLang)
        .then(() => {
          console.log("Language: " + lang + ", i18n: " + i18n.language);
          console.log('Language test:', tt("hello"));
          setRtl(i18nLang === "ar");
        });
    } else {
      setRtl(i18nLang === "ar");
    }
    
    // Theme
    setTheme(getSetting("theme"))
    hljs.highlightAll();  // highlight.js

    // Handle window resize
    const handleResize = () => {
      // Readjust UI
      reAdjustInputHeight(getSetting("fullscreen"));
      reAdjustPlaceholder(getSetting("fullscreen"));
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    // Attach to session
    const attachSession = (session) => {
      setSession(session.id);
      setTime(session.id);

      // Truncate input and output characters
      session.logs.map(item => {
        if (item.input.length > 150) item.input = item.input.substring(0, 150) + " ...";
        if (item.output.length > 150) item.output = item.output.substring(0, 150) + " ...";
        return item;
      });

      printOutput(`Session (id:${session.id}) attached. Use \`→\` and \`←\` (or \`j\` and \`k\`) to navigate between session logs (length:${session.length}).\n\nPreview:\n` + JSON.stringify(session.logs, null, 2));
    }

    // Handle global shortcut keys
    const handleKeyDown = (event) => {
      switch (event.key) {
        case "Escape":
          console.log("Shortcut: ESC");

          if (document.activeElement.id === "input") {
            // If there is input, use ESC to clear input
            const elInput = elInputRef.current;
            if (elInput !== null) {
              if (elInput.value && elInput.value.length > 0) {
                event.preventDefault();
                clearInput("");
              } else {
                // ESC to unfocus input
                event.preventDefault();
                elInput.blur();
              }
            }
          }
          break;
    
        case "Tab":  // TAB to focus on input
          console.log("Shortcut: Tab");

          if (document.activeElement.id !== "input") {
            const elInput = elInputRef.current;
            if (elInput !== null) {
              event.preventDefault();
              elInput.focus();
            }
          }
          break;
    
        case "/":  // Press / to focus on input
          console.log("Shortcut: /");

          if (document.activeElement.id !== "input") {
            const elInput = elInputRef.current;
            if (elInput !== null) {
              event.preventDefault();
              elInput.focus();
            }
          }
          break;

        case "c":  // stop generating
          if (event.ctrlKey) {
            console.log("Shortcut: ⌃c");

            if (globalThis.STATE === STATES.DOING) {
              event.preventDefault();
              command(":stop");

              // Send `stop` command no matter generating or not
              console.log("Sending `stop` command...");
            } else {
              // Stop speaking
              window.speechSynthesis.cancel();
            }
          }
          break;

        case "r":  // clear output and reset session
          if (event.ctrlKey && !event.shiftKey) {
            console.log("Shortcut: ⌃r");

            if (globalThis.STATE === STATES.IDLE) {
              event.preventDefault();

              // Same as :clear
              // Clear all input and output, pleaceholder, previews
              clearInput();
              clearOutput();
              globalThis.rawPlaceholder = globalThis.initPlaceholder;
              setPlaceholder({ text: globalThis.rawPlaceholder, height: null });
              clearPreviewImages();
              clearPreviewVideos();
              setInfo();
              setStats();
              setEvaluation();
              
              // Focus on input
              const elInput = elInputRef.current;
              elInput.focus();

              console.log("Sending `clear` command...");
              command(":clear");
            }
          }

          if (event.ctrlKey && event.shiftKey) {
            console.log("Shortcut: ⇧⌃r");

            if (globalThis.STATE === STATES.IDLE) {
              event.preventDefault();

              console.log("Sending `reset` command...");
              command(":reset");
            }
          }
          break;

        case "F11":  // fullscreen mode
          console.log("Shortcut: F11");
          event.preventDefault();

          // Triggle fullscreen split
          if (!getSetting("fullscreen").startsWith("default")) {
            dispatchFullscreen("default");
          } else {
            dispatchFullscreen("off");
          }

          console.log("Shortcut: F11");
          break;
        
        case "\\":
        case "|":  // fullscreen split mode
          if (event.ctrlKey) {
            console.log("Shortcut: ⌃|");
            event.preventDefault();

            // Triggle fullscreen split
            if (!getSetting("fullscreen").startsWith("split")) {
              dispatchFullscreen("split");
            } else {
              dispatchFullscreen("off");
            }
            
            console.log("Shortcut: ⌃|");
          }
          break;

        case "ArrowUp":
          // Command history (↑)
          if (globalThis.rawInput.startsWith(":") && !event.ctrlKey && !event.shiftKey && !event.altKey) {
            console.log("Shortcut: ↑");
            event.preventDefault();

            // Set input to previous command history
            const historyIndex = getHistoryCommandIndex();
            const command = getHistoryCommand(historyIndex + 1);
            if (command) {
              setInput(command);
              setSetting("historyIndex", historyIndex + 1);
              reAdjustInputHeight(getSetting("fullscreen"));
            }
          }

          // Navigation to previous session
          if ((document.activeElement.id !== "input" || elInputRef.current.value === "") && !event.ctrlKey && !event.shiftKey && !event.altKey) {
            console.log("Shortcut: ⌃↑");
            event.preventDefault();

            if (globalThis.STATE === STATES.IDLE) {
              if (!getSetting("user")) {
                console.error("User not logged in.");
                printOutput("Please log in to view session history.");
                return;
              }

              getHistorySession("prev", getSetting("session"))
                .then((session) => {
                  clearOutput(true);

                  if (!session) {
                    console.log("No previous session.");
                    printOutput("No previous session.");
                    setSession(-1);
                    return;
                  } else {
                    // Attach to it
                    attachSession(session);
                  }
                });
            } else {
              console.log("Aborted as generating.");
            }
          }
          break;

        case "h":
          // Navigation to previous session
          if (document.activeElement.id !== "input" && !event.ctrlKey && !event.shiftKey && !event.altKey) {
            event.preventDefault();
            console.log("Shortcut: h");

            if (globalThis.STATE === STATES.IDLE) {
              if (!getSetting("user")) {
                console.error("User not logged in.");
                printOutput("Please log in to view session history.");
                return;
              }

              getHistorySession("prev", getSetting("session"))
                .then((session) => {
                  clearOutput(true);

                  if (!session) {
                    console.log("No previous session.");
                    printOutput("No previous session.");
                    setSession(-1);
                    return;
                  } else {
                    // Attach to it
                    attachSession(session);
                  }
                });
            } else {
              console.log("Aborted as generating.");
            }
          }
          break;

        case "ArrowDown":
          // Command history (↓)
          if (globalThis.rawInput.startsWith(":") && !event.ctrlKey && !event.shiftKey && !event.altKey) {
            console.log("Shortcut: ↓");
            event.preventDefault();

            // Set input to previous command history
            const historyIndex = getHistoryCommandIndex();
            const command = getHistoryCommand(historyIndex - 1);
            if (command) {
              setInput(command);
              setSetting("historyIndex", historyIndex - 1);
              reAdjustInputHeight(getSetting("fullscreen"));
            } else {
              // Clear input
              setInput(":");
              setSetting("historyIndex", -1);
              reAdjustInputHeight(getSetting("fullscreen"));
            }
          }

          // Navigate to next session
          if ((document.activeElement.id !== "input" || elInputRef.current.value === "") && !event.ctrlKey && !event.shiftKey && !event.altKey) {
            console.log("Shortcut: ⌃↓");
            event.preventDefault();

            if (globalThis.STATE === STATES.IDLE) {
              if (!getSetting("user")) {
                console.error("User not logged in.");
                printOutput("Please log in to view session history.");
                return;
              }

              getHistorySession("next", getSetting("session"))
                .then((session) => {
                  clearOutput(true);

                  if (!session) {
                    console.log("No next session.");
                    printOutput("No next session.");
                    setSession(1);
                    return;
                  } else {
                    // Attach to it
                    attachSession(session);
                  }
                });
            } else {
              console.log("Aborted as generating.");
            }
          }
          break;

        case "l":
          // Navigate to next session
          if (document.activeElement.id !== "input" && !event.ctrlKey && !event.shiftKey && !event.altKey) {
            console.log("Shortcut: l");
            event.preventDefault();

            if (globalThis.STATE === STATES.IDLE) {
              if (!getSetting("user")) {
                console.error("User not logged in.");
                printOutput("Please log in to view session history.");
                return;
              }

              getHistorySession("next", getSetting("session"))
                .then((session) => {
                  clearOutput(true);

                  if (!session) {
                    console.log("No next session.");
                    printOutput("No next session.");
                    setSession(1);
                    return;
                  } else {
                    // Attach to it
                    attachSession(session);
                  }
                });
            } else {
              console.log("Aborted as generating.");
            }
          }
          break;

        case "ArrowLeft":
          if ((document.activeElement.id !== "input" || elInputRef.current.value === "") && !event.ctrlKey && !event.shiftKey && !event.altKey) {
            console.log("Shortcut: ←");
            event.preventDefault();

            // Print session log (previous)
            if (globalThis.STATE === STATES.IDLE) {
              getSessionLog("prev", getSetting("session"), getSetting("time"))
                .then((r) => {
                  if (!r.result || Object.entries(r.result).length === 0) {
                    console.log("No previous log.");
                    return;
                  } else {
                    const log = r.result["log"];
                    printSessionLog(log);
                  }
                });
            } else {
              console.log("Aborted as generating.");
            }
          }
          break;

        case "k":
          if (document.activeElement.id !== "input" && !event.ctrlKey && !event.shiftKey && !event.altKey) {
            console.log("Shortcut: k");
            event.preventDefault();

            // Print session log (previous)
            if (globalThis.STATE === STATES.IDLE) {
              getSessionLog("prev", getSetting("session"), getSetting("time"))
                .then((r) => {
                  if (!r.result || Object.entries(r.result).length === 0) {
                    console.log("No previous log.");
                    return;
                  } else {
                    const log = r.result["log"];
                    printSessionLog(log);
                  }
                });
            } else {
              console.log("Aborted as generating.");
            }
          }
          break;

        case "ArrowRight":
          if ((document.activeElement.id !== "input" || elInputRef.current.value === "") && !event.ctrlKey && !event.shiftKey && !event.altKey) {
            console.log("Shortcut: →");
            event.preventDefault();

            // Print session log (next)
            if (globalThis.STATE === STATES.IDLE) {
              getSessionLog("next", getSetting("session"), getSetting("time"))
                .then((r) => {
                  if (!r.result || Object.entries(r.result).length === 0) {
                    console.log("No next log.");
                    return;
                  } else {
                    const log = r.result["log"];
                    printSessionLog(log);
                  }
              });
            } else {
              console.log("Aborted as generating.");
            }
          }
          break;

        case "j":
          if (document.activeElement.id !== "input" && !event.ctrlKey && !event.shiftKey && !event.altKey) {
            console.log("Shortcut: j");
            event.preventDefault();

            // Print session log (next)
            if (globalThis.STATE === STATES.IDLE) {
              getSessionLog("next", getSetting("session"), getSetting("time"))
                .then((r) => {
                  if (!r.result || Object.entries(r.result).length === 0) {
                    console.log("No next log.");
                    return;
                  } else {
                    const log = r.result["log"];
                    printSessionLog(log);
                  }
              });
            } else {
              console.log("Aborted as generating.");
            }
          }
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);

    // Initialize global output mutation observer
    globalThis.outputMutationObserver = new MutationObserver(mutationsList => {
      for (let mutation of mutationsList) {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          // Formatter should only works when generating
          if (globalThis.STATE === STATES.DOING) {

            // Markdown formatter
            markdownFormatter(elOutputRef.current);
          }
        }
      }
    });

    // Start observing
    const observingConfig = { childList: true, attributes: false, subtree: true, characterData: true };
    globalThis.outputMutationObserver.observe(elOutputRef.current, observingConfig);

    // Handle hash tag auto removing
    window.addEventListener('hashchange', removeHashTag, false);

    // Readjust UI
    reAdjustInputHeight(getSetting("fullscreen"));
    reAdjustPlaceholder(getSetting("fullscreen"));

    // Load additional scripts
    // KaTeX copy module
    const src = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/copy-tex.min.js";
    const integrity = "sha384-ww/583aHhxWkz5DEVn6OKtNiIaLi2iBRNZXfJRiY1Ai7tnJ9UXpEsyvOITVpTl4A";
    const crossorigin = "anonymous";
    loadScript(src, integrity, crossorigin);

    // Touch event handler
    let xDown = null;
    let yDown = null;
    const handleTouchStart = (event) => {
      if (event.touches.length > 1) {
        event.preventDefault();
      }
      xDown = event.touches[0].clientX;
      yDown = event.touches[0].clientY;
    };
    const handleTouchMove = (event) => {
      if (!xDown || !yDown) {
        return;
      }
      var xUp = event.touches[0].clientX;
      var yUp = event.touches[0].clientY;
      var xDiff = xDown - xUp;
      var yDiff = yDown - yUp;
      if (Math.abs(xDiff) > Math.abs(yDiff)) {
        // Ignore if touch on code block
        const elTouch = event.target;
        if (elTouch.className && (elTouch.className.indexOf("hljs") !== -1 || elTouch.className.indexOf("code-block") !== -1)) {
          // If touch on code block, do nothing
          return;
        }
        if (elTouch.tagName && elTouch.tagName.toLowerCase() === "pre") {
          for (var i = 0; i < elTouch.childNodes.length; i++) {
            const child = elTouch.childNodes[i];
            if (child.className.indexOf("hljs") !== -1 || child.className.indexOf("code-block") !== -1) {
              // If touch on pre, contains code block, do nothing
              return;
            }
          }
        }

        // Ignore if select text
        if (window.getSelection().toString() !== "") {
          return;
        }

        if (xDiff > 0) {
          if (elTouch.className && (elTouch.className.indexOf("input") !== -1)) {
            // If touch on input and swipe left, simulate ESC.
            simulateKeyPress("esc", document.getElementById('input'));
            return;
          }

          // Left swipe show next log
          if (globalThis.STATE === STATES.IDLE) {
            getSessionLog("next", getSetting("session"), getSetting("time"))
              .then((r) => {
                if (!r.result || Object.entries(r.result).length === 0) {
                  console.log("No next log.");
                  return;
                } else {
                  const log = r.result["log"];
                  printSessionLog(log);
                }
            });
          } else {
            console.log("Aborted as generating.");
          }
        } else {
          if (elTouch.className && (elTouch.className.indexOf("input") !== -1)) {
            // If touch on input and swipe right, simulate TAB.
            simulateKeyPress("tab", document.getElementById('input'));
            return;
          }

          // Right swipe show previous log
          if (globalThis.STATE === STATES.IDLE) {
            getSessionLog("prev", getSetting("session"), getSetting("time"))
              .then((r) => {
                if (!r.result || Object.entries(r.result).length === 0) {
                  console.log("No previous log.");
                  return;
                } else {
                  const log = r.result["log"];
                  printSessionLog(log);
                }
              });
          } else {
            console.log("Aborted as generating.");
          }
        }
      } else {
        if (yDiff > 0) {
          // Up swipe
        } else {
          // Down swipe
        }
      }
      /* reset values */
      xDown = null;
      yDown = null;
    }
    const handleTouchEnd = (event) => {
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    }

    // Add touch event listener
    window.addEventListener('touchstart', handleTouchStart, false);
    window.addEventListener('touchmove', handleTouchMove, false);
    window.addEventListener('touchend', handleTouchEnd, false);

    // Cleanup
    return () => {
      // Remove event listener, this is necessary
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('hashchange', removeHashTag);

      // Remove touch event listener
      window.removeEventListener('touchstart', handleTouchStart, false);
      window.removeEventListener('touchmove', handleTouchMove, false);
      window.removeEventListener('touchend', handleTouchEnd, false);
    }
  }, []);

  // On submit input
  async function onSubmit(event) {
    if (globalThis.STATE === STATES.DOING) return;
    event.preventDefault();

    if (globalThis.rawInput === "") return;
    if (globalThis.rawInput.startsWith(":clear")) {
      // Same as ⌃r
      // Clear all input and output, pleaceholder, previews
      clearInput();
      clearOutput();
      globalThis.rawPlaceholder = globalThis.initPlaceholder;
      setPlaceholder({ text: globalThis.rawPlaceholder, height: null });
      clearPreviewImages();
      clearPreviewVideos();
      setInfo();
      setStats();
      setEvaluation();
      clearDonutInterval();

      // Focus on input
      const elInput = elInputRef.current;
      elInput.focus();
      command(":clear");
      return;
    }

    if (globalThis.rawInput.startsWith(":fullscreen") || globalThis.rawInput.startsWith(":theme")) {
      // Don't clean output and input
    } else {
      // Clear output and preview images
      clearOutput();
      clearPreviewImages();
      clearPreviewVideos();
    }

    // Clear info, stats, evaluation
    const resetInfo = () => {
      setInfo();
      setStats();
      setEvaluation();
    }

    // Pre-process the input
    // 1. Extract the files/images if there is any
    // files starts with +file[url] or +image[url] or +img[url]
    let image_urls = [], image_urls_encoded = [];
    let file_urls = [], file_urls_encoded = [];
    let matches = [...globalThis.rawInput.matchAll(/(\+file|\+image|\+img)\[([^\]]+)\]/g)];
    matches.forEach(match => {
      const block = match[1] + "[" + match[2] + "]";

      // Extract the URL
      const url = block.replace("+image[", "").replace("+img[", "").replace("+file[", "").replace("]", "");

      // Check if the URL is valid
      if (!url.startsWith("http")) {
        console.error("Invalid URL: " + url);
        printOutput("URL must start with http or https.");
        return;
      }

      // Add to the URL list
      if (block.startsWith("+image[") || block.startsWith("+img[")) {
        image_urls.push(url);
        image_urls_encoded.push(encodeURIComponent(url));
      } else if (block.startsWith("+file[")) {
        file_urls.push(url);
        file_urls_encoded.push(encodeURIComponent(url));
      }

      // Remove the block from the raw input
      globalThis.rawInput = globalThis.rawInput.replace(block, "");
    });
    if (image_urls.length > 0) {
      console.log("Images (input):\n" + image_urls.join("\n"));
    }
    if (file_urls.length > 0) {
      console.log("Files:\n" + file_urls.join("\n"));
    }

    // 2. Replace the full-width characters with half-width
    const input = globalThis.rawInput.trim().replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });

    // Check if the input is empty
    if (image_urls.length == 0 
     && file_urls.length == 0
     && input.trim().length == 0) {
      console.log("Input is empty.");
      return;
     }

    // Clear input and put it to placeholder
    const elInput = elInputRef.current;
    let placeholder = elInput.value;
    if (elInput.value.startsWith(":login") || elInput.value.startsWith(":user set pass") || elInput.value.startsWith(":user add") || elInput.value.startsWith(":user join")) {
      placeholder = maskPassword(placeholder);  // make sure the password is masked
    }
    globalThis.rawPlaceholder = placeholder;
    
    // Clear input
    clearInput();

    // Command input
    if (!minimalist && input.startsWith(":")) {
      const commandString = input.substring(1);
      if (commandString.length === 0) {
        printOutput("Invalid command.");
        return;
      }

      console.log("Command Input:\n" + (!isCommandMusked(commandString) ? input : "(musked)"));

      // Clear command
      if (commandString.startsWith("clear")) {
        clearOutput();
        resetInfo();
      }

      // A donut
      if (commandString.startsWith("donut")) {
        dunutIntervalId = setInterval(() => {
          asciiframe(elOutputRef.current);
        }, 50);
      } else {
        // Clear donut
        clearDonutInterval();
      }

      // If heavy command, show waiting text
      if (commandString.startsWith("generate")) {
        printOutput(generating);
      }

      // Get command result
      const files = file_urls.concat(image_urls);
      let commandResult = await command(input, files);

      // Use command return to bypass reset output and info
      if (commandResult && typeof commandResult === "string") {
        console.log("Command Output:\n" + commandResult);

        // Print images in command output
        let image_urls = [];
        let matches = [...commandResult.matchAll(/(\+file|\+image|\+img)\[([^\]]+)\]/g)];
        matches.forEach(match => {
          const block = match[1] + "[" + match[2] + "]";

          // Extract the URL
          const url = block.replace("+image[", "").replace("+img[", "").replace("]", "");

          // Check if the URL is valid
          if (!url.startsWith("http")) {
            console.error("Invalid URL: " + url);
            return;
          }

          // Add to the URL list
          if (block.startsWith("+image[") || block.startsWith("+img[")) {
            image_urls.push(url);
          }

          // Remove the block from the raw input
          commandResult = commandResult.replace(block, "");
        });
        if (image_urls.length > 0) {
          console.log("Images (command output):\n" + image_urls.join("\n"));
          image_urls.map((image_url) => {
            printImage(image_url);
          });
        }

        if (globalThis.rawInput.startsWith(":fullscree") || globalThis.rawInput.startsWith(":theme")) {
          // Do't print and clean info
        } else {
          // Print the output
          printOutput(commandResult.trim());
          resetInfo();
        }
      } else {
        console.log("Not command output.")
      }

      // For some command apply immediately
      if (commandString.startsWith("theme")) setTheme(getSetting("theme"));

      // Readjust UI
      reAdjustInputHeight(getSetting("fullscreen"));
      reAdjustPlaceholder(getSetting("fullscreen"));
      return;
    } else {
      // Clear donut
      clearInterval(dunutIntervalId);
    }

    // Check input is full-width
    if (!minimalist && input.startsWith("：")) {
      printOutput("Please use half-width colon (\":\").");
      return;
    }
    if (!minimalist && input.startsWith("！")) {
      printOutput("Please use half-width exclamation mark (\"!\").");
      return;
    }

    // Function CLI
    // Format: !function_name({ "arg1":"value1", "arg2":"value2", ... })
    // Example: !get_weather({ "location":"Tokyo" })
    // Support multple functions: !function_name({ "arg1":"value1", "arg2":"value2", ... }),!function_name({ "arg1":"value1", "arg2":"value2", ... })
    // Example: !get_weather({ "location":"Tokyo" }),!get_time({ "timezone":"America/Los_Angeles" })
    if (!minimalist && input.startsWith("!")) {
      const functionString = input.substring(1);
      const functions = functionString.split(",!");
      if (functionString.length === 0
       || !functionString.includes("(") || !functionString.includes(")")
       || functions.length === 0) {
        printOutput("Function invalid.");
        return;
      }

      if (!getSetting("user")) {
        printOutput("Please login.");
        return;
      }

      console.log("Function CLI: " + JSON.stringify(functions));
      pushCommandHistory(input);

      try {
        const response = await fetch("/api/function/exec", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            functions
          }),
        });

        const data = await response.json();
        if (response.status !== 200) {
          throw data.error || new Error(`Request failed with status ${response.status}`);
        }

        if (!data.success) {
          console.log("Function Error: " + data.error);
          printOutput(data.error);
          return;
        }

        const functionCliResults = data.function_results;
        console.log("Function Results: " + JSON.stringify(functionCliResults));

        if (functionCliResults.length === 1) {
          const functionResult = functionCliResults[0];
          if (functionResult.success) {
            printOutput(functionResult.message);
          } else {
            printOutput(functionResult.error);
          }
        } else {
          for (let i = 0; i < functionCliResults.length; i++) {
            const functionResult = functionCliResults[i];
  
            // Print the output
            let resultText = "!" + functionResult.function + "\n";
            if (functionResult.success) {
              resultText += functionResult.message;
            } else {
              resultText += functionResult.error;
            }
            if (elOutputRef.current.innerHTML !== "") resultText = "\n\n" + resultText;
            printOutput(resultText, true, true);
  
            // Handle event
            if (functionResult.event) {
              const _event = functionResult.event;
              console.log("Function Event: " + JSON.stringify(_event));
  
              // Handle redirect event
              if (_event.name === "redirect") {
                console.log("Redirecting to \"" + _event.parameters.url + "\"...");
  
                // Redirect to URL
                if (!_event.parameters.url.startsWith("http")) {
                  console.error("URL must start with http or https.");
                } else {
                  // Redirect to URL
                  if (_event.parameters.blank == true) {
                    window.open(_event.parameters.url, '_blank');  // open with new tab
                  } else {
                    window.top.location.href = _event.parameters.url;
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error(error);
      }
      return;
    }

    // Finally, general input
    // Detect subsession
    if (getSetting("head") !== null && getSetting("head") !== "") {
      const head = Number(getSetting("head"));
      const timelineTime = Number(getSetting("time"));  // time in the timeline
      const session = Number(getSetting("session"));  // session ID
      if (timelineTime < head) {
        // Subsession detected
        // The session ID is one of the log time (not head log of session)
        console.log("Detected possible sub session " + timelineTime + ", parent session is " + session + ".");
        
        // TODO, check subsession is valid in session
        // If valid, set session ID to subsession
        setSession(timelineTime);
      }
    }

    const timeNow = Date.now();
    setTime(timeNow);
    setSetting("head", timeNow);
    setSetting("historyIndex", -1);

    // Clear info and start generating
    resetInfo();

    // Generation mode switch
    // Local mode
    if (getSetting("baseUrl").includes("localhost") 
     || getSetting("baseUrl").includes("127.0.0.1")) {
      console.log("Start. (Local)");
      generate_msg(input, image_urls, file_urls);
      return;
    }

    // Non-stream
    // Just quick setup, now only support "gpt-image-1" model for image generation
    if (getSetting('useStream') == "false" || getSetting('model') === "gpt-image-1") {
      console.log("Start. (non-stream)");
      printOutput(waiting === "" ? "Generating..." : waiting);
      generate(input, image_urls, file_urls);
      return;
    }

    // Server mode
    // Stream
    if (getSetting('useStream') == "true") {
      console.log("Start. (SSE)");
      generate_sse(input, image_urls_encoded, file_urls_encoded);
      return;
    }
  }

  // M1. Generate SSE
  async function generate_sse(input, images=[], files=[]) {
    // If already doing, return
    if (globalThis.STATE === STATES.DOING) return;
    globalThis.STATE = STATES.DOING;

    // Add a waiting text
    if (getOutput() !== querying) printOutput(waiting);

    // prepare speech
    var textSpoken = "";

    // Config (input)
    const config = loadConfig();
    console.log("Config: " + JSON.stringify(config));

    // Input
    console.log("Input (" + config.session + "): " + input);
    if (images.length > 0) console.log("Images: " + images.join(", "));
    if (files.length > 0)  console.log("Files: " + files.join(", "));

    // MCP functions
    const mcpTools = await getMcpTools(config.functions);
    const mcpToolsString = JSON.stringify(mcpTools);
    console.log("MCP tools string: " + mcpToolsString);

    // Send SSE request!
    const openaiEssSrouce = new EventSource("/api/generate_sse?user_input=" + encodeURIComponent(input)
                                                           + "&images=" + images.join(encodeURIComponent("###"))  
                                                           + "&files=" + files.join(encodeURIComponent("###"))
                                                           + "&time=" + config.time
                                                           + "&session=" + config.session
                                                           + "&model=" + config.model
                                                           + "&mem_length=" + config.mem_length
                                                           + "&functions=" + config.functions
                                                           + "&mcp_tools=" + encodeURIComponent(mcpToolsString)
                                                           + "&role=" + config.role
                                                           + "&stores=" + config.stores
                                                           + "&node=" + config.node
                                                           + "&use_stats=" + config.use_stats
                                                           + "&use_eval=" + config.use_eval
                                                           + "&use_location=" + config.use_location
                                                           + "&location=" + config.location
                                                           + "&lang=" + config.lang
                                                           + "&use_system_role=" + config.use_system_role);

    let done_evaluating = false;
    let toolCalls = [];

    // Handle the SSE events
    openaiEssSrouce.onopen = function(event) {
      console.log("Session start.");
    }

    openaiEssSrouce.onmessage = async function(event) {
      if (globalThis.STATE == STATES.IDLE) {
        openaiEssSrouce.close();
        console.log("Session closed by state control.")
        return;
      }

      // I. Handle the LLM's model name (lower case)
      if (event.data.startsWith("###MODEL###")) {
        const _env_ = event.data.replace("###MODEL###", "").split(',');
        const model = _env_[0];
        !minimalist && setInfo((
          <div>
            model: {model}<br></br>
          </div>
        ));
        return;
      }

      // II. Handle the callings (tool calls)
      if (event.data.startsWith("###CALL###")) {
        printOutput(querying);

        const toolCall = (JSON.parse(event.data.replace("###CALL###", "")))[0];
        const toolCallSameIndex = toolCalls.find(t => t.index === toolCall.index);
        if (toolCallSameIndex) {
          // Found same index tool
          toolCallSameIndex.function.arguments += toolCall.function.arguments;
          console.log(toolCall.function.arguments);
        } else {
          // If not found, add the tool
          toolCalls.push(toolCall);
          console.log(JSON.stringify(toolCall));
        }
        return;
      }

      // III. Evaluation result
      if (event.data.startsWith("###EVAL###")) {
        const _eval_ = event.data.replace("###EVAL###", "");
        const val = parseInt(_eval_);

        let valColor = "#767676";                // default
        if (val >= 7)      valColor = "green";   // green
        else if (val >= 4) valColor = "#CC7722"; // orange
        else if (val >= 0) valColor = "#DE3163"; // red
        !minimalist && setEvaluation(
          <div>
            self_eval_score: <span style={{color: valColor}}>{_eval_}</span><br></br>
          </div>
        );

        done_evaluating = true;
        return;
      }

      // IV. Stats
      if (event.data.startsWith("###STATS###")) {
        if (getSetting('useStats') === "true") {
          const _stats_ = event.data.replace("###STATS###", "").split(',');
          const temperature = _stats_[0];
          const top_p = _stats_[1];
          const token_ct = _stats_[2];
          const use_eval = _stats_[3];
          const func = _stats_[4];
          const role = _stats_[5];
          const stores = _stats_[6].replaceAll('|', ", ");
          const node = _stats_[7];
          const mem = _stats_[8];

          if (use_eval === "true" && !done_evaluating) {
            !minimalist && setEvaluation(
              <div>
                self_eval_score: evaluating...<br></br>
              </div>
            );
          }

          !minimalist && setStats(
            <div>
              func: {func.replaceAll('|', ", ") || "none"}<br></br>
              temperature: {temperature}<br></br>
              top_p: {top_p}<br></br>
              token_ct: {token_ct}<br></br>
              mem: {mem}/{getSetting("memLength")}<br></br>
              {role && <div>role: {role}<br></br></div>}
              {stores && <div>stores: {stores}<br></br></div>}
              {node && <div>node: {node}<br></br></div>}
            </div>
          );
        }
        return;
      }

      // V. Handle images
      if (event.data.startsWith("###IMG###")) {
        const _image_ = event.data.replace("###IMG###", "");
        console.log("Image (###IMG###): " + _image_);

        // Print image
        printImage(_image_);
        return;
      }

      // VI. Handle status
      if (event.data.startsWith("###STATUS###")) {
        const _status_ = event.data.replace("###STATUS###", "");
        console.log("Status: " + _status_);

        // 1. Store
        // For stores print "Searching..."
        if (_status_.startsWith("Start searching...")) {
          printOutput(searching);
        }

        // 2. Node
        // For node print "Generating...", because it will be slow.
        if (config.node && (_status_.startsWith("Start pre-generating...") || _status_.startsWith("Start generating..."))) {
          printOutput(generating);
        }

        if (_status_.startsWith("Node AI querying, prompt: ")) {
          const prompt = _status_.replace("Node AI querying, prompt: ", "");
          if (prompt) {
            printOutput("Generating with \"" + config.node + "\" from prompt \"" + prompt + "\"...");
          }
        }

        if (_status_.startsWith("Node AI responsed, result: ")) {
          const result = _status_.replace("Node AI responsed, result: ", "");
          if (result) {
            // Do nothing
          }
        }

        // 3. Other
        // Sometime the function calling make it pause
        if (_status_.startsWith("Create chat completion.")) {
          printOutput(generating);
        }
        return;
      }

      // Handle a clear signal
      if (event.data === '[CLEAR]') {
        clearOutput(true);
        return;
      }

      // Handle the DONE signal
      if (event.data === '[DONE]') {
        openaiEssSrouce.close();
        console.log("Session closed.")

        // Print raw output
        console.log(globalThis.rawOutput);

        // Reset state
        globalThis.STATE = STATES.IDLE;

        // Tool calls (function calling)
        if (toolCalls.length > 0) {
          let functions = [];
          toolCalls.map((t) => {
            functions.push("!" + t.function.name + "(" + t.function.arguments + ")");
          });
          const functionCallingString = functions.join(",");

          // Generate with tool calls (function calling)
          if (input.startsWith("!")) {
            input = input.split("Q=")[1];
          }

          // Frontend function calling
          const functionCallingResult = [];
          if (await pingMcpServer()) {
            const mcpFunctions = await listMcpFunctions();
            if (mcpFunctions && mcpFunctions.length > 0) {
              const mcpFunctionNames = mcpFunctions.map((f) => f.name);

              // Loop through all tool calls and call them with callMcpTool
              for (const call of toolCalls) {
                if (mcpFunctionNames.includes(call.function.name)) {
                  // Call the function with callMcpTool
                  console.log("Calling MCP function: " + JSON.stringify(call));
                  const result = await callMcpTool(call.function.name, JSON.parse(call.function.arguments));
                  console.log("MCP function result: " + JSON.stringify(result));
                  // Result format:
                  // {
                  //   success: true,
                  //   function: f,
                  //   message: result.message,
                  //   event: result.event,
                  // }
                  functionCallingResult.push({
                    success: true,
                    function: call.function.name,
                    message: result ? JSON.stringify(result) : "No result.",
                    // event: ...
                  });
                }
              }
            }
          }

          // Set time
          const timeNow = Date.now();
          setTime(timeNow);
          setSetting("head", timeNow);

          // Re-call generate with tool calls!
          const inputParts = [
            functionCallingString,                         // function calling string, use `!` to trigger backend function calling method
            "T=" + JSON.stringify(toolCalls),              // tool calls generated
            "R=" + JSON.stringify(functionCallingResult),  // frontend function calling result
            "Q=" + input                                   // original user input
          ];
          await generate_sse(inputParts.join(" "), [], []);
          return;
        }

        // Trigger highlight.js
        hljs.highlightAll();

        // Try speak some rest text
        if (getSetting("useSpeak") === "true") {
          let restText = globalThis.rawOutput.replace(textSpoken, "");
          restText = restText.replaceAll("<br>", " ");
          if (restText.length > 0)
            speak(restText);
        }
        return;
      }

      // VI. Handle error
      if (event.data.startsWith("###ERR###") || event.data.startsWith('[ERR]')) {
        globalThis.STATE = STATES.IDLE;
        window.speechSynthesis.cancel();
        openaiEssSrouce.close();

        const err = event.data.replace("###ERR###", "").replace("[ERR]", "");
        printOutput(err);
        console.error(err);
        return;
      }

      // VII. Handle event
      if (event.data.startsWith("###EVENT###")) {
        const _event = JSON.parse(event.data.replace("###EVENT###", ""));
        console.log("Event(SSE): " + JSON.stringify(_event));

        if (_event.name === "redirect") {
          console.log("Redirecting to " + _event.parameters.url + "...");

          // Redirect to URL
          if (!_event.parameters.url.startsWith("http")) {
            console.error("URL must start with http or https.");
          } else {
            // Redirect to URL
            if (_event.parameters.blank == true) {    
              // Open with new tab
              window.open(_event.parameters.url, '_blank');
            } else {
              // Stop generating as it will be redirected.
              globalThis.STATE = STATES.IDLE;
              window.speechSynthesis.cancel();
              openaiEssSrouce.close();

              // Redirect to URL
              window.top.location.href = _event.parameters.url;
            }
          }
        }
        return;
      }

      // Clear the waiting or querying text
      if (getOutput() === waiting || getOutput() === querying || getOutput() === searching || getOutput() === generating) {
        clearOutput();
      }

      // Stream output
      let output = event.data;
      if (globalThis.STATE === STATES.DOING) {
        // Print output
        printOutput(output, false, true);
        console.log(event.data);

        // Try speak
        if (getSetting("useSpeak") === "true") {
          textSpoken = trySpeak(globalThis.rawOutput, textSpoken);
        }
      } else {
        // If not doing, close the stream
        console.log("Session closed by state control.")
        openaiEssSrouce.close();
        return;
      }
    };

    openaiEssSrouce.onerror = function(error) {
      console.error("Other stream error: ", error);
      openaiEssSrouce.close();
      return;
    };
  }

  // M2. Generate message from server, and then call local model engine
  async function generate_msg(input, images=[], files=[]) {
    // If already doing, return
    if (globalThis.STATE === STATES.DOING) return;
    globalThis.STATE = STATES.DOING;

    // Add a waiting text
    if (getOutput() !== querying) printOutput(waiting);

    // Input
    let inputType = TYPE.NORMAL;

    // Output
    let outputType = TYPE.NORMAL;

    // Use stream
    const useStream = getSetting('useStream') === "true";

    // User
    const user = {
      username: getSetting("user")
    };

    // Config (input)
    const config = loadConfig();
    console.log("Config: " + JSON.stringify(config));

    // Type I. Normal input
    if (!input.startsWith("!")) {
      inputType = TYPE.NORMAL;
      console.log("Input (" + config.session + "): " + input);
      if (images.length > 0) console.log("Images: " + images.join(", "));
      if (files.length > 0)  console.log("Files: " + files.join(", "));
    }

    // Type II. Tool calls (function calling) input
    if (input.startsWith("!")) {
      inputType = TYPE.TOOL_CALL;
      console.log("Input (toolcalls, session = " + config.session + "): " + input);
    }

    // Model switch
    const use_vision = images && images.length > 0;
    const model = config.model;

    // Set model
    !minimalist && setInfo((
      <div>
        model: {model}<br></br>
      </div>
    ));

    // Tools
    // Tool calls only supported in non-stream mode
    let tools = [];
    if (!useStream) {
      tools = tools.concat(getTools(config.functions));

      // This is local, can access directly
      tools = tools.concat(await getMcpTools(config.functions));
    }
    if (tools.length > 0) {
      console.log("Tools: " + JSON.stringify(tools));
    }

    // Generate messages
    const msgResponse = await fetch("/api/generate_msg", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
         time: config.time,
         user_input: input,
         images: images,
         files: files,
         session: config.session,
         model: config.model,
         mem_length: config.mem_length,
         functions: config.functions,
         role: config.role,
         stores: config.stores,
         node: config.node,
         use_stats: config.use_stats,
         use_eval: config.use_eval,
         use_location: config.use_location,
         location: config.location,
         lang: config.lang,
         use_system_role: config.use_system_role,
      }),
    });

    const msgData = await msgResponse.json();
    if (msgResponse.status !== 200) {
      throw msgData.error || new Error(`Request failed with status ${msgResponse.status}`);
    }
    const msg = msgData.result.msg;
    console.log("Messages: " + JSON.stringify(msg.messages));

    const openai = new OpenAI({
      baseURL: config.base_url,
      apiKey: "",  // not necessary for local model, but required for OpenAI API
      dangerouslyAllowBrowser: true,
    });

    // OpenAI chat completion!
    const chatCompletion = await openai.chat.completions.create({
      messages: msg.messages,
      model: model,
      frequency_penalty: 0,
      logit_bias: null,
      n: 1,
      presence_penalty: 0,
      response_format: null,
      seed: null,
      service_tier: null,
      stream: useStream,
      stream_options: null,
      temperature: 1,
      top_p: 1,
      tools: useStream ? null : tools,  // function calling only available in non-stream mode
      tool_choice: !useStream && tools.length > 0 ? "auto" : null,
      user: user ? user.username : null,
    });

    // Record log (chat history)
    const logadd = async (input, output) => {
      const response1 = await fetch("/api/log/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input,
          output,
          model: model,
          session: getSetting("session"),
          images: [],
          time: Date.now(),
        }),
      });

      if (response1.status !== 200) {
        throw msgData.error || new Error(`Request failed with status ${response1.status}`);
      }
    }

    // Non-stream mode
    if (!useStream) {
      // Non-stream mode support tool calls
      // Reset state
      globalThis.STATE = STATES.IDLE;

      // Get result
      const choices = chatCompletion.choices;
      if (!choices || choices.length === 0 || choices[0].message === null) {
        console.error("No choice\n");
        printOutput("Silent...");
        return;
      } else {
        // 1. handle general message response
        if (choices[0].message.content && choices[0].message.content.length > 0) {
          outputType = TYPE.NORMAL;
          const output = choices[0].message.content;

          // Add log
          if (inputType === TYPE.TOOL_CALL) {
            input = "Q=" + input.split("Q=")[1].trim();
          }
          await logadd(input, output);

          // Print output result
          if (output) {
            printOutput(output);
            console.log("Output:\n" + output);
          } else {
            console.log("No output.");
          }

          // Formatter
          markdownFormatter(elOutputRef.current);

          // Trigger highlight.js
          hljs.highlightAll();
        }

        // 2. handle tool calls response
        if (choices[0].message.tool_calls && choices[0].message.tool_calls.length > 0) {
          outputType = TYPE.TOOL_CALL;
          const toolCalls = choices[0].message.tool_calls;

          // Add log
          await logadd(input, "T=" + JSON.stringify(toolCalls));

          let functions = [];
          toolCalls.map((t) => {
            functions.push("!" + t.function.name + "(" + t.function.arguments + ")");
          });
          const functionCallingString = functions.join(",");

          // Generate with tool calls (function calling)
          if (input.startsWith("!")) {
            input = input.split("Q=")[1];
          }

          // Frontend function calling
          const functionCallingResult = [];
          if (await pingMcpServer()) {
            const mcpFunctions = await listMcpFunctions();
            if (mcpFunctions && mcpFunctions.length > 0) {
              const mcpFunctionNames = mcpFunctions.map((f) => f.name);

              // Loop through all tool calls and call them with callMcpTool
              for (const call of toolCalls) {
                if (mcpFunctionNames.includes(call.function.name)) {
                  // Call the function with callMcpTool
                  console.log("Calling MCP function: " + JSON.stringify(call));
                  const result = await callMcpTool(call.function.name, JSON.parse(call.function.arguments));
                  console.log("MCP function result: " + JSON.stringify(result));
                  // Result format:
                  // {
                  //   success: true,
                  //   function: f,
                  //   message: result.message,
                  //   event: result.event,
                  // }
                  functionCallingResult.push({
                    success: true,
                    function: call.function.name,
                    message: result ? result.content[0].text : "No result.",
                    // event: ...
                  });
                }
              }
            }
          }

          if (toolCalls.length > 0) {
            // The final output shouldn't be a tool call
            console.log("Output Tool Calls:\n" + JSON.stringify(toolCalls));
          }

          // Set time
          const timeNow = Date.now();
          setTime(timeNow);
          setSetting("head", timeNow);

          // Re-call generate with tool calls!
          const inputParts = [
            functionCallingString,                         // function calling string, use `!` to trigger backend function calling method
            "T=" + JSON.stringify(toolCalls),              // tool calls generated
            "R=" + JSON.stringify(functionCallingResult),  // frontend function calling result
            "Q=" + input                                   // original user input
          ];
          await generate_msg(inputParts.join(" "), [], []);
        }
      }
    }

    // Stream mode
    if (useStream) {
      let output = "";

      // Convert the response stream into a readable stream
      const stream = Readable.from(chatCompletion);

      await new Promise((resolve, reject) => {
        // Handle the data event to process each JSON line
        stream.on('data', (part) => {
          try {
            // 1. handle message output
            const content = part.choices[0].delta.content;
            if (content) {
              output += content;
              console.log(content);
              printOutput(content, false, true);
            }

            // Set model
            const model = part.model;
            !minimalist && setInfo((
              <div>
                model: {model}<br></br>
              </div>
            ));

            // 2. handle tool calls
            // Streaming mode not support tool calls yet. (Ollama)
          } catch (error) {
            console.error('Error parsing JSON line:', error);
            stream.destroy(error); // Destroy the stream on error
            reject(error);
          }
        });
    
        // Resolve the Promise when the stream ends
        stream.on('end', async () => {
          // Print output result
          if (output) {
            console.log("Output:\n" + output);
          } else {
            console.log("No output.");
          }

          // Formatter
          markdownFormatter(elOutputRef.current);

          // Trigger highlight.js
          hljs.highlightAll();

          // Add log
          await logadd(input, output);

          // Reset state
          globalThis.STATE = STATES.IDLE;
          resolve();
        });
    
        // Reject the Promise on error
        stream.on('error', (error) => {
          printOutput(error);
          reject(error);
        });
      });
    }
  }

  // M0. Generate (without SSE)
  // Legacy generate function
  async function generate(input, images=[], files=[]) {
    // If already doing, return
    if (globalThis.STATE === STATES.DOING) return;
    globalThis.STATE = STATES.DOING;

    // Input
    console.log("Input:\n" + input);
    if (images.length > 0) console.log("Images:\n" + images.join("\n"));
    if (files.length > 0) console.log("Files:\n" + files.join("\n"));

    // Config (input)
    const config = loadConfig();
    console.log("Config: " + JSON.stringify(config));

    try {
      // Send generate request!
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_input: input,
          images: images,
          files: files,
          time: config.time,
          session: config.session,
          model: config.model,
          mem_length: config.mem_length,
          functions: config.functions,
          role: config.role,
          stores: config.stores,
          node: config.node,
          use_stats: config.use_stats,
          use_eval: config.use_eval,
          use_location: config.use_location,
          location: config.location,
          lang: config.lang,
          use_system_role: config.use_system_role,
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      // Reset state
      globalThis.STATE = STATES.IDLE;

      // Events
      const events = data.result.events;
      if (events.length > 0) {
        events.map(event => {
          console.log("Event: " + JSON.stringify(event));
  
          if (event.name === "redirect") {
            console.log("Redirecting to " + event.parameters.url + "...");
  
            // Redirect to URL
            if (!event.parameters.url.startsWith("http")) {
              console.error("URL must start with http or https.");
            } else {
              // Redirect to URL
              if (event.parameters.blank == true) {    
                // Open with new tab
                window.open(event.parameters.url, '_blank');
              } else {
                // Stop generating as it will be redirected.
                globalThis.STATE = STATES.IDLE;
                window.speechSynthesis.cancel();
  
                // Redirect to URL
                window.top.location.href = event.parameters.url;
                return;
              }
            }
          }
        });
      }

      // Tool calls (function calling)
      const toolCalls = data.result.tool_calls;
      if (toolCalls.length > 0) {
        let functions = [];
        toolCalls.map((t) => {
          functions.push("!" + t.function.name + "(" + t.function.arguments + ")");
        });
        const functionInput = functions.join(",");

        // Generate with tool calls (function calling)
        if (input.startsWith("!")) {
          input = input.split("Q=")[1];
        }

        // Reset time
        const timeNow = Date.now();
        setTime(timeNow);
        setSetting("head", timeNow);

        // Call generate with function
        printOutput(querying);
        generate(functionInput + " T=" + JSON.stringify(toolCalls) + " Q=" + input, [], []);
        return;
      }

      // Print image output
      if (getSetting("model") === "gpt-image-1") {
        const images = data.result.images;
        for (const image of images) {
          printImage(image);

          // Print image output
          console.log("Output image: " + image.slice(0, 50) + "...");
        }
      }

      // Render output
      const output = data.result.text
      console.log("Output: \n" + output);

      // Print output
      printOutput(output);

      // Formatter
      markdownFormatter(elOutputRef.current);

      // Trigger highlight.js
      hljs.highlightAll();

      if (data.result.stats && config.use_stats === "true") {
        let stats = "";
        if (data.result.stats.func) stats += "func: " + data.result.stats.func.replaceAll('|', ", ") + "\n";
        if (data.result.stats.temperature) stats += "temperature: " + data.result.stats.temperature + "\n";
        if (data.result.stats.top_p) stats += "top_p: " + data.result.stats.top_p + "\n";
        if (data.result.stats.token_ct) stats += "token_ct: " + data.result.stats.token_ct + "\n";
        if (data.result.stats.mem) stats += "mem: " + data.result.stats.mem + "/" + getSetting("memLength") + "\n";
        if (data.result.stats.role) stats += "role: " + data.result.stats.role + "\n";
        if (data.result.stats.stores) stats += "stores: " + data.result.stats.stores.replaceAll('|', ", ") + "\n";
        if (data.result.stats.node) stats += "node: " + data.result.stats.node + "\n";

        !minimalist && setStats((
          <div>
            {stats.split("\n").map((line, index) => (
              <div key={index}>
                {line}
              </div>
            ))}
          </div>
        ));

        if (config.use_eval === "true") {
          const _eval_ = data.result.stats.eval;
          const val = parseInt(_eval_);
  
          let valColor = "#767676";                // default
          if (val >= 7)      valColor = "green";   // green
          else if (val >= 4) valColor = "#CC7722"; // orange
          else if (val >= 0) valColor = "#DE3163"; // red
          !minimalist && setEvaluation(
            <div>
              self_eval_score: <span style={{color: valColor}}>{_eval_}</span><br></br>
            </div>
          );
        }
      }

      !minimalist && setInfo((
        <div>
          model: {data.result.info.model}
          <br></br>
        </div>
      ));
    } catch (error) {
      printOutput("Error occurred.");
      console.error(error);
    }
  }
  
  // Handle input key down
  const handleInputKeyDown = async (event) => {
    const elInput = elInputRef.current;

    // Enter key event
    // 1. Submit 2. Insert new line break if use ctrl/shift
    if (event.keyCode === 13 || event.which === 13) {
      event.preventDefault();

      // For command always submit with enter
      if (elInput.value.startsWith(":")) {
        onSubmit(event);
        return;
      }

      if (fullscreen === "default" || fullscreen === "off") {
        if (event.ctrlKey || event.shiftKey) {
          // Insert a line break
          const pCursor = event.target.selectionStart;
          setInput(elInput.value.substring(0, pCursor) + '\n' + elInput.value.substring(pCursor));

          // Move cursor
          elInput.selectionStart = pCursor + 1;
          elInput.selectionEnd = pCursor + 1;

          // Re-adjust input height
          reAdjustInputHeight();
        } else {
          // Submit
          onSubmit(event);
        }
      }

      // Split fullscreen use ctrl/shift to submit
      // Use enter to insert a line break
      if (fullscreen === "split") {
        if (event.ctrlKey || event.shiftKey) {
          // Submit
          onSubmit(event);
        } else {
          // Insert a line break
          const pCursor = event.target.selectionStart;
          setInput(elInput.value.substring(0, pCursor) + '\n' + elInput.value.substring(pCursor));

          // Move cursor
          elInput.selectionStart = pCursor + 1;
          elInput.selectionEnd = pCursor + 1;
        }
      }
    }

    // Tab key event
    if (event.keyCode === 9 || event.which === 9) {
      event.preventDefault();

      // Input from placeholder when pressing tab
      if (elInput.value.length === 0) {
        setInput(globalThis.rawPlaceholder);
        reAdjustInputHeight();
      }

      // Auto complete
      if (elInput.value.startsWith(":")) {
        const autocomplete = async (prefix, useQuates = false) => {
          if (elInput.value.startsWith(prefix)) {
            const nameToBeComleted = elInput.value.replace(prefix, "").replace(/^\"+/, '').replace(/\"$/, '');

            // Get auto complete options
            const options = await getAutoCompleteOptions(prefix, nameToBeComleted);
            
            if (options.includes(nameToBeComleted)) {
              // Set the input to next option
              const nextOption = options[(options.indexOf(nameToBeComleted) + 1) % options.length];
              const complation = useQuates ? "\"" + nextOption + "\"" : nextOption;
              setInput(prefix + complation);
              reAdjustInputHeight();
            } else {
              // Try auto complete
              const matches = options.filter((o) => o.startsWith(nameToBeComleted));
              if (matches.length > 0) {
                const complation = useQuates ? "\"" + matches[0] + "\"" : matches[0];
                setInput(prefix + complation);
                reAdjustInputHeight();
              }
            }
          }
        }

        // Try auto complete
        autocomplete(":role ", true);
        autocomplete(":role use ", true);
        autocomplete(":role unuse ", true);
        autocomplete(":store ", true);
        autocomplete(":store use ", true);
        autocomplete(":store set ", false);
        autocomplete(":store unuse ", true);
        autocomplete(":store init ", true);
        autocomplete(":store data reset ", true);
        autocomplete(":store del ", true);
        autocomplete(":store delete ", true);
        autocomplete(":node ", true);
        autocomplete(":node use ", true);
        autocomplete(":node unuse ", true);
        autocomplete(":node set ", false);
        autocomplete(":node del ", true);
        autocomplete(":node delete ", true);
        autocomplete(":theme ");
        autocomplete(":lang use ");
        autocomplete(":user set ");
        autocomplete(":set ");
        autocomplete(":function ", true);
        autocomplete(":function use ", true);
        autocomplete(":function unuse ", true);
        autocomplete(":use ", true);
        autocomplete(":unuse ", true);
        autocomplete(":voice use ", true);
        autocomplete(":model ", true);
        autocomplete(":model use ", true);
        autocomplete(":model unuse ", true);
      }
    }
  };

  // Handle input change
  // Only for general input
  const handleInputChange = (event) => {
    const elInput = elInputRef.current;
    if (elInput.value.startsWith(':login') || elInput.value.startsWith(':user set pass') || elInput.value.startsWith(":user add") || elInput.value.startsWith(":user join")) {
      // Password input
      if (getSetting("passMask") === "true") {
        globalThis.rawInput = elInput.value.replace(/\*/g, (match, index) => globalThis.rawInput[index] || '');  // store real password
        passwordFormatter(elInputRef.current);
      } else {
        globalThis.rawInput = elInput.value;
      }
    } else {
      // General input
      globalThis.rawInput = elInput.value;
    }
    
    // Re-adjust input height
    reAdjustInputHeight(null, false);
  };

  // The placeholder should be shorten if fullscreen off or default
  // For fullscreen split, the placeholder shouldn't be shorten
  const reAdjustPlaceholder = (fullscreen_ = null) => {
    if (!fullscreen_) fullscreen_ = getSetting("fullscreen");
    fullscreen_ = fullscreen_.replace("force", "").trim();
    
    const placeholder = globalThis.rawPlaceholder;
    const placeholderShortern = ((fullscreen_ === "default" || fullscreen_ === "off") && (placeholder.length >= 45 || placeholder.includes("\n"))) ? 
                                 placeholder.replaceAll("\n", " ").substring(0, 20) + " ..." : placeholder;
    setPlaceholder({ text: placeholderShortern, height: null });
  }

  // The sleep 1 will magically fix the auto -> height issue
  // But when input change, the height will jumping, so add doSleepToFixAuto param to control
  const reAdjustInputHeight = async (fullscreen_ = null, doSleepToFixAuto = true) => {
    const elInput = elInputRef.current;
    if (elInput) {
      if (!fullscreen_) {
        fullscreen_ = getSetting("fullscreen");
      }

      // Non-fullscreen
      if (fullscreen_ === "off") {
        elInput.style.height = "auto";
        if (doSleepToFixAuto) {
          // This sleep magically fixed the hight issue
          await sleep(1)
          elInput.style.height = `${elInput.scrollHeight + 1}px`;
        } else {
          elInput.style.height = `${elInput.scrollHeight + 1}px`;
        }
      }

      // Fullscreen
      if (fullscreen_ === "default") {
        elInput.style.height = "auto";
        if (doSleepToFixAuto) {
          // This sleep magically fixed the hight issue
          await sleep(1)
          elInput.style.height = `${elInput.scrollHeight + 1}px`;
        } else {
          elInput.style.height = `${elInput.scrollHeight + 1}px`;
        }

        // If input height is larger than the window height
        // then set it to window height
        if (elInput.scrollHeight > window.innerHeight / 2) {
          elInput.style.height = `${window.innerHeight / 2}px`;
        }
        
        // Store input height in fullscreen mode
        // To calculate the height of output wrapper
        document.documentElement.style.setProperty("--input-height", elInput.style.height);
      }

      // Fullscreen split
      if (fullscreen_ === "split") {
        // Do nothing because the input height alwasy 100%
        elInput.style.height = "100%";
      }
    }
  }

  // +img[], +image[], +file[]
  const filePlus = async (blob, type) => {
    const fileName = blob.name;
    const fileSize = blob.size;

    // Fix markdown file type
    if (fileName.endsWith(".md")) {
      type = "text/markdown";
    }

    // Insert placeholder text for the image
    const file_id = Date.now().toString();

    let prefix = "+file";
    if (type === "image/png" || type === "image/jpeg") prefix = "+image";
    const filePlaceholder = prefix + "[file_id:" + file_id +"(uploading...)] ";

    // Insert the placeholder text at the cursor position or text selection
    const text = elInputRef.current.value;
    const cursorPos = event.target.selectionStart;
    let textBefore = text.substring(0, cursorPos);
    const textAfter = text.substring(cursorPos);
    if (!textBefore.endsWith(" ") && !textBefore.endsWith("\n") && textBefore.length > 0) {
      // avoid attaching to the previous word
      textBefore += " ";
    }

    // Update the textarea value with the placeholder text
    setInput(textBefore + filePlaceholder + textAfter);
    reAdjustInputHeight();  // Re-adjust input height as input changed

    // Grab the file
    console.log('Image/file pasted/dropped: ' + fileName + ' (' + type + ')');

    let message = "null";
    
    // 1. Check file size
    if (fileSize > 10485760) {
      // 10MB
      message = "file_id:" + file_id + "(failed: file size exceeds 10MB)";
    } else {
      const supportedImageTypes = ["image/png", "image/jpeg", "image/jpg"];
      const supportedFileTypes = ["text/plain", "text/markdown",
                                  "application/pdf",
                                  "application/json",
                                  "text/csv", "application/vnd.ms-excel",
                                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
      const supportedTypes = supportedImageTypes.concat(supportedFileTypes);

      // 2. Check file type
      if (supportedTypes.includes(type)) {
        // Upload the image to S3
        const uploadResult = await generateFileUrl(blob, file_id, type);
        if (!uploadResult.success) {
          // Print error message 
          console.error(uploadResult.message);
          message = "file_id:" + file_id + "(failed: " + uploadResult.message + ")";
        } else {
          // Replace the placeholder text with the image URL
          message = uploadResult.objectUrl;
        }
      } else {
        if (type.startsWith("image/")) {
          message = "file_id:" + file_id + "(failed: unsupported image type)";
        } else {
          message = "file_id:" + file_id + "(failed: unsupported file type)";
        }
      }
    }

    setInput(elInputRef.current.value.replaceAll("file_id:" + file_id + "(uploading...)", message));

    // Re-adjust input height as input changed
    reAdjustInputHeight();
  }

  // Handle paste event on input textarea
  const handlePaste = async (event) => {
    // Get the clipboard data
    const clipboardData = event.clipboardData;

    // Look for any images in the pasted data
    const items = clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      // Must be a file, for paste plain text should be ignored.
      if (items[i].getAsFile()) {
        event.preventDefault();
        filePlus(items[i].getAsFile(), items[i].type);
      }
    }
  };

  // Handle drag over event on input textarea
  const handleDragOver = (event) => {
    event.preventDefault();
  };

  // Handle drop event on input textarea
  const handleDrop = async (event) => {
    // Get the dropped data
    const droppedFiles = event.dataTransfer.files;

    // Look for any images in the dropped data
    for (let i = 0; i < droppedFiles.length; i++) {
      event.preventDefault();
      filePlus(droppedFiles[i], droppedFiles[i].type);
    }
  }

  // Styles
  let styles = defaultStyles;
  if (fullscreen === "default") styles = fullscreenStyles;
  if (fullscreen === "split") styles = fullscreenSplitStyles;
  
  return (
    <div>
      <Head>
        <title>simple ai - chat</title>
        <link rel="manifest" href="/manifest.json"></link> {/* Android Icon */}
      </Head>

      <main className={styles.main}>
        {!minimalist && <div id="btn-dot" onClick={toggleDisplay} className={`${styles.dot} select-none`}>{display === DISPLAY.FRONT ? "•" : "╳"}</div>}

        <div className={`${styles.front} ${display === DISPLAY.FRONT ? 'flex' : 'hidden'} fadeIn`}>
          <form className={styles.inputform} onSubmit={onSubmit}>
            <textarea
              id="input"
              ref={elInputRef}
              rows="1"
              className={styles.input}
              placeholder={placeholder.text}
              onChange={handleInputChange}
              onPaste={handlePaste}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              autoFocus
              onKeyDown={handleInputKeyDown}
              autoComplete="off"
              spellCheck="false"
            />
            <input
              className={styles.submit} 
              type="submit" 
              value={enter}
            />
          </form>
          <div id="wrapper" ref={elWrapperRef} className={styles.wrapper}>
            {outputImages.map((image, index) => (
              <div key={index} className="mb-5 image-preview">
                <PreviewImage image={image} />
              </div>
            ))}
            <div 
              id="output" 
              ref={elOutputRef}
              className={styles.output}>
            </div>
            {evaluation && stats && <div className={styles.evaluation}>{evaluation}</div>}
            {stats && <div className={styles.stats}>{stats}</div>}
            <div className={styles.info} onClick={(event) => {
              let copyText = "";
              if (event.ctrlKey || event.metaKey) {
                // Copy attach session command to share
                copyText = ":session attach " + getSetting("session");
              } else {
                copyText = globalThis.rawOutput;
              }
              navigator.clipboard.writeText(copyText);
              console.log("Copied:\n" + copyText);
            }}>{info}</div>
          </div>
        </div>
      
        {display === DISPLAY.BACK &&
          <div className={`${styles.back} ${display === DISPLAY.BACK ? 'flex' : 'hidden'} fadeIn`}>
            <div className={styles.container}>
              <div className={styles.nav}>
                <div className={styles.navitem} onClick={() => setContent(CONTENT.DOCUMENTATION)}>{ t("Documentation") }</div>
                {usageDisplay && <div className={styles.navitem} onClick={() => setContent(CONTENT.USAGE)}>{ t("Usage") }</div>}
                {subscriptionDisplay && <div className={styles.navitem} onClick={() => setContent(CONTENT.SUBSCRIPTION)}>{ t("Subscriptions")} </div>}
                <div className={styles.navitem} onClick={() => setContent(CONTENT.SETTINGS)}>{ t("Settings") }</div>
                <div className={styles.navitem} onClick={() => setContent(CONTENT.PRIVACY)}>{ t("Privacy Policy") }</div>
              </div>
              <div className={styles.content}>
                {content === CONTENT.DOCUMENTATION && <div className={styles.contentitem}>
                  <Documentation />
                </div>}
                {usageDisplay && content === CONTENT.USAGE && <div className={styles.contentitem}>
                  <Usage />
                </div>}
                {subscriptionDisplay && content === CONTENT.SUBSCRIPTION && <div className={styles.contentitem}>
                  <Subscription />
                </div>}
                {content === CONTENT.SETTINGS && <div className={styles.contentitem}>
                  <Settings />
                </div>}
                {content === CONTENT.PRIVACY && <div className={styles.contentitem}>
                  <UserDataPrivacy />
                </div>}
                <div className={styles.copyrights}>
                  <Copyrights />
                </div>
              </div>
            </div>
          </div>}
      </main>
    </div>
  );
}
