import Head from "next/head";
import { useState, useEffect } from "react";
import styles from "./index.module.css";
import command from "command.js";
import { speak, trySpeak } from "utils/speakUtils.js";

export default function Home() {
  const [userInput, setUserInput] = useState("");
  const [placeholder, setPlaceholder] = useState("Say something...");
  const [output, setOutput] = useState();
  const [info, setInfo] = useState();
  const [stats, setStats] = useState();
  const [evaluation, setEvaluation] = useState();

  useEffect(() => {
    localStorage.setItem("queryId", Date.now());
    if (localStorage.getItem("useStats") === null) localStorage.setItem("useStats", "false");
    if (localStorage.getItem("useStream") === null) localStorage.setItem("useStream", "true");
    if (localStorage.getItem("useSpeak") === null) localStorage.setItem("useSpeak", "false");
    if (localStorage.getItem("lang") === null) localStorage.setItem("lang", "en-US");  // by default use English
    if (localStorage.getItem("useLocation") === null) localStorage.setItem("useLocation", "false");
  }, []);

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
        setOutput(commandResult);
        resetInfo();
      } else {
        console.log("Not command output.")
      }
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
        setOutput(functionResult);
      } catch (error) {
        console.error(error);
      }
      return;
    }

    // Clear output and info
    resetInfo();
    if (localStorage.getItem('useStream') === "true") {
      // Use SSE request
      generate_sse(input);
    } else {
      // Use general API request
      setOutput("...");
      generate(input);
    }
  }

  function generate_sse(input) {
    // Add a placeholder
    document.getElementById("output").innerHTML = "...";

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
        document.getElementById("output").innerHTML = "...";

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

          if (use_eval === "true") {
            setEvaluation(
              <div>
                self_eval_score: evaluating...<br></br>
              </div>
            );
          }

          let scoreColor = "#767676";                  // default
          if (score >= 4)      scoreColor = "green";   // green
          else if (score > 0)  scoreColor = "#CC7722"; // orange
          else if (score == 0) scoreColor = "#DE3163"; // red
          setStats(
            <div>
              dict_search_score: <span style={{color: scoreColor}}>{score}</span><br></br>
              func: {func || "none"}<br></br>
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

        // Try speak some rest text
        if (localStorage.getItem('useSpeak') === "true") {
          let restText = document.getElementById("output").innerHTML.replace(textSpoken, "");
          restText = restText.replaceAll("<br>", " ");
          if (restText.length > 0)
            speak(restText);
        }
        
        return;
      }

      if (event.data.startsWith("###ERR###")) {
        openaiEssSrouce.close();
        document.getElementById("output").innerHTML = "Server error.";
        console.log(event.data);
        return;
      }

      // Print error message
      if (event.data.startsWith('[ERR]')) {
        openaiEssSrouce.close();
        document.getElementById("output").innerHTML = "Server error.";
        console.log(event.data);
        return;
      }

      // Handle the stream output
      let output = event.data;
      output = output.replaceAll("###RETURN###", '<br>');

      // Remove the placeholder
      if (document.getElementById("output").innerHTML === "...") {
        document.getElementById("output").innerHTML = output;
      } else {
        document.getElementById("output").innerHTML += output;
      }

      // Try speak
      if (localStorage.getItem('useSpeak') === "true") {
        textSpoken = trySpeak(document.getElementById("output").innerHTML, textSpoken);
      }

      console.log(event.data);
    };

    openaiEssSrouce.onerror = function(error) {
      console.log("Other Stream Error: " + JSON.stringify(error));
      openaiEssSrouce.close();
    };
  }

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

      setOutput(data.result.text.split("\n").map((line, line_number) => {
        console.log(line);
        return (
          <div key={line_number}>
            {line}
            <br></br>
          </div>
        );
      }));

      if (localStorage.getItem('useSpeak') === "true") {
        speak(data.result.text);
      }

      if (localStorage.getItem('useStats') === "true") {
        const score = data.result.stats.score;
        
        let scoreColor = "#767676";                  // default
        if (score >= 4)      scoreColor = "green";   // green
        else if (score > 0)  scoreColor = "#CC7722"; // orange
        else if (score == 0) scoreColor = "#DE3163"; // red
        setStats((
          <div>
            dict_search_score: <span style={{color: scoreColor}}>{score}</span><br></br>
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

  return (
    <div>
      <Head>
        <title>simple ai - chat</title>
      </Head>

      <main className={styles.main}>
        <form id="input" onSubmit={onSubmit}>
          <input
            type="text"
            placeholder={placeholder}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            autoFocus
          />
          <input className={styles.submit} type="submit" value="enter" />
        </form>
        <div id="wrapper" className={styles.wrapper}>
          <div id="output" className={styles.output}>{output}</div>
          {evaluation && stats && <div className={styles.evaluation}>{evaluation}</div>}
          {stats && <div className={styles.stats}>{stats}</div>}
          <div className={styles.info}>{info}</div>
        </div>
      </main>
    </div>
  );
}
