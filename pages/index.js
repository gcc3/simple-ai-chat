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

  // Print output
  const printImage = (image_url, targetRef, beforeOrAfter = "after") => {
    if (targetRef.current && elWrapperRef.current) {
      // Create a div to hold the image
      const imageDiv = document.createElement('div');
      imageDiv.className = "p-1 mb-5 image-preview";

      // Create an image and append it to div
      const img = document.createElement('img');
      img.className = "rounded-md";
      img.src = image_url;  // The URL of the image
      img.alt = image_url;  // Alternative text for the image
      imageDiv.appendChild(img);

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
    sessionStorage.setItem("time",log["time"]);
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

    printOutput(log["output"]);
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

  // Initializing
  useEffect(() => {
    initializeSession();

    // Set default sessionStorage values
    if (sessionStorage.getItem("role") === null) sessionStorage.setItem("role", "");
    if (sessionStorage.getItem("store") === null) sessionStorage.setItem("store", "");

    // Set default localStorage values
    if (localStorage.getItem("useStats") === null) localStorage.setItem("useStats", "false");
    if (localStorage.getItem("useStream") === null) localStorage.setItem("useStream", "true");
    if (localStorage.getItem("useSpeak") === null) localStorage.setItem("useSpeak", "false");
    if (localStorage.getItem("lang") === null) localStorage.setItem("lang", "en-US");  // by default use English
    if (localStorage.getItem("useLocation") === null) localStorage.setItem("useLocation", "false");
    if (localStorage.getItem("fullscreen") === null) localStorage.setItem("fullscreen", "off");
    if (localStorage.getItem("theme") === null) localStorage.setItem("theme", "light");

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
      const elInput = elInputRef.current;

      switch (event.key) {
        case "Escape":
          if (document.activeElement.id === "input") {
            // If there is input, use ESC to clear input
            if (elInput.value.length > 0) {
              event.preventDefault();
              clearInput("");
            } else {
              // ESC to unfocus input
              event.preventDefault();
              elInput.blur();
            }
          }
          break;
    
        case "Tab":  // TAB to focus on input
          if (document.activeElement.id !== "input") {
            event.preventDefault();
            elInput.focus();
          }
          break;
    
        case "/":  // Press / to focus on input
          if (document.activeElement.id !== "input") {
            event.preventDefault();
            elInput.focus();
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
        case "k":
          if (document.activeElement.id !== "input" && !event.ctrlKey && !event.shiftKey && !event.altKey) {
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

        case "ArrowRight":
        case "j":
          if (document.activeElement.id !== "input" && !event.ctrlKey && !event.shiftKey && !event.altKey) {
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
          if (result.waiting) setWaiting(result.waiting);                     // Set waiting text
          if (result.querying) setQuerying(result.querying);                  // Set querying text
          if (result.use_payment) setSubscriptionDisplay(true);              // Set use payment
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

    // Cleanup
    return () => {
      // Remove event listener, this is necessary
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener('resize', handleResize);
    }
  }, []);

  // On submit input
  async function onSubmit(event) {
    event.preventDefault();
    sessionStorage.setItem("time", Date.now());  // update time

    // Clear output and preview images
    clearOutput();
    clearPreviewImages();

    // Clear info, stats, evaluation
    const resetInfo = () => {
      setInfo();
      setStats();
      setEvaluation();
    }

    // Pre-process the input
    // 1. Extract the files/images if there is any
    // files starts with +file[url] or +image[url] or +img[url]
    let image_urls = [];
    let image_urls_encoded = [];
    let file_urls = [];
    let file_urls_encoded = [];
    const inputBlocks = global.rawInput.split(/[\s\n]+/);
    for (let i = 0; i < inputBlocks.length; i++) {
      if (inputBlocks[i].startsWith("+image[") || inputBlocks[i].startsWith("+img[")) {
        const block = inputBlocks[i];
        const url = block.replace("+image[", "").replace("+img[", "").replace("]", "");
        if (!url.startsWith("http")) {
          console.error("Invalid URL: " + url);
          printOutput("URL must start with http or https.");
          return;
        }
        image_urls.push(url);
        image_urls_encoded.push(encodeURIComponent(url));
        global.rawInput = global.rawInput.replace(inputBlocks[i], "");
      }

      if (inputBlocks[i].startsWith("+file[")) {
        const block = inputBlocks[i];
        const url = block.replace("+file[", "").replace("]", "");
        if (!url.startsWith("http")) {
          console.error("Invalid URL: " + url);
          printOutput("URL must start with http or https.");
          return;
        }
        file_urls.push(url);
        file_urls_encoded.push(encodeURIComponent(url));
        global.rawInput = global.rawInput.replace(inputBlocks[i], "");
      }
    }
    if (image_urls.length > 0) {
      console.log("Images:\n" + image_urls.join("\n"));
      image_urls.map((image_url) => {
        printImage(image_url, elOutputRef, "before");
      });
    }
    if (file_urls_encoded.length > 0) console.log("Files:" + file_urls_encoded.join("\n"));

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
      console.log("Command Input:\n" + input.substring(1));
      const commandResult = await command(input);

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
    if (input.startsWith("!")) {
      const function_input = input.substring(1);
      if (!function_input.includes("(") || !function_input.includes(")")) {
        console.error("Invalid function input: " + function_input);
        printOutput("Invalid function input.");
        return;
      }

      const funcName = function_input.split("(")[0];
      const funcArgs = function_input.split("(")[1].split(")")[0];
      console.log("Function Input: " + input.substring(1));
      console.log("Function Name: " + funcName);
      console.log("Function Args: " + funcArgs);

      try {
        const response = await fetch("/api/function/exec?func=" + funcName + "&args=" + funcArgs, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const functionResult = JSON.parse(await response.text()).result;

        console.log("Function Output: " + functionResult);
        if (response.status !== 200) {
          throw response.error || new Error(`Request failed with status ${response.status}`);
        }

        // Handle event
        if (functionResult.event) {
          const _event = functionResult.event;
          console.log("Event(Function CLI): " + JSON.stringify(_event));

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

        printOutput(functionResult.message);
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

    const use_stats = localStorage.getItem("useStats");
    const use_location = localStorage.getItem("useLocation");
    const location = localStorage.getItem("location");

    // Vision: Will automatically use vision model if there is any image
    // If use vision model function calling cannot use
    const openaiEssSrouce = new EventSource("/api/generate_sse?user_input=" + encodeURIComponent(input) 
                                                           + "&query_id=" + query_id
                                                           + "&role=" + role
                                                           + "&store=" + store
                                                           + "&use_stats=" + use_stats
                                                           + "&use_location=" + use_location
                                                           + "&location=" + location
                                                           + "&images=" + images.join(encodeURIComponent("###"))  
                                                           + "&files=" + files.join(encodeURIComponent("###")));

    let do_function_calling = false;
    let functionName = "";
    let functionArgsString = "";
    let do_tool_calls = false;
    let toolsObjectString = "";

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

      // II. Handle the callings (function or tool)
      // 1. Function call
      if (event.data.startsWith("###FUNC###")) {
        do_function_calling = true;
        printOutput(querying);

        const _func_ = event.data.replace("###FUNC###", "");
        const funcObject = JSON.parse(_func_);
        if (funcObject.name) {
          functionName = funcObject.name;
        }
        if (funcObject.arguments) {
          functionArgsString += funcObject.arguments;
        }
        return;
      }

      // 2. Tool calls
      if (event.data.startsWith("###TOOL###")) {
        do_tool_calls = true;
        printOutput(querying);

        const _tool_ = event.data.replace("###TOOL###", "");
        const toolsObject = JSON.parse(_tool_);
        toolsObject.map((tool) => {
          if (tool.id) {
            functionName = tool.name;
            if (tool.arguments) {
              functionArgsString += tool.arguments;
            }
          }
        });
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
        return;
      }

      // IV. Stats
      if (event.data.startsWith("###STATS###")) {
        if (localStorage.getItem('useStats') === "true") {
          const _stats_ = event.data.replace("###STATS###", "").split(',');
          const score = _stats_[0];
          const temperature = _stats_[1];
          const top_p = _stats_[2];
          const token_ct = _stats_[3];
          const use_eval = _stats_[4];
          const func = _stats_[5];

          if (use_eval === "true") {
            setEvaluation(
              <div>
                self_eval_score: evaluating...<br></br>
              </div>
            );
          }

          setStats(
            <div>
              dict_search_score: {score}<br></br>
              func: {func || "none"}<br></br>
              temperature: {temperature}<br></br>
              top_p: {top_p}<br></br>
              token_ct: {token_ct}<br></br>
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
          const funcInput = "!" + functionName + "(" + functionArgsString + ")";
          
          // Generate with function calling
          console.log("Function calling: " + funcInput);
          generate_sse(funcInput + " Q=" + input, [], []);
          return;
        }

        // Tool calls
        if (do_tool_calls) {
          const toolInput = "!call_tools(" + toolsObjectString + ")";
          
          // Generate with tool calls
          console.log("Tool calls: " + toolInput);
          generate_sse(toolInput + " Q=" + input, [], []);
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

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
            user_input: input, 
            query_id: sessionStorage.getItem("queryId"),
            role: sessionStorage.getItem("role"),
            store: sessionStorage.getItem("store"),
            use_stats: localStorage.getItem("useStats"),
            use_location: localStorage.getItem("useLocation"),
            location: localStorage.getItem("location"),
          }),
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
        const score = data.result.stats.score;
        
        setStats((
          <div>
            dict_search_score: {score}<br></br>
            func: {data.result.stats.func || "none"}<br></br>
            temperature: {data.result.stats.temperature}<br></br>
            top_p: {data.result.stats.top_p}<br></br>
            token_ct: {data.result.stats.token_ct}<br></br>
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
      alert(error.message);
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

  // +img[] or +image[]
  const imagePlus = async (blob) => {
    // Insert placeholder text for the image
    const file_id = Date.now().toString();
    const imagePlaceholder = "+img[file_id:" + file_id +"(uploading...)] ";

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
    setInput(textBefore + imagePlaceholder + textAfter);
    reAdjustInputHeight();  // Re-adjust input height as input changed

    // Grab the file
    console.log('Image pasted: ' + blob.name);

    // Upload the image to S3
    const uploadResult = await generateFileURl(blob, file_id);
    if (!uploadResult.success) {
      console.error(uploadResult.message);
      setInput(elInputRef.current.value.replaceAll("file_id:" + file_id + "(uploading...)", "file_id:" + file_id + "(failed:" + uploadResult.message + ")"));
    } else {
      // Replace the placeholder text with the image URL
      setInput(elInputRef.current.value.replaceAll("file_id:" + file_id + "(uploading...)", uploadResult.objectUrl));
    }

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
      if (items[i].type.indexOf('image') === 0) {
        // prevent the default behavior
        event.preventDefault();

        // Generate +image
        imagePlus(items[i].getAsFile());
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
      if (droppedFiles[i].type.indexOf('image') === 0) {
        // prevent the default behavior
        event.preventDefault();

        // Generate +image
        imagePlus(droppedFiles[i]);
      }
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
                {subscriptionDisplay && <div className={styles.navitem} onClick={() => setContent(CONTENT.SUBSCRIPTION)}>Subscription</div>}
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
