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
import { urlFormatter } from "utils/textUtils";
import { passwordFormatter, maskPassword } from "utils/passwordUtils";
import ReactDOMServer from 'react-dom/server';
import UserDataPrivacy from "components/UserDataPrivacy";
import Copyrights from "components/Copyrights";
import { checkLoginStatus } from "utils/userUtils";

// Status control
const STATES = { IDLE: 0, DOING: 1 };
global.STATE = STATES.IDLE;  // a global state

// Front or back display
const DISPLAY = { FRONT: 0, BACK: 1 };

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
  const [enter, setEnter] = useState("enter");
  const [info, setInfo] = useState();
  const [stats, setStats] = useState();
  const [evaluation, setEvaluation] = useState();
  const [display, setDisplay] = useState(DISPLAY.FRONT);

  // Refs
  const elInputRef = useRef(null);
  const elOutputRef = useRef(null);

  // Global states with Redux
  const dispatch = useDispatch();
  const fullscreen = useSelector(state => state.fullscreen);

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
      if (append) {
        elOutput.innerHTML += text;
        global.rawOutput += text;
      } else {
        elOutput.innerHTML = text;
        global.rawOutput = text;
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
    localStorage.setItem("queryId", Date.now());
    if (localStorage.getItem("useStats") === null) localStorage.setItem("useStats", "false");
    if (localStorage.getItem("useStream") === null) localStorage.setItem("useStream", "true");
    if (localStorage.getItem("useSpeak") === null) localStorage.setItem("useSpeak", "false");
    if (localStorage.getItem("lang") === null) localStorage.setItem("lang", "en-US");  // by default use English
    if (localStorage.getItem("useLocation") === null) localStorage.setItem("useLocation", "false");
    if (localStorage.getItem("fullscreen") === null) localStorage.setItem("fullscreen", "off");
    if (localStorage.getItem("theme") === null) localStorage.setItem("theme", "light");
    if (localStorage.getItem("role") === null) localStorage.setItem("role", "");

    // Set styles and themes
    dispatch(toggleFullscreen(localStorage.getItem("fullscreen")));
    setTheme(localStorage.getItem("theme"))

    // Check login status
    // If authentication failed, clear local user data
    checkLoginStatus();

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
            console.log("Shortcut: ⌃c");
            if (global.STATE === STATES.DOING) {
              event.preventDefault();
            }
            command(":stop");
          }
          break;

        case "r":  // clear output and reset session
          if (event.ctrlKey && !event.shiftKey) {
            console.log("Shortcut: ⌃r");
            if (global.STATE === STATES.IDLE) {
              event.preventDefault();
              clearOutput();
              setInfo();
              setStats();
              setEvaluation();
              command(":clear");
            }
          }

          if (event.ctrlKey && event.shiftKey) {
            console.log("Shortcut: ⇧⌃r");
            if (global.STATE === STATES.IDLE) {
              event.preventDefault();
              clearOutput();
              setInfo();
              setStats();
              setEvaluation();
              command(":reset");
            }
          }
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);

    // Get system configurations
    const getSystemInfo = async () => {
      try {
          const response = await fetch('/api/info/list');
          const result = (await response.json()).result;
          if (result.init_placeholder) {
            global.rawPlaceholder = result.init_placeholder;
            setPlaceholder({ text: result.init_placeholder, height: null });  // Set placeholder text
          }
          if (result.enter) setEnter(result.enter);                              // Set enter key text
          if (result.waiting) setWaiting(result.waiting);                        // Set waiting text
          if (result.querying) setQuerying(result.querying);                     // Set querying text
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
    }
  }, []);

  // On submit input
  async function onSubmit(event) {
    event.preventDefault();

    // Clear info, stats, evaluation
    const resetInfo = () => {
      setInfo();
      setStats();
      setEvaluation();
    }

    // Pre-process the input
    const input = global.rawInput.trim().replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
    if (input.length == 0) return;

    // Clear input and put it to placeholder
    const elInput = elInputRef.current;
    let placeholder = elInput.value;
    if (elInput.value.startsWith(":login") || elInput.value.startsWith(":user set pass")) {
      placeholder = maskPassword(placeholder);  // make sure the password is masked
    }
    global.rawPlaceholder = placeholder;
    const placeholderText = (fullscreen === "default" && (placeholder.length >= 45 || placeholder.includes("\n"))) ? placeholder.replaceAll("\n", " ").substring(0, 40) + " ..." : placeholder;
    setPlaceholder({ text: placeholderText, height: elInput.style.height });
    clearInput();
    reAdjustInputHeight();

    // Command input
    if (input.startsWith(":")) {
      console.log("Command Input: " + input.substring(1));
      const commandResult = await command(input);

      // Use command return to bypass reset output and info
      if (commandResult !== null) {
        console.log("Command Output: " + commandResult);

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
    // Format: !function_name(arg1=value1, arg2=value2, ...)
    // Example: !get_weather(location=Tokyo)
    if (input.startsWith("!")) {
      const function_input = input.substring(1);
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
    
        const functionResult = await response.text();
        console.log("Function Output: " + functionResult);
        if (response.status !== 200) {
          throw data.error || new Error(`Request failed with status ${response.status}`);
        }

        printOutput(functionResult);
      } catch (error) {
        console.error(error);
      }
      return;
    }

    // Clear info and start generating
    resetInfo();
    if (localStorage.getItem('useStream') === "true") {
      // Use SSE request
      generate_sse(input);
    } else {
      // Use general simple API request
      printOutput(waiting);
      generate(input);
    }
  }

  // I. SSE generate
  function generate_sse(input) {
    // If already doing, return
    if (global.STATE === STATES.DOING) return;
    global.STATE = STATES.DOING;

    // Add a waiting text
    if (getOutput() !== querying) printOutput(waiting);

    // preapre speech
    var textSpoken = "";

    const query_id = localStorage.getItem("queryId");
    const role = localStorage.getItem("role");
    const use_stats = localStorage.getItem("useStats");
    const use_location = localStorage.getItem("useLocation");
    const location = localStorage.getItem("location");
    const openaiEssSrouce = new EventSource("/api/generate_sse?user_input=" + encodeURIComponent(input) 
                                                           + "&query_id=" + query_id
                                                           + "&role=" + role
                                                           + "&use_stats=" + use_stats
                                                           + "&use_location=" + use_location
                                                           + "&location=" + location);

    let do_function_calling = false;
    let functionName = "";
    let functionArguements = "";

    openaiEssSrouce.onopen = function(event) {
      console.log("Session start.");
    }

    openaiEssSrouce.onmessage = function(event) {
      if (global.STATE == STATES.IDLE) {
        openaiEssSrouce.close();
        console.log("Session closed by state control.")
        return;
      }

      // Handle the environment info
      if (event.data.startsWith("###ENV###")) {
        const env = event.data.replace("###ENV###", "").split(',');
        const model = env[0];
        setInfo((
          <div>
            model: {model}<br></br>
          </div>
        ));
        return;
      }

      // Handle the function calling
      if (event.data.startsWith("###FUNC###")) {
        do_function_calling = true;
        printOutput(querying);

        const func = event.data.replace("###FUNC###", "");
        const funcObject = JSON.parse(func);
        if (funcObject.name) {
          functionName = funcObject.name;
        }
        if (funcObject.arguments) {
          functionArguements += funcObject.arguments;
        }
        return;
      }

      // Evaluation result
      if (event.data.startsWith("###EVAL###")) {
        const evaluation = event.data.replace("###EVAL###", "");
        const val = parseInt(evaluation);

        let valColor = "#767676";                // default
        if (val >= 7)      valColor = "green";   // green
        else if (val >= 4) valColor = "#CC7722"; // orange
        else if (val >= 0) valColor = "#DE3163"; // red
        setEvaluation(
          <div>
            self_eval_score: <span style={{color: valColor}}>{evaluation}</span><br></br>
          </div>
        );
        return;
      }

      // Stats
      if (event.data.startsWith("###STATS###")) {
        if (localStorage.getItem('useStats') === "true") {
          const stats = event.data.replace("###STATS###", "").split(',');
          const score = stats[0];
          const temperature = stats[1];
          const top_p = stats[2];
          const token_ct = stats[3];
          const use_eval = stats[4];
          const func = stats[5];
          const refer_doc = stats[6];

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
              refer_doc: {refer_doc}<br></br>
              temperature: {temperature}<br></br>
              top_p: {top_p}<br></br>
              token_ct: {token_ct}<br></br>
            </div>
          );
        }
        return;
      }

      // Handle the DONE signal
      if (event.data === '[DONE]') {
        openaiEssSrouce.close();
        console.log("Session closed.")

        // Reset state
        global.STATE = STATES.IDLE;

        // Function calling
        if (do_function_calling) {
          const args = JSON.parse(functionArguements);
          let argsStrings = [];
          for (const [key, value] of Object.entries(args)) {
            console.log(key, value);
            argsStrings.push(key + "=" + value);
          }
          const argsString = argsStrings.join(", ");
          console.log("Function calling: " + functionName + "(" + argsString + ")");
          
          // Generate with function calling
          generate_sse("!" + functionName + "(" + argsString + ")" + " Q=" + input);
          return;
        }

        // URL formatter
        urlFormatter(elOutputRef.current);

        // Try speak some rest text
        if (localStorage.getItem("useSpeak") === "true") {
          let restText = global.rawOutput.replace(textSpoken, "");
          restText = restText.replaceAll("<br>", " ");
          if (restText.length > 0)
            speak(restText);
        }
        return;
      }

      // Handle error
      if (event.data.startsWith("###ERR###") || event.data.startsWith('[ERR]')) {
        openaiEssSrouce.close();
        printOutput("Server error.");
        console.log(event.data);
        return;
      }

      // Stream output
      let output = event.data;
      output = output.replaceAll("###RETURN###", '<br>');
      
      // Clear the waiting or querying text
      if (getOutput() === waiting || getOutput() === querying) {
        clearOutput();
      }

      if (global.STATE === STATES.DOING) {
        // Print output
        printOutput(output, false, true);

        // Try speak
        if (localStorage.getItem("useSpeak") === "true") {
          textSpoken = trySpeak(global.rawOutput, textSpoken);
        }
      }

      console.log(event.data);
    };

    openaiEssSrouce.onerror = function(error) {
      console.log("Other Stream Error: " + JSON.stringify(error));
      openaiEssSrouce.close();
    };
  }

  // II. Normal generate
  async function generate(input) {    
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
            user_input: input, 
            query_id: localStorage.getItem("queryId"),
            role: localStorage.getItem("role"),
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
      const output = data.result.text.split("\n").map((line, line_number) => {
        console.log(line);
        return (
          <div key={line_number}>
            {line}
            <br></br>
          </div>
        );
      });
      const outputHtml = ReactDOMServer.renderToStaticMarkup(output);

      // Print output
      printOutput(outputHtml);

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
    if (elInput.value.startsWith(':login') || elInput.value.startsWith(':user set pass')) {
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

      // Non-fullscreen
      if (fullscreen === "off") {
        if (elInput.value) {
          // Has input
          elInput.style.height = "auto";
          elInput.style.height = `${elInput.scrollHeight + 1}px`;
        } else {
          // No input
          if (placeholder.height) {
            elInput.style.height = placeholder.height;
          }
        }
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
      </Head>

      <main className={styles.main}>
        <div id="btn-dot" onClick={toggleDisplay} className={`${styles.dot} select-none`}>•</div>

        <div className={`${styles.front} ${display === DISPLAY.FRONT ? 'flex' : 'hidden'} fadeIn`}>
          <form className={styles.inputform} onSubmit={onSubmit}>
            <textarea
              id="input"
              ref={elInputRef}
              rows="1"
              className={styles.input}
              placeholder={placeholder.text}
              onChange={handleInputChange}
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
          <div id="wrapper" className={styles.wrapper}>
            <div 
              id="output" 
              ref={elOutputRef}
              className={styles.output}>
            </div>
            {evaluation && stats && <div className={styles.evaluation}>{evaluation}</div>}
            {stats && <div className={styles.stats}>{stats}</div>}
            <div className={styles.info}>{info}</div>
          </div>
        </div>
      
        <div className={`${styles.back} ${display === DISPLAY.BACK ? 'flex' : 'hidden'} fadeIn`}>
          <div className={styles.container}>
            <div className={styles.privacy}>
              <UserDataPrivacy />
            </div>
            <div className={styles.copyrights}>
              <Copyrights />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
