import React from 'react';
import { getCommands } from '/command';

const Documentation = () => {
  const features = [
    { name: "GPT-4 Turbo", description: "Chat with the state-of-the-art GPT-4 Turbo." },
    { name: "GPT-4 Vision", description: "Interact with powerful vision model GPT-4 Vision. To use Vision model, simply paste the image to the input box." },
    { name: "Roles/assistants", description: "Let ChatGPT assume various roles or act as an assistant to provide more satisfactory answers. You can customize your own roles/assistant instructions with a prompt and interact with them." },
    { name: "Personal Database (in progress)", description: "Utilize an advanced vector database engine for powerful data searches." },
    { name: "Midjourney (in progress)", description: "Image generative AI Midjourney support." },
  ];

  const sub_features = [
    { name: "Full-screen mode and split-screen mode", description: "For easy use requiring extensive input and output, such as programmers, essay writer." },
    { name: "De-hallucination(`self_eval_score`)", description: "Detect hallucinations in chat to provide more trustworthiness, use command \`:stats on\`." },
    { name: "TTS voice", description: "Reading with an option to select from the system's local TTS voice library." },
    { name: "Themes", description: "Supports 3 themes: Light mode, Dark mode, and Matrix-style Terminal mode." },
    { name: "Function calls", description: "Such as weather and time queries, etc." },
    { name: "Location-based query", description: "Questioning based on user's geographic location information. e.g., answering \"How's the weather today?\" by automatically obtaining the location." },
    { name: "Page redirection", description: "Jump to a specified page, for example: Open the official website of X University." },
    { name: "Shortcuts", description: "Supports convenient shortcut operations." },
  ];

  const commands = getCommands();

  const shortcuts = [
    { action: "Clear the input.", shortcut: "ESC", condition: "Focused on the input area, input area has content." },
    { action: "Unfocus from the input box.", shortcut: "ESC", condition: "Focused on the input area, input area is cleared." },
    { action: "Repeat last input.", shortcut: "Tab", condition: "Focused on the input area, input area is cleared." },
    { action: "Navigate to the previous session history(log).", shortcut: "← or K", condition: "Unfocused from the input area." },
    { action: "Navigate to the next session history(log).", shortcut: "→ or J", condition: "Unfocused from the input area." },
    { action: "Change focus to input area.", shortcut: "Tab or /", condition: "Unfocused from the input area." },
  ];

  const content = (
    <>
      <div>
        <div className="mt-2"><a href="#introduction"><u>Introduction</u></a></div>
        <div className="mt-2"><a href="#feature-main"><u>Main Features</u></a></div>
        <div className="mt-2"><a href="#feature-sub"><u>Other Features</u></a></div>
        <div className="mt-2"><a href="#commands"><u>Commands</u></a></div>
        <div className="mt-2"><a href="#shortcuts"><u>Shortcuts</u></a></div>
      </div>
      <div id="introduction" className="mt-5">Introduction</div>
      <div className="mt-2">
        Simple AI (`simple-ai.io`) is a command-based AI chat application that focus on the cutting-edge AI technology. It provides a simple and easy-to-use interface for everyone to interact with the AI models. Simple AI is open-source; you can visit our GitHub repository (<a href="https://github.com/gcc3/simple-ai-chat"><u>link</u></a>) to report any issues you encounter, share your ideas or contribute to the project.
      </div>
      <div id="feature-main" className="mt-5">Main Features</div>
      <div>
        {features.map((item, index) => (
          <div key={index} className="mt-2">
            <div>- {item.name}</div>
            <div>{item.description}</div>
          </div>
        ))}
      </div>
      <div id="feature-sub" className="mt-5">Other Features</div>
      <div>
        {sub_features.map((item, index) => (
          <div key={index} className="mt-2">
            <div>- {item.name}</div>
            <div>{item.description}</div>
          </div>
        ))}
      </div>
      <div id="commands" className="mt-5">Commands</div>
      <div>
        {commands.map((item, index) => (
          <div key={index} className="mt-2">
            <div>{item.command}</div>
            <div>Short description: {item.short_description || "-"}</div>
            <div>Description: {item.description || "-"}</div>
          </div>
        ))}
      </div>
      <div id="shortcuts" className="mt-5">Shortcuts</div>
      <div className="mt-2">
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
    </>
  )

  return (
    <div className="Documentation">
      <div className="text-center mb-4">
        <div>Welcome to the simple-ai.io</div>
      </div>
      <div>{content}</div>
    </div>
  );
};

export default Documentation;