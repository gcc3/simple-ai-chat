import Head from "next/head";
import { useState } from "react";
import styles from "./index.module.css";
import Cookies from 'universal-cookie';

const cookies = new Cookies();
cookies.set('useStream', "true", { path: '/' });

export default function Home() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState();
  const [info, setInfo] = useState();

  async function onSubmit(event) {
    event.preventDefault();
    if (input.trim().length == 0) {
      return;
    }

    setInput("");
    if (cookies.get('useStream') === "true") {
      // Use SSE request
      generate_sse();
    } else {
      // Use general API request
      setOutput("Generating...");
      generate();
    }
  }

  function generate_sse() {
    document.getElementById("output").innerHTML = "";
    const openaiEssSrouce = new EventSource("/api/generate_sse?user_input=" + input);
    openaiEssSrouce.onopen = function(event) {
      console.log("Session start.");
    }

    openaiEssSrouce.onmessage = function(event) {
      // Handle the environment info
      if (event.data.startsWith("###ENV###")) {
        const env = event.data.replace("###ENV###", "").split(',');
        const model = env[0];
        const temperature = env[1];
        const top_p = env[2];
        setInfo((
          <div>
            model: {model}
            <br></br>
          </div>
        ));
        return;
      }

      // Handle the DONE signal
      if (event.data === '[DONE]') {
        openaiEssSrouce.close()
        console.log("Session closed.")
        return;
      }

      // Handle the stream output
      let output = event.data;
      output = output.replaceAll("###RETURN###", '<br>');
      document.getElementById("output").innerHTML += output;
      console.log(event.data);
    };

    openaiEssSrouce.onerror = function(error) {
      console.log("Stream Error: " + error);
    };
  }

  async function generate() {
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_input: input }),
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
        <title>Simple AI Chat</title>
      </Head>

      <main className={styles.main}>
        <form onSubmit={onSubmit}>
          <input
            type="text"
            placeholder="Say something..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <input hidden type="submit" value="Submit" />
        </form>
        <div id="output" className={styles.output}>{output}</div>
        <div className={styles.info}>{info}</div>
      </main>
    </div>
  );
}
