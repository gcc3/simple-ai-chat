import React from 'react';
import { getCommands } from '/command';

const Documentation = () => {
  const features = [
    { name: "GPT-4 Turbo", description: "Chat with the state-of-the-art GPT-4 Turbo model provided by OpenAI." },
    { name: "GPT-4 Vision (Image Input)", description: "Interact with powerful vision model, GPT-4 Vision. To use Vision model, simply paste the image to the input box." },
    { name: "File Input", description: "Upload files (supporting plain text, DOCX, PDF, JSON), and they will be processed as text. The results will be inserted into the prompt and will provide a GPT reference." },
    { name: "Roles/Assistants", description: "Allow GPT to act in a role to provide more satisfactory answers, or provide your own instruction prompts to fit your needs." },
    { name: "Personal Database", description: "Upload files to your personal database for powerful data searches. The results will be inserted as prompts to provide knowledgeable answers." },
    { name: "Midjourney (in progress)", description: "Utilize the most advanced image generation AI, Midjourney, in combination with ChatGPT prompts to generate high-quality certified images." },
  ];

  const sub_features = [
    { name: "Full-screen mode and split-screen mode", description: "For easy use requiring extensive input and output, such as programmers, essay writer." },
    { name: "De-hallucination(`self_eval_score`)", description: "Detect hallucinations in chat to provide more trustworthiness, use command \`:stats on\`." },
    { name: "TTS voice", description: "Reading with an option to select from the system's local TTS voice library, use command \`:speak on\` to enable." },
    { name: "Themes", description: "Supports 3 themes: Light mode, Dark mode, and Matrix-style Terminal mode." },
    { name: "Function calls", description: "GPT will choise function to use to get information he need. Such as weather and time queries, etc. Functions can be called by user directlly from the input as well." },
    { name: "Location-based query", description: "Questioning based on user's geographic location information. e.g., answering \"How's the weather today?\" by automatically obtaining the location. To use location feature, use command \`:location on\`." },
    { name: "Page redirection", description: "Jump to a specified page, GPT will do it automatically, for example: Open the official website of OpenAI." },
    { name: "Shortcuts", description: "Supports convenient shortcut operations." },
  ];

  const commands = getCommands();

  const shortcuts = [
    { action: "Clear the input.", shortcut: "ESC", condition: "Focused on the input area, input area has content." },
    { action: "Unfocus from the input box.", shortcut: "ESC", condition: "Focused on the input area, input area is cleared." },
    { action: "Repeat last input.", shortcut: "Tab", condition: "Focused on the input area, input area is cleared." },
    { action: "Navigate to the previous session history(log).", shortcut: "← or K", condition: "Unfocused from the input area， or input box is empty when using `←`." },
    { action: "Navigate to the next session history(log).", shortcut: "→ or J", condition: "Unfocused from the input area, or input box is empty when using `→`" },
    { action: "Change focus to input area.", shortcut: "Tab or /", condition: "Unfocused from the input area." },
  ];

  const content = (
    <>
      <div>
        <div className="mt-2"><a href="#introduction"><u>Introduction</u></a></div>
        <div className="mt-2"><a href="#quick-start"><u>Quick Start</u></a></div>
        <div className="mt-2"><a href="#features"><u>Features</u></a></div>
        <div>
          <div className="mt-2"><a href="#commands"><u>Commands</u></a></div>
          <div className="ml-3">
            <div><a href="#commands-general">- <u>General</u></a></div>
            <div><a href="#commands-session">- <u>Session</u></a></div>
            <div><a href="#commands-eval">- <u>Stats & Self-evaluation</u></a></div>
            <div><a href="#commands-speak">- <u>Speak</u></a></div>
            <div><a href="#commands-role">- <u>Roles & Assistants</u></a></div>
            <div><a href="#commands-store">- <u>Data Store</u></a></div>
            <div><a href="#commands-user">- <u>User</u></a></div>
            <div><a href="#commands-config">- <u>Information</u></a></div>
          </div>
        </div>
        <div className="mt-2"><a href="#shortcuts"><u>Shortcuts</u></a></div>
        <div className="mt-2"><a href="#feedback"><u>Feedback & Support</u></a></div>
      </div>
      <div id="introduction" className="mt-5">Introduction</div>
      <div className="mt-2">
        Simple AI (`simple-ai.io`) is a command-based AI chat application that focus on the cutting-edge AI technology. It provides a simple and easy-to-use interface for everyone to interact with the AI models.
      </div>
      <div id="quick-start" className="mt-5">Quick Start</div>
      <div className="mt-2">
        <div>1. Type in the input box and press Enter to send the message to the AI model. Paste image to the input box to use GPT-4 Vision.</div>
        <div>2. Use command `:user add [username] [email] [password?]` to create a new user account, before using check your email box to verifiy the email address.</div>
        <div>3. Use command `:user login [username] [password?]` to login to your account.</div>
      </div>
      <div id="features" className="mt-5">Features</div>
      <div>
        {features.map((item, index) => (
          <div key={index} className="mt-2">
            <div>- {item.name}</div>
            <div>{item.description}</div>
          </div>
        ))}
      </div>
      <div className="mt-2">Sub features:</div>
      <div>
        {sub_features.map((item, index) => (
          <div key={index} className="mt-2">
            <div>- {item.name}</div>
            <div>{item.description}</div>
          </div>
        ))}
      </div>
      <div id="commands" className="mt-5">Commands</div>
      <div className="mt-2">
        Simple AI is command-based; most operations can be executed with commands. To distinguish from general input, commands must start with a ":". For example, to change the theme, use the `:theme` command; to enter full-screen mode, use the `:fullscreen` command. Use `:help` to list all available commands.
      </div>
      <div>
        {commands.map((item, index) => (<>
            {item.id && <div id={item.id} className="mt-3">- {item.title}</div>}
            <div key={index} className="mt-2">
              <div>{item.command}</div>
              <div>Short description: {item.short_description || "-"}</div>
              <div>Description: {item.description || "-"}</div>
            </div>
          </>
        ))}
      </div>
      <div id="shortcuts" className="mt-5">Shortcuts</div>
      <div className="mt-3">
        <table>
          <thead>
            <tr>
              <th>Shortcut</th>
              <th>Action</th>
              <th>Condition</th>
            </tr>
          </thead>
          <tbody>
            {shortcuts.map((item, index) => (
              <tr key={index}>
                <td>{item.shortcut}</td>
                <td>{item.action}</td>
                <td>{item.condition}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-2">
          * Command shortcuts: Stop generating (⌃c), Clear output (⌃r), Clear output and reset session (⇧⌃r)
        </div>
      </div>
      <div id="feedback" className="mt-5">Feedback & Support</div>
      <div className="mt-2">
        Simple AI is open-source; you can visit our GitHub issues (<a href="https://github.com/gcc3/simple-ai-chat/issues"><u>link</u></a>) to report any issues you encounter, share your ideas or contribute to the project.
      </div>
      <div className="mt-2">
        You can also contact us via email `<a href="mailto:support@simple-ai.io"><u>support@simple-ai.io</u></a>`.
      </div>
    </>
  )

  return (
    <div className="Documentation">
      <div className="text-center mb-4">
        <div>Documentation</div>
      </div>
      <div>{content}</div>
    </div>
  );
};

export default Documentation;