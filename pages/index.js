import Head from "next/head";
import { useState } from "react";
import styles from "./index.module.css";

export default function Home() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState();
  const [info, setInfo] = useState();

  async function onSubmit(event) {
    event.preventDefault();
    if (input.trim().length == 0) {
      return;
    }

    setOutput("Generating...");
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

      setInput("");
    } catch (error) {
      // Consider implementing your own error handling logic here
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
        <div className={styles.output}>{output}</div>
        <div className={styles.info}>{info}</div>
      </main>
    </div>
  );
}
