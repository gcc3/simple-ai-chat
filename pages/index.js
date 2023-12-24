import Head from "next/head";
import { useState, useEffect, useRef } from "react";
import defaultStyles from "../styles/pages/index.module.css";
import fullscreenStyles from "../styles/pages/index.fullscreen.module.css";
import fullscreenSplitStyles from "../styles/pages/index.fullscreen.split.module.css";
import command from "command.js";
import { speak, trySpeak } from "utils/speakUtils.js";
import { setTheme } from "utils/themeUtils.js";
import { useDispatch, useSelector } from "react-redux";
import { toggleFullscreen } from "../states/fullscreenSlice.js";
import { markdownFormatter } from "utils/markdownUtils.js";
import { passwordFormatter, maskPassword } from "utils/passwordUtils";
import ReactDOMServer from 'react-dom/server';
import UserDataPrivacy from "components/UserDataPrivacy";
import Usage from "components/Usage";
import Subscription from "components/Subscription";
import Documentation from "components/Documentation";
import Copyrights from "components/Copyrights";
import { refreshUserInfo } from "utils/userUtils";
import { toggleEnterChange } from "states/enterSlice";
import hljs from 'highlight.js';
import { generateFileURl } from "utils/awsUtils";
import { initializeSession } from "utils/sessionUtils";

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

