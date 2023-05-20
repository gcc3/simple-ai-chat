import Head from "next/head";
import { useState } from "react";
import styles from "./index.module.css";

export default function Home() {
  const [aiChatInput, setAiChatInput] = useState("");
  const [result, setResult] = useState();

  async function onSubmit(event) {
    event.preventDefault();
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ aiChat: aiChatInput }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      setResult(data.result);
      setAiChatInput("");
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
        <h2>Simple AI Chat</h2>
        <form onSubmit={onSubmit}>
          <input
            type="text"
            name="aiChat"
            placeholder=""
            value={aiChatInput}
            onChange={(e) => setAiChatInput(e.target.value)}
          />
          <input hidden type="submit" value="Submit" />
        </form>
        <div className={styles.result}>{result}</div>
      </main>
    </div>
  );
}
