import Head from "next/head";
import { useState, useEffect, useRef } from "react";
import defaultStyles from "../styles/pages/index.module.css";
import fullscreenStyles from "../styles/pages/index.fullscreen.module.css";
import fullscreenSplitStyles from "../styles/pages/index.fullscreen.split.module.css";
import command, { getHistoryCommand, getHistoryCommandIndex, pushCommandHistory } from "command.js";
import { speak, trySpeak } from "utils/speakUtils.js";
import { setTheme, getThemes } from "utils/themeUtils.js";
import { setRtl } from "utils/rtlUtils.js";
import { useDispatch, useSelector } from "react-redux";
import { toggleFullscreen } from "../states/fullscreenSlice.js";
import { markdownFormatter } from "utils/markdownUtils.js";
import { passwordFormatter, maskPassword, isCommandMusked } from "utils/passwordUtils";
import UserDataPrivacy from "components/UserDataPrivacy";
import Usage from "components/Usage";
import Subscription from "components/Subscription";
import Documentation from "components/Documentation";
import Copyrights from "components/Copyrights";
import { refreshUserInfo, updateUserSetting } from "utils/userUtils";
import { toggleEnterChange } from "states/enterSlice";
import hljs from 'highlight.js';
import { generateFileURl } from "utils/awsUtils";
import { initializeSession, setSession, setTime } from "utils/sessionUtils";
import Image from 'next/image';
import { getQueryParameterValue } from "utils/urlUtils";
import 'katex/dist/katex.min.css';
import { asciiframe } from "utils/donutUtils";
import { isMobileDevice } from "utils/mobileUtils";
import { getLangCodes } from "utils/langUtils";
import { useTranslation } from 'react-i18next';
import { getFunctions } from "function";
import { simulateKeyPress } from "utils/keyboardUtils";
import { getSettings } from "utils/settingsUtils";

// Status control
const STATES = { IDLE: 0, DOING: 1 };
global.STATE = STATES.IDLE;  // a global state

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
global.outputMutationObserver = null;

// Global raw input/output buffer
global.rawInput = "";
global.rawOutput = "";
global.rawPlaceholder = "";

// Donut interval id
let dunutIntervalId = null;