export default function Home() { 
  // States
  const [placeholder, setPlaceholder] = useState("");
  const [waiting, setWaiting] = useState("");
  const [querying, setQuerying] = useState("Querying...");
  const [info, setInfo] = useState();
  const [stats, setStats] = useState();
  const [evaluation, setEvaluation] = useState();
  const [display, setDisplay] = useState(DISPLAY.FRONT);
  const [content, setContent] = useState(CONTENT.DOCUMENTATION);
  const [subscriptionDisplay, setSubscriptionDisplay] = useState(false);

  // Refs
  const elInputRef = useRef(null);
  const elOutputRef = useRef(null);
  const elWrapperRef = useRef(null);

  // Global states with Redux
  const dispatch = useDispatch();
  const fullscreen = useSelector(state => state.fullscreen);
  const enter = useSelector(state => state.enter);

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
  const printImage = (image_url, targetRef, beforeOrAfter = "after") => {
    if (targetRef.current && elWrapperRef.current) {
      // Create a div to hold the image
      const imageDiv = document.createElement('div');
      imageDiv.className = "mb-5 image-preview";

      // Create an image and append it to div
      const img = document.createElement('img');
      img.className = "";
      img.style.width = "100%";
      img.style.height = "100%";
      imageDiv.appendChild(img);

      // Set the image attributes
      img.src = image_url;  // The URL of the image
      img.alt = image_url;  // Alternative text for the image

      // Append the image to the div with the ref
      if (beforeOrAfter === "after") {
        elWrapperRef.current.appendChild(imageDiv);
      } else if (beforeOrAfter === "before") {
        elWrapperRef.current.insertBefore(imageDiv, targetRef.current);
      }
    } else {
      console.error("Target ref is null.");
    }
  };

  // Print video output (support: YouTube)
  const printVideo = (video_url, targetRef, beforeOrAfter = "after") => {
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
      
      // Extract the YouTube video ID from the URL
      const videoId = video_url.split('v=')[1].split('&')[0];
      iframe.src = `https://www.youtube.com/embed/${videoId}`; // The URL for the YouTube video embed
      iframe.title = "YouTube video player";
      iframe.frameBorder = "0";
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

  // Print session log
  const printSessionLog = async function(log) {
    console.log("Time set to log time: " + log["time"])
    sessionStorage.setItem("time", log["time"]);
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
    setPlaceholder({ text: log["input"], height: null });
    global.rawPlaceholder = log["input"];

    // Print output
    printOutput(log["output"]);
    global.rawOutput = log["output"];

    setInfo((
      <div>
        model: {log["model"]}<br></br>
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

  // Initializing
  useEffect(() => { 
    initializeSession();

    // Set default localStorage values
    if (localStorage.getItem("_up") === null) localStorage.setItem("_up", Date.now());
    if (localStorage.getItem("useStats") === null) localStorage.setItem("useStats", "false");
    if (localStorage.getItem("useEval") === null) localStorage.setItem("useEval", "false");
    if (localStorage.getItem("useStream") === null) localStorage.setItem("useStream", "true");
    if (localStorage.getItem("useSpeak") === null) localStorage.setItem("useSpeak", "false");
    if (localStorage.getItem("lang") === null) localStorage.setItem("lang", "en-US");  // by default use English
    if (localStorage.getItem("useLocation") === null) localStorage.setItem("useLocation", "false");
    if (localStorage.getItem("fullscreen") === null) localStorage.setItem("fullscreen", "off");
    if (localStorage.getItem("theme") === null) localStorage.setItem("theme", "light");

    // Set default sessionStorage values
    if (sessionStorage.getItem("role") === null) sessionStorage.setItem("role", "");
    if (sessionStorage.getItem("store") === null) sessionStorage.setItem("store", "");
    if (sessionStorage.getItem("node") === null) sessionStorage.setItem("node", "");
    if (sessionStorage.getItem("time") === null) sessionStorage.setItem("time", Date.now());

    // Set styles and themes
    dispatch(toggleFullscreen(localStorage.getItem("fullscreen")));
    if (enter === "enter" && localStorage.getItem("fullscreen") === "split") {
      dispatch(toggleEnterChange("⌃enter"));  // For fullscreen split mode, use ⌃enter to submit
    }
    setTheme(localStorage.getItem("theme"))
    hljs.highlightAll();  // highlight.js

    // Check login user credential
    // If authentication failed, clear local user data
    if (localStorage.getItem("user") !== null) {
      refreshUserInfo();
    }

    // Handle window resize
    const handleResize = () => {
      reAdjustInputHeight();
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
              clearOutput();
              setInfo();
              setStats();
              setEvaluation();
              command(":clear");
              console.log("Shortcut: ⌃r");
            }
          }

          if (event.ctrlKey && event.shiftKey) {
            if (global.STATE === STATES.IDLE) {
              event.preventDefault();
              clearOutput();
              setInfo();
              setStats();
              setEvaluation();
              command(":reset");
              console.log("Shortcut: ⇧⌃r");
            }
          }
          break;

        case "ArrowLeft":
          if ((document.activeElement.id !== "input" || elInputRef.current.value === "") && !event.ctrlKey && !event.shiftKey && !event.altKey) {
            event.preventDefault();
            console.log("Shortcut: ←");

            // Print session log (previous)
            if (global.STATE === STATES.IDLE) {
              getSessionLog("prev", sessionStorage.getItem("queryId"), sessionStorage.getItem("time"))
                .then((r) => {
                  if (Object.entries(r.result).length === 0) {
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
            event.preventDefault();
            console.log("Shortcut: k");

            // Print session log (previous)
            if (global.STATE === STATES.IDLE) {
              getSessionLog("prev", sessionStorage.getItem("queryId"), sessionStorage.getItem("time"))
                .then((r) => {
                  if (Object.entries(r.result).length === 0) {
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
            event.preventDefault();
            console.log("Shortcut: →");

            // Print session log (next)
            if (global.STATE === STATES.IDLE) {
              getSessionLog("next", sessionStorage.getItem("queryId"), sessionStorage.getItem("time"))
                .then((r) => {
                  if (Object.entries(r.result).length === 0) {
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
            event.preventDefault();
            console.log("Shortcut: j");

            // Print session log (next)
            if (global.STATE === STATES.IDLE) {
              getSessionLog("next", sessionStorage.getItem("queryId"), sessionStorage.getItem("time"))
                .then((r) => {
                  if (Object.entries(r.result).length === 0) {
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

    // Get system configurations
    const getSystemInfo = async () => {
      try {
          console.log("Fetching system info...");
          const response = await fetch('/api/info/list');
          const result = (await response.json()).result;
          if (result.init_placeholder) {
            global.rawPlaceholder = result.init_placeholder;
            setPlaceholder({ text: result.init_placeholder, height: null });  // Set placeholder text
          }
          if (result.enter) {
            dispatch(toggleEnterChange(result.enter));
          }
          if (result.waiting) setWaiting(result.waiting);  // Set waiting text
          if (result.querying) setQuerying(result.querying);  // Set querying text
          if (result.use_payment) setSubscriptionDisplay(true);  // Set use payment

          // Set welcome message
          if (result.welcome_message && !localStorage.getItem("user")) {
            printOutput(result.welcome_message);
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

    // Cleanup
    return () => {
      // Remove event listener, this is necessary
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('hashchange', removeHashTag);
    }
  }, []);

  // On submit input
  async function onSubmit(event) {
    if (global.STATE === STATES.DOING) return;
    event.preventDefault();
    sessionStorage.setItem("time", Date.now());  // update time

    // Clear output and preview images
    clearOutput();
    clearPreviewImages();
    clearPreviewVideos();

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
      console.log("Images:\n" + image_urls.join("\n"));
      image_urls.map((image_url) => {
        printImage(image_url, elOutputRef, "before");
      });
    }
    if (file_urls.length > 0) {
      console.log("Files:\n" + file_urls.join("\n"));
    }

    // 2. Replace the full-width characters
    const input = global.rawInput.trim().replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
    if (input.length == 0) return;

    // Clear input and put it to placeholder
    const elInput = elInputRef.current;
    let placeholder = elInput.value;
    if (elInput.value.startsWith(":login") || elInput.value.startsWith(":user set pass") || elInput.value.startsWith(":user add") || elInput.value.startsWith(":user join")) {
      placeholder = maskPassword(placeholder);  // make sure the password is masked
    }
    global.rawPlaceholder = placeholder;
    const placeholderText = ((fullscreen === "default" || fullscreen === "off") && (placeholder.length >= 45 || placeholder.includes("\n"))) ? placeholder.replaceAll("\n", " ").substring(0, 40) + " ..." : placeholder;
    setPlaceholder({ text: placeholderText, height: elInput.style.height });
    clearInput();
    reAdjustInputHeight();

    // Command input
    if (input.startsWith(":")) {
      console.log("Command Input:\n" + input);

      // Get command result
      const files = file_urls.concat(image_urls);
      const commandResult = await command(input, files);

      // Use command return to bypass reset output and info
      if (commandResult !== null) {
        console.log("Command Output:\n" + commandResult);

        // Print the output
        printOutput(commandResult);
        resetInfo();
      } else {
        console.log("Not command output.")
      }

      // For some command apply immediately
      if (input.startsWith(":theme")) setTheme(localStorage.getItem("theme"));
      return;
    }

    // Function CLI
    // Format: !function_name({ "arg1":"value1", "arg2":"value2", ... })
    // Example: !get_weather({ "location":"Tokyo" })
    // Support multple functions: !function_name({ "arg1":"value1", "arg2":"value2", ... }),!function_name({ "arg1":"value1", "arg2":"value2", ... })
    // Example: !get_weather({ "location":"Tokyo" }),!get_time({ "timezone":"America/Los_Angeles" })
    if (input.startsWith("!")) {
      const functions = input.substring(1).split(",!");
      console.log("Function CLI: " + JSON.stringify(functions));

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

        if (response.status !== 200) {
          throw response.error || new Error(`Request failed with status ${response.status}`);
        }

        const responseJson = await response.json();
        if (!responseJson.success) {
          console.log("Function Error: " + responseJson.error);
          printOutput(responseJson.error);
          return;
        }

        const functionResults = responseJson.function_results;
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

    const query_id = sessionStorage.getItem("queryId");
    const role = sessionStorage.getItem("role");
    const store = sessionStorage.getItem("store");
    const node = sessionStorage.getItem("node");

    const use_stats = localStorage.getItem("useStats");
    const use_eval = localStorage.getItem("useEval");
    const use_location = localStorage.getItem("useLocation");
    const location = localStorage.getItem("location");

    // Vision: Will automatically use vision model if there is any image
    // If use vision model function calling cannot use
    console.log("Input: " + input);
    const config = {
      query_id: query_id,
      role: role,
      store: store,
      node: node,
      use_stats: use_stats,
      use_eval: use_eval,
      use_location: use_location,
      location: location,
      images: images,
      files: files
    };
    console.log("Config: " + JSON.stringify(config));
    const openaiEssSrouce = new EventSource("/api/generate_sse?user_input=" + encodeURIComponent(input) 
                                                           + "&query_id=" + query_id
                                                           + "&role=" + role
                                                           + "&store=" + store
                                                           + "&node=" + node
                                                           + "&use_stats=" + use_stats
                                                           + "&use_eval=" + use_eval
                                                           + "&use_location=" + use_location
                                                           + "&location=" + location
                                                           + "&images=" + images.join(encodeURIComponent("###"))  
                                                           + "&files=" + files.join(encodeURIComponent("###")));

    let do_function_calling = false;
    let done_evaluating = false;
    let functionName = "";
    let functionArgsString = "";
    let do_tool_calls = false;
    let tools = [];

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
        setInfo((
          <div>
            model: {model}<br></br>
          </div>
        ));
        return;
      }

      // II. Handle the callings (tool calls)
      if (event.data.startsWith("###CALL###")) {
        do_tool_calls = true;
        printOutput(querying);

        const tool = (JSON.parse(event.data.replace("###CALL###", "")))[0];
        const toolsSameIndex = tools.find(t => t.index === tool.index);
        if (toolsSameIndex) {
          // Found same index tool
          toolsSameIndex.function.arguments += tool.function.arguments;
        } else {
          // If not found, add the tool
          tools.push(tool);
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
        setEvaluation(
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
          const store = _stats_[6];
          const node = _stats_[7];

          if (use_eval === "true" && !done_evaluating) {
            setEvaluation(
              <div>
                self_eval_score: evaluating...<br></br>
              </div>
            );
          }

          setStats(
            <div>
              func: {func || "none"}<br></br>
              temperature: {temperature}<br></br>
              top_p: {top_p}<br></br>
              token_ct: {token_ct}<br></br>
              {role && <div>role: {role}<br></br></div>}
              {store && <div>store: {store}<br></br></div>}
              {node && <div>node: {node}<br></br></div>}
            </div>
          );
        }
        return;
      }

      // V. Handle the DONE signal
      if (event.data === '[DONE]') {
        openaiEssSrouce.close();
        console.log("Session closed.")

        // Print raw output
        console.log(global.rawOutput);

        // Reset state
        global.STATE = STATES.IDLE;

        // Function calling
        if (do_function_calling) {
          const functionInput = "!" + functionName + "(" + functionArgsString + ")";
          
          // Generate with function calling
          console.log("Function calling: " + functionInput);
          if (input.startsWith("!")) {
            input = input.split("Q=")[1];
          }

          generate_sse(functionInput + " Q=" + input, [], []);
          return;
        }

        // Tool calls
        if (do_tool_calls) {
          let functions = [];
          tools.map((tool) => {
            functions.push("!" + tool.function.name + "(" + tool.function.arguments + ")");
          });
          const functionInput = functions.join(",");

          // Generate with tool calls (function calling)
          console.log("Tool calls: " + functionInput);
          if (input.startsWith("!")) {
            input = input.split("Q=")[1];
          }

          generate_sse(functionInput + " Q=" + input, [], []);
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
        openaiEssSrouce.close();
        printOutput("Server error.");
        console.log(event.data);
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
      if (getOutput() === waiting || getOutput() === querying) {
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
      console.log("Other Stream Error: " + JSON.stringify(error));
      openaiEssSrouce.close();
      return;
    };
  }

  // Normal generate
  async function generate(input) {    
    console.log("Input:\n" + input);
    const config = {
      user_input: input, 
      query_id: sessionStorage.getItem("queryId"),
      role: sessionStorage.getItem("role"),
      store: sessionStorage.getItem("store"),
      node: sessionStorage.getItem("node"),
      use_stats: localStorage.getItem("useStats"),
      use_eval: localStorage.getItem("useEval"),
      use_location: localStorage.getItem("useLocation"),
      location: localStorage.getItem("location"),
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
        setStats((
          <div>
            func: {data.result.stats.func || "none"}<br></br>
            temperature: {data.result.stats.temperature}<br></br>
            top_p: {data.result.stats.top_p}<br></br>
            token_ct: {data.result.stats.token_ct}<br></br>
            {data.result.stats.role ? "role: " + data.result.stats.role + "<br></br>" : ""}
            {data.result.stats.store ? "store: " + data.result.stats.store + "<br></br>" : ""}
            {data.result.stats.node ? "node: " + data.result.stats.node + "<br></br>" : ""}
          </div>
        ));
      }

      setInfo((
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
  const handleInputKeyDown = (event) => {
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
    // Input from placeholder when pressing tab
    if (event.keyCode === 9 || event.which === 9) {
      event.preventDefault();
      if (elInput.value.length === 0) {
        setInput(global.rawPlaceholder);
        reAdjustInputHeight();
      }
    }
  };

  // Handle input change
  // Only for general input
  const handleInputChange = (event) => {
    const elInput = elInputRef.current;
    if (elInput.value.startsWith(':login') || elInput.value.startsWith(':user set pass') || elInput.value.startsWith(":user add") || elInput.value.startsWith(":user join")) {
      // Password input
      global.rawInput = elInput.value.replace(/\*/g, (match, index) => global.rawInput[index] || '');  // store real password
      passwordFormatter(elInputRef.current);
    } else {
      // General input
      global.rawInput = elInput.value;
    }
    
    // Re-adjust input height
    reAdjustInputHeight();
  };

  const reAdjustInputHeight = () => {
    const elInput = elInputRef.current;
    if (elInput) {

      // Fullscreen
      if (fullscreen === "default") {
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
      if (fullscreen === "split") {
        elInput.style.height = "100%";
      }

      // Non-fullscreen
      if (fullscreen === "off") {
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
        <div id="btn-dot" onClick={toggleDisplay} className={`${styles.dot} select-none`}>{display === DISPLAY.FRONT ? "•" : "╳"}</div>

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
            <div 
              id="output" 
              ref={elOutputRef}
              className={styles.output}>
            </div>
            {evaluation && stats && <div className={styles.evaluation}>{evaluation}</div>}
            {stats && <div className={styles.stats}>{stats}</div>}
            <div className={styles.info} onClick={() => {
              // Copy attach session command to share
              const attachCommand = ":session attach " + sessionStorage.getItem("queryId");
              navigator.clipboard.writeText(attachCommand);
              console.log("Copied command:\n" + attachCommand);
            }}>{info}</div>
          </div>
        </div>
      
        {display === DISPLAY.BACK &&
          <div className={`${styles.back} ${display === DISPLAY.BACK ? 'flex' : 'hidden'} fadeIn`}>
            <div className={styles.container}>
              <div className={styles.nav}>
                <div className={styles.navitem} onClick={() => setContent(CONTENT.DOCUMENTATION)}>Documentation</div>
                <div className={styles.navitem} onClick={() => setContent(CONTENT.USAGE)}>Usage</div>
                {subscriptionDisplay && <div className={styles.navitem} onClick={() => setContent(CONTENT.SUBSCRIPTION)}>Subcriptions</div>}
                <div className={styles.navitem} onClick={() => setContent(CONTENT.PRIVACY)}>Privacy Policy</div>
              </div>
              <div className={styles.content}>
                {content === CONTENT.DOCUMENTATION && <div className={styles.contentitem}>
                  <Documentation />
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
