import Head from "next/head";
import { useState, useEffect } from "react";
import defaultStyles from "../styles/pages/index.module.css";
import fullscreenStyles from "../styles/pages/index.fullscreen.module.css";
import command from "command.js";
import { speak, trySpeak } from "utils/speakUtils.js";
import { setTheme } from "utils/themeUtils.js";
import { useDispatch, useSelector } from "react-redux";
import { toggleFullscreen, reverseFullscreen } from "../states/fullscreenSlice.js";
import { markdownFormatter } from "utils/markdownUtils.js";
import { urlFormatter } from "utils/textUtils.js";
import ReactDOMServer from 'react-dom/server';

// Status control
const STATES = { IDLE: 0, DOING: 1 };
global.STATE = STATES.IDLE;  // a global state

// Mutation observer
global.outputMutationObserver = null;  // will setup in useEffect

// Print output
global.rawOutput = "";
function printOutput(text, ignoreFormatter=true, append=false) {
  const outputElement = document.getElementById("output");

  if (outputElement) {
    if (ignoreFormatter) {
      // Temproary stop observing
      // For some output, we don't want to format it
      global.outputMutationObserver.disconnect();
    }

    // Print the output
    if (append) {
      outputElement.innerHTML += text;
      global.rawOutput += text;
    } else {
      outputElement.innerHTML = text;
      global.rawOutput = text;
    }

    if (ignoreFormatter) {
      // Resume observing
      global.outputMutationObserver.observe((outputElement), { 
        childList: true, 
        attributes: false, 
        subtree: true,
        characterData: true
      });
    }
  }
};

// Clear output
function clearOutput() {
  printOutput("");
}

// Get output
function getOutput() {
  return document.getElementById("output").innerHTML;
}

export default function Home() {
  // States
  const [userInput, setUserInput] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const [waiting, setWaiting] = useState("...");
  const [querying, setQuerying] = useState("...");
  const [enter, setEnter] = useState("enter");
  const [info, setInfo] = useState();
  const [stats, setStats] = useState();
  const [evaluation, setEvaluation] = useState();

  // Global states with Redux
  const dispatch = useDispatch();
  const isFullscreen = useSelector(state => state.isFullscreen);

  // Initializing
  useEffect(() => {
    localStorage.setItem("queryId", Date.now());
    if (localStorage.getItem("useStats") === null) localStorage.setItem("useStats", "false");
    if (localStorage.getItem("useStream") === null) localStorage.setItem("useStream", "true");
    if (localStorage.getItem("useSpeak") === null) localStorage.setItem("useSpeak", "false");
    if (localStorage.getItem("lang") === null) localStorage.setItem("lang", "en-US");  // by default use English
    if (localStorage.getItem("useLocation") === null) localStorage.setItem("useLocation", "false");
    if (localStorage.getItem("useFullscreen") === null) localStorage.setItem("useFullscreen", "false");
    if (localStorage.getItem("theme") === null) localStorage.setItem("theme", "light");
    if (localStorage.getItem("role") === null) localStorage.setItem("role", "");

    // Set styles and themes
    dispatch(toggleFullscreen(localStorage.getItem("useFullscreen") === "true"));
    setTheme(localStorage.getItem("theme"))

    // Global shortcut keys
    window.addEventListener("keydown", (event) => {
      switch (event.key) {
        case "Escape":
          if (document.activeElement.id === "input") {
            // If there is input, ECS to clear input
            // userInput.length not work
            if (document.getElementById("input").value.length > 0) {
              setUserInput("");
              event.preventDefault();
            } else {
              // ESC to unfocus input
              document.getElementById("input").blur();
              event.preventDefault();
            }
          }
          break;
    
        case "Tab":  // TAB to focus on input
          if (document.activeElement.id !== "input") {
            document.getElementById("input").focus();
            event.preventDefault();
          }
          break;
    
        case "/":  // Press / to focus on input
          if (document.activeElement.id !== "input") {
            document.getElementById("input").focus();
            event.preventDefault();
          }
          break;
    
        case "f":  // control + f to toggle fullscreen on/off
          if (event.ctrlKey) {
            dispatch(reverseFullscreen());
            event.preventDefault();
          }
          break;

        case "c":  // control + c to stop generating
          if (event.ctrlKey) {
            command(":stop");
            if (global.STATE === STATES.DOING) {
              event.preventDefault();
            }
          }
          break;

        case "l":  // control + l to clear output and reset session
          if (event.ctrlKey && global.STATE === STATES.IDLE) {
            clearOutput();
            setInfo();
            setStats();
            setEvaluation();
            command(":clear");
            event.preventDefault();
          }
          break;
      }
    });

    // Get system configurations
    const getSystemInfo = async () => {
      try {
          const response = await fetch('/api/info/list');
          const result = (await response.json()).result;
          if (result.init_placeholder) setPlaceholder(result.init_placeholder);  // Set placeholder text
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
            markdownFormatter();
          }
        }
      }
    });

    // Start observing
    global.outputMutationObserver.observe(document.getElementById("output"), { 
      childList: true, 
      attributes: false, 
      subtree: true, 
      characterData: true 
    });
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
    const input = userInput.trim().replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
    if (input.length == 0) return;

    // Clear input
    setPlaceholder(userInput);
    setUserInput("");

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

    // Add a placeholder
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

      // Evaluation
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
        urlFormatter();

        // Try speak some rest text
        if (localStorage.getItem('useSpeak') === "true") {
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

      // Handle the stream output
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
        if (localStorage.getItem('useSpeak') === "true") {
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

  // Input from placeholder when pressing tab
  const handleInputKeyDown = (event) => {
    if (event.keyCode === 9 || event.which === 9) {
        if (userInput.length === 0) {
          setUserInput(placeholder);
        }
        event.preventDefault();
    }
  };

  // Styles and themes
  let styles = isFullscreen ? fullscreenStyles : defaultStyles;
  
  return (
    <div>
      <Head>
        <title>simple ai - chat</title>
      </Head>

      <main className={styles.main}>
        <form onSubmit={onSubmit}>
          <input
            id="input"
            type="text"
            placeholder={placeholder}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            autoFocus
            onKeyDown={handleInputKeyDown}
            autoComplete="off"
          />
          <input className={styles.submit} type="submit" value={enter} />
        </form>
        <div id="wrapper" className={styles.wrapper}>
          <div id="output" className={styles.output}></div>
          {evaluation && stats && <div className={styles.evaluation}>{evaluation}</div>}
          {stats && <div className={styles.stats}>{stats}</div>}
          <div className={styles.info}>{info}</div>
        </div>
      </main>
    </div>
  );
}