export default function Home() { 
  // States
  const [placeholder, setPlaceholder] = useState("");
  const [waiting, setWaiting] = useState("");
  const [querying, setQuerying] = useState("Querying...");
  const [generating, setGenerating] = useState("Generating...");
  const [info, setInfo] = useState();
  const [stats, setStats] = useState();
  const [evaluation, setEvaluation] = useState();
  const [display, setDisplay] = useState(DISPLAY.FRONT);
  const [content, setContent] = useState(CONTENT.DOCUMENTATION);
  const [subscriptionDisplay, setSubscriptionDisplay] = useState(false);
  const [outputImages, setOutputImages] = useState([]);
  const [minimalist, setMinimalist] = useState(false);
  const [country, setCountry] = useState(false);

  // Refs
  const elInputRef = useRef(null);
  const elOutputRef = useRef(null);
  const elWrapperRef = useRef(null);

  // Global states with Redux
  const dispatch = useDispatch();
  const fullscreen = useSelector(state => state.fullscreen);
  const enter = useSelector(state => state.enter);

  // i18n
  const { t, i18n } = useTranslation();

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
        global.outputMutationObserver.disconnect();
      }

      // Print the output
      const textHtml = text.replaceAll(/&/g, "&amp;")
                           .replaceAll(/</g, "&lt;").replace(/>/g, "&gt;")
                           .replaceAll(/"/g, "&quot;").replace(/'/g, "&#039;")
                           .replaceAll("###RETURN###", '<br>');
      const textRaw = text.replaceAll("###RETURN###", '\n');

      if (append) {
        elOutput.innerHTML += textHtml;
        global.rawOutput += textRaw;
      } else {
        elOutput.innerHTML = textHtml;
        global.rawOutput = textRaw;
      }

      if (ignoreFormatter) {
        // Resume observing
        global.outputMutationObserver.observe((elOutput), { 
          childList: true, 
          attributes: false, 
          subtree: true,
          characterData: true
        });
      }
    }
  };

  // Print image output
  const printImage = async (image_url, ar = 1.7) => {
    console.log("Print Image: " + image_url);
    
    // Get aspect ratio from URL
    const arParam = getQueryParameterValue(image_url, "ar")
    if (arParam) ar = parseFloat(arParam);

    const width = 1000;
    const height = width / ar;
    setOutputImages(currentImages => {
      return [...currentImages, { src: image_url, alt: image_url, width, height, blurDataURL: image_url }];
    });
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

  // Get session log
  const getSessionLog = async function(direction = "prev", session, time) {
    let log = null;
    const response = await fetch("/api/log/" + direction + "?session=" + session + "&time=" + time, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }).catch(error => {
      console.error('Error:', error);
      return null;
    });
    log = await response.json()
    return log;
  }

  // Get hostory session
  const getHistorySession = async function(direction = "prev", currentSessionId) {
    if (!localStorage.getItem("user")) {
      console.log("User not logged in.");
      return null;
    }

    let session = null;
    console.log("Getting history session " + direction + " of " + currentSessionId + "...");
    const response = await fetch("/api/session/" + direction + "?sessionId=" + currentSessionId + "&user=" + localStorage.getItem("user"), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }).catch(error => {
      console.error('Error:', error);
      return null;
    });
    const data = await response.json()
    if (data.success) {
      session = data.result.session;
    }
    return session;
  }

  // Print session log
  const printSessionLog = async function(log) {
    setTime(log["time"]);
    console.log("Session log:", JSON.stringify(log));

    // Print the log
    clearPreviewImages();
    const resetInfo = () => {
      setInfo();
      setStats();
      setEvaluation();
    }
    resetInfo();
    clearOutput();

    // Print input
    global.rawPlaceholder = log["input"];
    reAdjustPlaceholder();

    // Print output
    printOutput(log["output"]);
    global.rawOutput = log["output"];

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
  const clearOutput = () => {
    printOutput("");
  };

  // Get output
  const getOutput = () => {
    return elOutputRef.current.innerHTML;
  };

  // Set input
  const setInput = (text) => {
    elInputRef.current.value = text;
    global.rawInput = text;
  }

  // Clear input
  const clearInput = () => {
    elInputRef.current.value = "";
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
    initializeSession();

    // Set default localStorage values
    if (localStorage.getItem("_up") === null) localStorage.setItem("_up", Date.now());
    if (localStorage.getItem("lang") === null) localStorage.setItem("lang", "en-US");  // by default use English
    if (localStorage.getItem("useStats") === null) localStorage.setItem("useStats", "false");
    if (localStorage.getItem("useEval") === null) localStorage.setItem("useEval", "false");
    if (localStorage.getItem("useStream") === null) localStorage.setItem("useStream", "true");
    if (localStorage.getItem("useSpeak") === null) localStorage.setItem("useSpeak", "false");
    if (localStorage.getItem("useLocation") === null) localStorage.setItem("useLocation", "false");
    if (localStorage.getItem("fullscreen") === null) localStorage.setItem("fullscreen", "off");
    if (localStorage.getItem("theme") === null) localStorage.setItem("theme", "light");
    if (localStorage.getItem("functions") === null) localStorage.setItem("functions", "Time,Weather,Redirection");  // default functions
    if (localStorage.getItem("passMask") === null) localStorage.setItem("passMask", "true");
    if (localStorage.getItem("useSystemRole") === null) localStorage.setItem("useSystemRole", "true");

    // Set default sessionStorage values
    if (sessionStorage.getItem("memLength") === null) sessionStorage.setItem("memLength", 7);
    if (sessionStorage.getItem("role") === null) sessionStorage.setItem("role", "");    // default role
    if (sessionStorage.getItem("store") === null) sessionStorage.setItem("store", "");  // default store
    if (sessionStorage.getItem("node") === null) sessionStorage.setItem("node", "");    // default node
    if (sessionStorage.getItem("history") === null) sessionStorage.setItem("history", JSON.stringify([]));  // command history
    if (sessionStorage.getItem("historyIndex") === null) sessionStorage.setItem("historyIndex", -1);  // command history index

    // Set styles and themes
    const dispatchFullscreen = (mode, force = false) => {
      localStorage.setItem('fullscreen', mode + (force ? " force" : ""));
      dispatch(toggleFullscreen(mode));

      if (enter === "enter" && mode === "split") {
        // fullscreen split mode  use ⌃enter
        dispatch(toggleEnterChange("⌃enter"));
      } else {
        // fullscreen default mode use enter
        dispatch(toggleEnterChange("enter"));
      }
      
      // User logged in
      // If mode is forced, do not update user setting
      if (localStorage.getItem("user") && !force) {
        updateUserSetting("fullscreen", mode);
      }
      reAdjustInputHeight(mode); // Adjust input height
      reAdjustPlaceholder(mode);  // Adjust placeholder
    }

    // Mobile device
    if (isMobileDevice()) {
      if (window.innerWidth < 768) {
        // Don't use fullscreen mode
        dispatchFullscreen("off", true);
        console.log("Force fullscreen off: mobile device widht < 768.");
      }
    } else {
      dispatchFullscreen(localStorage.getItem("fullscreen"));
    }

    // Lanuage
    let lang = "en-US";
    if (localStorage.getItem("lang").includes("force")) {
      // Use forced language
      lang = localStorage.getItem("lang").replace("force", "").trim();
    } else {
      // Use browser language
      const browserLang = navigator.language || navigator.userLanguage;
      if (getLangCodes().includes(browserLang)) {
        lang = browserLang;
        localStorage.setItem("lang", lang);
      } else {
        lang = localStorage.getItem("lang");
      }
    }

    const i18nLang = lang.split("-")[0];  // i18n language, e.g. en for en-US
    if (i18n.language !== i18nLang) {
      i18n.changeLanguage(i18nLang)
        .then(() => {
          console.log("Language: " + lang + ", i18n: " + i18n.language);
          console.log('Language test:', t('hello'));
          setRtl(i18nLang === "ar");
        });
    } else {
      setRtl(i18nLang === "ar");
    }
    
    // Theme
    setTheme(localStorage.getItem("theme"))
    hljs.highlightAll();  // highlight.js

    // Check login user credential
    // If authentication failed, clear local user data
    if (localStorage.getItem("user") !== null) {
      refreshUserInfo();
    }

    // Handle window resize
    const handleResize = () => {
      // Readjust UI
      reAdjustInputHeight(localStorage.getItem("fullscreen"));
      reAdjustPlaceholder(localStorage.getItem("fullscreen"));
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    // Handle global shortcut keys
    const handleKeyDown = (event) => {

      switch (event.key) {
        case "Escape":
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
          if (document.activeElement.id !== "input") {
            const elInput = elInputRef.current;
            if (elInput !== null) {
              event.preventDefault();
              elInput.focus();
            }
          }
          break;
    
        case "/":  // Press / to focus on input
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
            if (global.STATE === STATES.DOING) {
              event.preventDefault();
              command(":stop");
              console.log("Shortcut: ⌃c");
            }
          }
          break;

        case "r":  // clear output and reset session
          if (event.ctrlKey && !event.shiftKey) {
            if (global.STATE === STATES.IDLE) {
              event.preventDefault();
              
              // Clear output and previews
              clearOutput();
              clearPreviewImages();
              clearPreviewVideos();

              // Clear info
              setInfo();
              setStats();
              setEvaluation();
              
              // Focus on input
              const elInput = elInputRef.current;
              elInput.focus();
              command(":clear");
              console.log("Shortcut: ⌃r");
            }
          }

          if (event.ctrlKey && event.shiftKey) {
            if (global.STATE === STATES.IDLE) {
              event.preventDefault();
              command(":reset");
              console.log("Shortcut: ⇧⌃r");
            }
          }
          break;

        case "F11":  // fullscreen mode
          event.preventDefault();

          // Triggle fullscreen split
          if (!localStorage.getItem("fullscreen").startsWith("default")) {
            dispatchFullscreen("default");
          } else {
            dispatchFullscreen("off");
          }

          console.log("Shortcut: F11");
          break;
        
        case "\\":
        case "|":  // fullscreen split mode
          if (event.ctrlKey) {
            event.preventDefault();

            // Triggle fullscreen split
            if (!localStorage.getItem("fullscreen").startsWith("split")) {
              dispatchFullscreen("split");
            } else {
              dispatchFullscreen("off");
            }
            
            console.log("Shortcut: ⌃|");
          }
          break;

        case "ArrowUp":
          // Command history (↑)
          if ((global.rawInput === "" && (global.rawPlaceholder.startsWith(":") || global.rawPlaceholder.startsWith("!")) || (global.rawInput.startsWith(":") || global.rawInput.startsWith("!"))) && !event.ctrlKey && !event.shiftKey && !event.altKey) {
            event.preventDefault();
            console.log("Shortcut: ↑");

            // Set input to previous command history
            const historyIndex = getHistoryCommandIndex();
            const command = getHistoryCommand(historyIndex + 1);
            if (command) {
              setInput(command);
              sessionStorage.setItem("historyIndex", historyIndex + 1);
              reAdjustInputHeight(localStorage.getItem("fullscreen"));
            }
          }

          // Navigation to previous session
          if (event.ctrlKey && !event.shiftKey && !event.altKey) {
            event.preventDefault();
            console.log("Shortcut: ⌃↑");

            // Print session log (previous)
            if (global.STATE === STATES.IDLE) {
              if (!localStorage.getItem("user")) {
                console.error("User not logged in.");
                printOutput("Please log in to view session history.");
                return;
              }

              getHistorySession("prev", sessionStorage.getItem("session"))
                .then((session) => {
                  if (!session) {
                    console.log("No previous session.");
                    printOutput("No previous session.");
                    setSession(-1);
                    return;
                  } else {
                    // Attach to it
                    setSession(session.id);
                    setTime(session.id);
                    printOutput("Session (id:" + session.id + ") attached. Use `→` or `←` to navigate between session logs.\n\n" + JSON.stringify(session.logs, null, 2));
                  }
                });
            } else {
              console.log("Aborted as generating.");
            }
          }
          break;

        case "ArrowDown":
          // Command history (↓)
          if ((global.rawInput === "" && (global.rawPlaceholder.startsWith(":") || global.rawPlaceholder.startsWith("!")) || (global.rawInput.startsWith(":") || global.rawInput.startsWith("!"))) && !event.ctrlKey && !event.shiftKey && !event.altKey) {
            event.preventDefault();
            console.log("Shortcut: ↓");

            // Set input to previous command history
            const historyIndex = getHistoryCommandIndex();
            const command = getHistoryCommand(historyIndex - 1);
            if (command) {
              setInput(command);
              sessionStorage.setItem("historyIndex", historyIndex - 1);
              reAdjustInputHeight(localStorage.getItem("fullscreen"));
            } else {
              // Clear input
              setInput("");
              sessionStorage.setItem("historyIndex", -1);
              reAdjustInputHeight(localStorage.getItem("fullscreen"));
            }
          }

          // Print session log (previous)
          if (event.ctrlKey && !event.shiftKey && !event.altKey) {
            event.preventDefault();
            console.log("Shortcut: ⌃↓");

            if (global.STATE === STATES.IDLE) {
              if (!localStorage.getItem("user")) {
                console.error("User not logged in.");
                printOutput("Please log in to view session history.");
                return;
              }

              getHistorySession("next", sessionStorage.getItem("session"))
                .then((session) => {
                  if (!session) {
                    console.log("No next session.");
                    printOutput("No next session.");
                    setSession(1);
                    return;
                  } else {
                    // Attach to it
                    setSession(session.id);
                    setTime(session.id);
                    printOutput("Session (id:" + session.id + ") attached. Use `→` or `←` to navigate between session logs.\n\n" + JSON.stringify(session.logs, null, 2));
                  }
                });
            } else {
              console.log("Aborted as generating.");
            }
          }
          break;

        case "ArrowLeft":
          if ((document.activeElement.id !== "input" || elInputRef.current.value === "") && !event.ctrlKey && !event.shiftKey && !event.altKey) {
            event.preventDefault();
            console.log("Shortcut: ←");

            // Print session log (previous)
            if (global.STATE === STATES.IDLE) {
              getSessionLog("prev", sessionStorage.getItem("session"), sessionStorage.getItem("time"))
                .then((r) => {
                  if (!r.result || Object.entries(r.result).length === 0) {
                    console.log("No previous log.");
                    printOutput("No previous log.");
                    setTime(-1);
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
            event.preventDefault();
            console.log("Shortcut: k");

            // Print session log (previous)
            if (global.STATE === STATES.IDLE) {
              getSessionLog("prev", sessionStorage.getItem("session"), sessionStorage.getItem("time"))
                .then((r) => {
                  if (!r.result || Object.entries(r.result).length === 0) {
                    console.log("No previous log.");
                    printOutput("No previous log.");
                    setTime(-1);
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
            event.preventDefault();
            console.log("Shortcut: →");

            // Print session log (next)
            if (global.STATE === STATES.IDLE) {
              getSessionLog("next", sessionStorage.getItem("session"), sessionStorage.getItem("time"))
                .then((r) => {
                  if (!r.result || Object.entries(r.result).length === 0) {
                    console.log("No next log.");
                    printOutput("No next log.");
                    setTime(1);
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
            event.preventDefault();
            console.log("Shortcut: j");

            // Print session log (next)
            if (global.STATE === STATES.IDLE) {
              getSessionLog("next", sessionStorage.getItem("session"), sessionStorage.getItem("time"))
                .then((r) => {
                  if (!r.result || Object.entries(r.result).length === 0) {
                    console.log("No next log.");
                    printOutput("No next log.");
                    setTime(1);
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

    // Get system configurations and IP info
    const getSystemInfo = async () => {
      try {
        console.log("Fetching system info...");

        // System info
        const systemInfoResponse = await fetch('/api/system/info');
        const systemInfo = (await systemInfoResponse.json()).result;
        if (systemInfo.init_placeholder) {
          global.rawPlaceholder = systemInfo.init_placeholder;
          setPlaceholder({ text: systemInfo.init_placeholder, height: null });  // Set placeholder text
        }
        if (systemInfo.enter) {
          dispatch(toggleEnterChange(systemInfo.enter));
        }
        if (systemInfo.waiting) setWaiting(systemInfo.waiting);  // Set waiting text
        if (systemInfo.querying) setQuerying(systemInfo.querying);  // Set querying text
        if (systemInfo.generating) setGenerating(systemInfo.generating);  // Set generating text
        if (systemInfo.use_payment) setSubscriptionDisplay(true);  // Set use payment
        if (systemInfo.minimalist) setMinimalist(true);  // Set minimalist

        // IP Info
        const ipInfoResponse = await fetch('/api/system/ip-info');
        const ipInfo = (await ipInfoResponse.json()).result;
        if (ipInfo.country) setCountry(ipInfo.country);  // Set country

        // Set welcome message
        if (systemInfo.welcome_message && !localStorage.getItem("user")) {
          if (systemInfo.welcome_message === "default") {
            printOutput(t("welcome"))
          } else {
            printOutput(systemInfo.welcome_message);
          }
        }
      } catch (error) {
        console.error("There was an error fetching the data:", error);
      }
    }
    getSystemInfo();

    // Initialize global output mutation observer
    global.outputMutationObserver = new MutationObserver(mutationsList => {
      for (let mutation of mutationsList) {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          // Formatter should only works when generating
          if (global.STATE === STATES.DOING) {

            // Markdown formatter
            markdownFormatter(elOutputRef.current);
          }
        }
      }
    });

    // Start observing
    const observingConfig = { childList: true, attributes: false, subtree: true, characterData: true };
    global.outputMutationObserver.observe(elOutputRef.current, observingConfig);

    // Handle hash tag auto removing
    window.addEventListener('hashchange', removeHashTag, false);

    // Readjust UI
    reAdjustInputHeight(localStorage.getItem("fullscreen"));
    reAdjustPlaceholder(localStorage.getItem("fullscreen"));

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
            simulateKeyPress("esc", document.getElementById('input'));
            return;
          }

          // Left swipe show next log
          if (global.STATE === STATES.IDLE) {
            getSessionLog("next", sessionStorage.getItem("session"), sessionStorage.getItem("time"))
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
            simulateKeyPress("tab", document.getElementById('input'));
            return;
          }

          // Right swipe show previous log
          if (global.STATE === STATES.IDLE) {
            getSessionLog("prev", sessionStorage.getItem("session"), sessionStorage.getItem("time"))
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
    if (global.STATE === STATES.DOING) return;
    event.preventDefault();

    // Detect subsession
    if (sessionStorage.getItem("head") !== null && sessionStorage.getItem("head") !== "") {
      const head = Number(sessionStorage.getItem("head"));
      const timelineTime = Number(sessionStorage.getItem("time"));  // time in the timeline
      const session = Number(sessionStorage.getItem("session"));  // session ID
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
    sessionStorage.setItem("head", timeNow);
    sessionStorage.setItem("historyIndex", -1);

    if (global.rawInput === "") return;
    if (global.rawInput.startsWith(":fullscreen") || global.rawInput.startsWith(":theme")) {
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
    let matches = [...global.rawInput.matchAll(/(\+file|\+image|\+img)\[([^\]]+)\]/g)];
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
      global.rawInput = global.rawInput.replace(block, "");
    });
    if (image_urls.length > 0) {
      console.log("Images (input):\n" + image_urls.join("\n"));
    }
    if (file_urls.length > 0) {
      console.log("Files:\n" + file_urls.join("\n"));
    }

    // 2. Replace the full-width characters with half-width
    const input = global.rawInput.trim().replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
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
    global.rawPlaceholder = placeholder;
    
    clearInput();
    reAdjustInputHeight();
    reAdjustPlaceholder();

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
        if (dunutIntervalId && !commandString.startsWith("theme")) {
          clearInterval(dunutIntervalId);
        }
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

        if (global.rawInput.startsWith(":fullscree") || global.rawInput.startsWith(":theme")) {
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
      if (commandString.startsWith("theme")) setTheme(localStorage.getItem("theme"));

      // Readjust UI
      reAdjustInputHeight(localStorage.getItem("fullscreen"));
      reAdjustPlaceholder(localStorage.getItem("fullscreen"));
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

      if (!localStorage.getItem("user")) {
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

        const functionResults = data.function_results;
        console.log("Function Results: " + JSON.stringify(functionResults));

        if (functionResults.length === 1) {
          const functionResult = functionResults[0];
          if (functionResult.success) {
            printOutput(functionResult.message);
          } else {
            printOutput(functionResult.error);
          }
        } else {
          for (let i = 0; i < functionResults.length; i++) {
            const functionResult = functionResults[i];
  
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

    // Clear info and start generating
    resetInfo();
    if (localStorage.getItem('useStream') === "true") {
      // Use SSE request
      generate_sse(input, image_urls_encoded, file_urls_encoded);
    } else {
      // Use general simple API request
      printOutput(waiting === "" ? "Generating..." : waiting);
      generate(input);
    }
  }

  // SSE
  function generate_sse(input, images, files) {
    // If already doing, return
    if (global.STATE === STATES.DOING) return;
    global.STATE = STATES.DOING;

    // Add a waiting text
    if (getOutput() !== querying) printOutput(waiting);

    // preapre speech
    var textSpoken = "";

    const session = sessionStorage.getItem("session");
    const time = sessionStorage.getItem("time");

    const mem_length = sessionStorage.getItem("memLength");

    const functions = localStorage.getItem("functions");
    const role = sessionStorage.getItem("role");
    const store = sessionStorage.getItem("store");
    const node = sessionStorage.getItem("node");

    const use_stats = localStorage.getItem("useStats");
    const use_eval = localStorage.getItem("useEval");
    const use_location = localStorage.getItem("useLocation");
    const location = localStorage.getItem("location");

    const use_system_role = localStorage.getItem("useSystemRole");

    // Vision: Will automatically use vision model if there is any image
    // If use vision model function calling cannot use
    console.log("Input: " + input);
    const config = {
      session: session,
      mem_length: mem_length,
      functions: functions,
      role: role,
      store: store,
      node: node,
      use_stats: use_stats,
      use_eval: use_eval,
      use_location: use_location,
      location: location,
      images: images,
      files: files,
      use_system_role: use_system_role,
    };
    
    console.log("Config: " + JSON.stringify(config));
    const openaiEssSrouce = new EventSource("/api/generate_sse?user_input=" + encodeURIComponent(input) 
                                                           + "&session=" + session
                                                           + "&time=" + time
                                                           + "&mem_length=" + mem_length
                                                           + "&functions=" + functions
                                                           + "&role=" + role
                                                           + "&store=" + store
                                                           + "&node=" + node
                                                           + "&use_stats=" + use_stats
                                                           + "&use_eval=" + use_eval
                                                           + "&use_location=" + use_location
                                                           + "&location=" + location
                                                           + "&images=" + images.join(encodeURIComponent("###"))  
                                                           + "&files=" + files.join(encodeURIComponent("###"))
                                                           + "&use_system_role=" + use_system_role);

    let done_evaluating = false;
    let toolCalls = [];

    openaiEssSrouce.onopen = function(event) {
      console.log("Session start.");
    }

    openaiEssSrouce.onmessage = function(event) {
      if (global.STATE == STATES.IDLE) {
        openaiEssSrouce.close();
        console.log("Session closed by state control.")
        return;
      }

      // I. Handle the environment info
      if (event.data.startsWith("###ENV###")) {
        const _env_ = event.data.replace("###ENV###", "").split(',');
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
        if (localStorage.getItem('useStats') === "true") {
          const _stats_ = event.data.replace("###STATS###", "").split(',');
          const temperature = _stats_[0];
          const top_p = _stats_[1];
          const token_ct = _stats_[2];
          const use_eval = _stats_[3];
          const func = _stats_[4];
          const role = _stats_[5];
          const store = _stats_[6].replaceAll('|', ", ");
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
              mem: {mem}/{sessionStorage.getItem("memLength")}<br></br>
              {role && <div>role: {role}<br></br></div>}
              {store && <div>store: {store}<br></br></div>}
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

        // For node print "Generating...", because it will be slow.
        if (node && _status_.startsWith("Start pre-generating...")) {
          printOutput(generating);
        }

        if (_status_.startsWith("Node AI querying, prompt: ")) {
          const prompt = _status_.replace("Node AI querying, prompt: ", "");
          if (prompt) {
            printOutput("Generating with prompt \"" + prompt + "\"...");
          }
        }

        // Sometime the function calling make it pause
        if (_status_.startsWith("Create chat completion.")) {
          printOutput(generating);
        }
        return;        
      }

      // Handle the DONE signal
      if (event.data === '[DONE]') {
        openaiEssSrouce.close();
        console.log("Session closed.")

        // Print raw output
        console.log(global.rawOutput);

        // Reset state
        global.STATE = STATES.IDLE;

        // Tool calls (function calling)
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
          sessionStorage.setItem("head", timeNow);

          // Call generate with function
          generate_sse(functionInput + " T=" + JSON.stringify(toolCalls) + " Q=" + input, [], []);
          return;
        }

        // Trigger highlight.js
        hljs.highlightAll();

        // Try speak some rest text
        if (localStorage.getItem("useSpeak") === "true") {
          let restText = global.rawOutput.replace(textSpoken, "");
          restText = restText.replaceAll("<br>", " ");
          if (restText.length > 0)
            speak(restText);
        }
        return;
      }

      // VI. Handle error
      if (event.data.startsWith("###ERR###") || event.data.startsWith('[ERR]')) {
        global.STATE = STATES.IDLE;
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
              global.STATE = STATES.IDLE;
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
      if (getOutput() === waiting || getOutput() === querying || getOutput() === generating) {
        clearOutput();
      }

      // Stream output
      let output = event.data;
      if (global.STATE === STATES.DOING) {
        // Print output
        printOutput(output, false, true);
        console.log(event.data);

        // Try speak
        if (localStorage.getItem("useSpeak") === "true") {
          textSpoken = trySpeak(global.rawOutput, textSpoken);
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

  // Normal generate
  async function generate(input) {    
    console.log("Input:\n" + input);
    const config = {
      user_input: input, 
      session: sessionStorage.getItem("session"),
      time: sessionStorage.getItem("time"),
      mem_length: sessionStorage.getItem("memLength"),
      role: sessionStorage.getItem("role"),
      store: sessionStorage.getItem("store"),
      node: sessionStorage.getItem("node"),
      use_stats: localStorage.getItem("useStats"),
      use_eval: localStorage.getItem("useEval"),
      use_location: localStorage.getItem("useLocation"),
      location: localStorage.getItem("location"),
      use_system_role: localStorage.getItem("useSystemRole"),
    };
    console.log("Config: " + JSON.stringify(config));

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
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

      if (localStorage.getItem('useStats') === "true") {
        !minimalist && setStats((
          <div>
            func: {data.result.stats.func.replaceAll('|', ", ") || "none"}<br></br>
            temperature: {data.result.stats.temperature}<br></br>
            top_p: {data.result.stats.top_p}<br></br>
            token_ct: {data.result.stats.token_ct}<br></br>
            mem: {data.result.stats.mem}/{sessionStorage.getItem("memLength")}<br></br>
            {data.result.stats.role ? "role: " + data.result.stats.role + "<br></br>" : ""}
            {data.result.stats.store ? "store: " + data.result.stats.store + "<br></br>" : ""}
            {data.result.stats.node ? "node: " + data.result.stats.node + "<br></br>" : ""}
          </div>
        ));
      }

      !minimalist && setInfo((
        <div>
          model: {data.result.info.model}
          <br></br>
        </div>
      ));
    } catch (error) {
      console.error(error);
      alert(error);
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
        setInput(global.rawPlaceholder);
        reAdjustInputHeight();
      }

      // Auto complete
      if (elInput.value.startsWith(":")) {
        // Auto complete :function use
        if (elInput.value.startsWith(":function use ")) {
          const nameToBeComleted = elInput.value.replace(":function use ", "").replace(/^\"+/, '').replace(/\"$/, '');
          if (nameToBeComleted) {
            const founds = getFunctions().filter((f) => f.name.startsWith(nameToBeComleted) || f.friendly_name.startsWith(nameToBeComleted));
            if (founds.length > 0) {
              const f = founds[0];
              if (f.name.startsWith(nameToBeComleted)) setInput(":function use \"" + f.name + "\"");
              if (f.friendly_name.startsWith(nameToBeComleted)) setInput(":function use \"" + f.friendly_name + "\"");
              reAdjustInputHeight();
              return;
            }
          }
        }

        // Auto complete :function unuse
        if (elInput.value.startsWith(":function unuse ")) {
          const nameToBeComleted = elInput.value.replace(":function unuse ", "").replace(/^\"+/, '').replace(/\"$/, '');
          if (nameToBeComleted) {
            const founds = getFunctions().filter((f) => f.name.startsWith(nameToBeComleted) || f.friendly_name.startsWith(nameToBeComleted));
            if (founds.length > 0) {
              const f = founds[0];
              if (f.name.startsWith(nameToBeComleted)) setInput(":function unuse \"" + f.name + "\"");
              if (f.friendly_name.startsWith(nameToBeComleted)) setInput(":function unuse \"" + f.friendly_name + "\"");
              reAdjustInputHeight();
              return;
            }
          }
        }

        // Auto complete :role use
        if (elInput.value.startsWith(":role use ")) {
          const nameToBeComleted = elInput.value.replace(":role use ", "").replace(/^\"+/, '').replace(/\"$/, '');
          if (nameToBeComleted) {
            const response = await fetch("/api/role/list");
            const data = await response.json();
            if (response.status === 200 && data.success) {
              const role = [].concat(data.result.user_roles, data.result.system_roles).flat()
                             .find((n) => n.role.startsWith(nameToBeComleted));
              if (role) {
                setInput(":role use \"" + role.role + "\"");
                reAdjustInputHeight();
                return;
              }
            }
          }
        }

        // Auto complete :store use
        if (elInput.value.startsWith(":store use ")) {
          const nameToBeComleted = elInput.value.replace(":store use ", "").replace(/^\"+/, '').replace(/\"$/, '');
          if (nameToBeComleted) {
            const response = await fetch("/api/store/list");
            const data = await response.json();
            if (response.status === 200 && data.success) {
              const store = [].concat(data.result.user_stores, data.result.group_stores, data.result.system_stores).flat()
                              .find((n) => n.name.startsWith(nameToBeComleted));
              if (store) {
                setInput(":store use \"" + store.name + "\"");
                reAdjustInputHeight();
                return;
              }
            }
          }
        }

        // Auto complete :node use
        if (elInput.value.startsWith(":node use ")) {
          const nameToBeComleted = elInput.value.replace(":node use ", "").replace(/^\"+/, '').replace(/\"$/, '');
          if (nameToBeComleted) {
            const response = await fetch("/api/node/list");
            const data = await response.json();
            if (response.status === 200 && data.success) {
              const node = [].concat(data.result.user_nodes, data.result.group_nodes, data.result.system_nodes).flat()
                             .find((n) => n.name.startsWith(nameToBeComleted));
              if (node) {
                setInput(":node use \"" + node.name + "\"");
                reAdjustInputHeight();
                return;
              }
            }
          }
        }

        // Auto complete :theme
        if (elInput.value.startsWith(":theme ")) {
          const nameToBeComleted = elInput.value.replace(":theme ", "");
          if (nameToBeComleted) {
            const theme = getThemes().find((n) => n.startsWith(nameToBeComleted));
            if (theme) {
              setInput(":theme " + theme);
              reAdjustInputHeight();
              return;
            }
          }
        }

        // Auto complete :use
        if (elInput.value.startsWith(":use ")) {
          const nameToBeComleted = elInput.value.replace(":use ", "").replace(/^\"+/, '').replace(/\"$/, '');
          if (nameToBeComleted) {
            // Get functions
            const founds = getFunctions().filter((f) => f.name.startsWith(nameToBeComleted) || f.friendly_name.startsWith(nameToBeComleted));
            if (founds.length > 0) {
              const f = founds[0];
              if (f.name.startsWith(nameToBeComleted)) setInput(":use \"" + f.name + "\"");
              if (f.friendly_name.startsWith(nameToBeComleted)) setInput(":use \"" + f.friendly_name + "\"");
              reAdjustInputHeight();
              return;
            }

            // Get node
            const responseNode = await fetch("/api/node/list");
            const dataNode = await responseNode.json();
            if (responseNode.status === 200 && dataNode.success) {
              const node = [].concat(dataNode.result.user_nodes, dataNode.result.group_nodes, dataNode.result.system_nodes).flat()
                             .find((n) => n.name.startsWith(nameToBeComleted));
              if (node) {
                setInput(":use \"" + node.name + "\"");
                reAdjustInputHeight();
                return;
              }
            }

            // Get store
            const responseStore = await fetch("/api/store/list");
            const dataStore = await responseStore.json();
            if (responseStore.status === 200 && dataStore.success) {
              const store = [].concat(dataStore.result.user_stores, dataStore.result.group_stores, dataStore.result.system_stores).flat()
                              .find((n) => n.name.startsWith(nameToBeComleted));
              if (store) {
                setInput(":use \"" + store.name + "\"");
                reAdjustInputHeight();
                return;
              }
            }

            // Get role
            const responseRole = await fetch("/api/role/list");
            const dataRole = await responseRole.json();
            if (responseRole.status === 200 && dataRole.success) {
              const role = [].concat(dataRole.result.user_roles, dataRole.result.system_roles).flat()
                             .find((n) => n.role.startsWith(nameToBeComleted));
              if (role) {
                setInput(":use \"" + role.role + "\"");
                reAdjustInputHeight();
                return;
              }
            }
          }
        }

        // Auto complete :unuse
        if (elInput.value.startsWith(":unuse ")) {
          const nameToBeComleted = elInput.value.replace(":unuse ", "").replace(/^\"+/, '').replace(/\"$/, '');
          if (nameToBeComleted) {
            // Get functions
            const founds = getFunctions().filter((f) => f.name.startsWith(nameToBeComleted) || f.friendly_name.startsWith(nameToBeComleted));
            if (founds.length > 0) {
              const f = founds[0];
              if (f.name.startsWith(nameToBeComleted)) setInput(":unuse \"" + f.name + "\"");
              if (f.friendly_name.startsWith(nameToBeComleted)) setInput(":unuse \"" + f.friendly_name + "\"");
              reAdjustInputHeight();
              return;
            }

            // Get node
            const responseNode = await fetch("/api/node/list");
            const dataNode = await responseNode.json();
            if (responseNode.status === 200 && dataNode.success) {
              const node = [].concat(dataNode.result.user_nodes, dataNode.result.group_nodes, dataNode.result.system_nodes).flat()
                             .find((n) => n.name.startsWith(nameToBeComleted));
              if (node) {
                setInput(":unuse \"" + node.name + "\"");
                reAdjustInputHeight();
                return;
              }
            }

            // Get store
            const responseStore = await fetch("/api/store/list");
            const dataStore = await responseStore.json();
            if (responseStore.status === 200 && dataStore.success) {
              const store = [].concat(dataStore.result.user_stores, dataStore.result.group_stores, dataStore.result.system_stores).flat()
                              .find((n) => n.name.startsWith(nameToBeComleted));
              if (store) {
                setInput(":unuse \"" + store.name + "\"");
                reAdjustInputHeight();
                return;
              }
            }

            // Get role
            const responseRole = await fetch("/api/role/list");
            const dataRole = await responseRole.json();
            if (responseRole.status === 200 && dataRole.success) {
              const role = [].concat(dataRole.result.user_roles, dataRole.result.system_roles).flat()
                             .find((n) => n.role.startsWith(nameToBeComleted));
              if (role) {
                setInput(":unuse \"" + role.role + "\"");
                reAdjustInputHeight();
                return;
              }
            }
          }
        }

        // Auto complete :lang use
        if (elInput.value.startsWith(":lang use ")) {
          const nameToBeComleted = elInput.value.replace(":lang use ", "");
          if (nameToBeComleted) {
            const langCode = getLangCodes().find((n) => n.startsWith(nameToBeComleted));
            if (langCode) {
              setInput(":lang use " + langCode);
              reAdjustInputHeight();
              return;
            }
          }
        }

        // Auto complete :user set
        if (elInput.value.startsWith(":user set ")) {
          const nameToBeComleted = elInput.value.replace(":user set ", "");
          if (nameToBeComleted) {
            const availableSettings = getSettings("keys_string_array");
            const key = availableSettings.find((n) => n.startsWith(nameToBeComleted));
            if (key) {
              setInput(":user set " + key);
              reAdjustInputHeight();
              return;
            }
          }
        }
      }
    }
  };

  // Handle input change
  // Only for general input
  const handleInputChange = (event) => {
    const elInput = elInputRef.current;
    if (elInput.value.startsWith(':login') || elInput.value.startsWith(':user set pass') || elInput.value.startsWith(":user add") || elInput.value.startsWith(":user join")) {
      // Password input
      if (localStorage.getItem("passMask") === "true") {
        global.rawInput = elInput.value.replace(/\*/g, (match, index) => global.rawInput[index] || '');  // store real password
        passwordFormatter(elInputRef.current);
      } else {
        global.rawInput = elInput.value;
      }
    } else {
      // General input
      global.rawInput = elInput.value;
    }
    
    // Re-adjust input height
    reAdjustInputHeight();
  };

  // The placeholder should be shorten if fullscreen off or default
  // For fullscreen split, the placeholder shouldn't be shorten
  const reAdjustPlaceholder = (fullscreen_ = null) => {
    if (!fullscreen_) fullscreen_ = localStorage.getItem("fullscreen");
    
    const placeholder = global.rawPlaceholder;
    const placeholderShortern = ((fullscreen_ === "default" || fullscreen_ === "off") && (placeholder.length >= 45 || placeholder.includes("\n"))) ? 
                                 placeholder.replaceAll("\n", " ").substring(0, 20) + " ..." : placeholder;
    setPlaceholder({ text: placeholderShortern, height: null });
  }

  const reAdjustInputHeight = (fullscreen_ = null) => {
    const elInput = elInputRef.current;
    if (elInput) {
      if (!fullscreen_) fullscreen_ = fullscreen;

      // Fullscreen
      if (fullscreen_ === "default") {
        if (elInput.value) {
          // Has input
          elInput.style.height = "auto";
          elInput.style.height = `${elInput.scrollHeight + 1}px`;

          // If input height is larger than the window height
          // then set it to window height
          if (elInput.scrollHeight > window.innerHeight / 2) {
            elInput.style.height = `${window.innerHeight / 2}px`;
          }
        } else {
          // No input
          elInput.style.height = "45px";
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

      // Non-fullscreen
      if (fullscreen_ === "off") {
        if (elInput.value) {
          // Has input
          elInput.style.height = "auto";
          elInput.style.height = `${elInput.scrollHeight + 1}px`;
        } else {
          // No input
          elInput.style.height = "45px";
        }
      }
    }
  }

  // +img[], +image[], +file[]
  const filePlus = async (blob, type) => {
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
    console.log('Image/file pasted/dropped: ' + blob.name + ' (' + type + ')');

    let message = "null";
    
    // 1. Check file size
    const fileSize = blob.size;
    if (fileSize > 10485760) {
      // 10MB
      message = "file_id:" + file_id + "(failed: file size exceeds 10MB)";
    } else {
      const supportedImageTypes = ["image/png", "image/jpeg", "image/jpg"];
      const supportedFileTypes = ["text/plain", "application/pdf", "application/json",
                                  "text/csv", "application/vnd.ms-excel",
                                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
      const supportedTypes = supportedImageTypes.concat(supportedFileTypes);

      // 2. Check file type
      if (supportedTypes.includes(type)) {
        // Upload the image to S3
        const uploadResult = await generateFileURl(blob, file_id, type);
        if (!uploadResult.success) {
          // Print error message
          console.error(uploadResult.message);
          message = "file_id:" + file_id + "(failed:" + uploadResult.message + ")";
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
                <Image
                  src={image.src}
                  alt={image.alt}
                  placeholder="blur"
                  blurDataURL={image.blurDataURL}
                  width={image.width}
                  height={image.height}
                  quality={100}
                  style={{ width: '100%', height: '100%' }}
                  unoptimized
                />
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
              if (event.ctrlKey) {
                // Copy attach session command to share
                copyText = ":session attach " + sessionStorage.getItem("session");
              } else {
                copyText = global.rawOutput;
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
                <div className={styles.navitem} onClick={() => setContent(CONTENT.USAGE)}>{ t("Usage") }</div>
                {subscriptionDisplay && <div className={styles.navitem} onClick={() => setContent(CONTENT.SUBSCRIPTION)}>{ t("Subcriptions")} </div>}
                <div className={styles.navitem} onClick={() => setContent(CONTENT.PRIVACY)}>{ t("Privacy Policy") }</div>
              </div>
              <div className={styles.content}>
                {content === CONTENT.DOCUMENTATION && <div className={styles.contentitem}>
                  <Documentation country={country} />
                </div>}
                {content === CONTENT.USAGE && <div className={styles.contentitem}>
                  <Usage />
                </div>}
                {subscriptionDisplay && content === CONTENT.SUBSCRIPTION && <div className={styles.contentitem}>
                  <Subscription />
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
