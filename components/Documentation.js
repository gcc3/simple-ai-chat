import React from 'react';
import { getCommands } from '/command';
import { getFunctions } from '../function';
import YouTube from 'react-youtube';

const Documentation = ({ country }) => {
  const features = [
    { id: "features-gpt4turbo", name: "GPT-4 Turbo", description: "Chat with the state-of-the-art GPT-4 Turbo model provided by OpenAI." },
    { id: "features-gpt4vision-imageinput", name: "Image Input (GPT-4 Vision)", description: "Interact with powerful vision model, GPT-4 Vision. To use Vision model, simply paste the image to the input box. * The GPT-4 Vision model not support function calling." },
    { id: "features-fileinput", name: "File Input", description: "Upload files (supporting plain text, DOCX, PDF, JSON), and they will be processed as text. The results will be inserted into the prompt and will provide a GPT reference." },
    { id: "features-roles", name: "Roles", description: "Allow GPT to act in a role to provide more satisfactory answers, or provide your own instruction prompts to fit your needs." },
    { id: "features-stores", name: "Data Stores", description: "Support for vector database and relational database search and query. For vector database user can upload files to your personal database. When a store is used, the results will be inserted as prompts to provide knowledgeable answers. Multiple data store can be used simultaneously." },
    { id: "features-nodes", name: "Nodes (Node AI)", description: "Connect to another AI or any data source to use its data. When a node is used, the results will be utilized as prompts provided for the AI." },
    { id: "features-midjourney", name: "Midjourney", description: "Midjourney is the first system node AI. It utilizes the most advanced image generation AI, the Midjourney in combination with ChatGPT prompts to generate high-quality certified images." },
  ];

  const sub_features = [
    { name: "Full-screen mode and split-screen mode", description: "For easy use requiring extensive input and output, such as programmers, essay writer. To use split-screen mode, use command \`:fullscreen split\`." },
    { name: "De-hallucination", description: "Detect hallucinations in chat to provide more trustworthiness. When the AI exhibits hallucination, it can sometimes generate completely fabricated answers. By enabling the dehallucination feature, a message in stats (`self_eval_score`) will be displayed along with statistics to allow users to judge the accuracy of the information. Essentially, this feature resends the user's input and the AI's output, along with reference information, back to AI for self-evaluation. Use command \`:stats on\`, and `:eval on` to turn on it." },
    { name: "TTS voice", description: "Reading with an option to select from the system's local TTS voice library, use command \`:speak on\` to enable." },
    { name: "Themes", description: "Supports 3 themes: Light mode, Dark mode, and Matrix-style Terminal mode." },
    { name: "Function calls", description: "GPT will choise function to use to get information he need. Such as weather and time queries. Functions can be called by user directlly from the input as well. To list all available functions use `:function ls`. Also refer: Functions" },
    { name: "Page redirection", description: "As one of the `functions calls`, `redirect_to_url()` can redirection or open URL in a new tab. GPT will do it automatically, for example: Open the official website of OpenAI. You can use it to open multiple URLs, simultaneously." },
    { name: "Location-based query", description: "Questioning based on user's geographic location information. e.g., answering \"How's the weather today?\" by automatically obtaining the location. To use location feature, use command \`:location on\`." },
    { name: "Code highlighting", description: "Code highting for different themes, support all programming languages." },
    { name: "Shortcuts", description: "Supports convenient shortcut operations. Refer: `Shortcuts`" },
  ];

  const commands = getCommands();

  const functions = getFunctions();

  const shortcuts = [
    { action: "Clear the input.", shortcut: "ESC", condition: "Focused on the input area, input area has content." },
    { action: "Unfocus from the input box.", shortcut: "ESC", condition: "Focused on the input area, input area is cleared." },
    { action: "Repeat last input.", shortcut: "Tab", condition: "Focused on the input area, input area is cleared." },
    { action: "Navigate to the previous session history(log).", shortcut: "← or K", condition: "Unfocused from the input area， or input box is empty when using `←`." },
    { action: "Navigate to the next session history(log).", shortcut: "→ or J", condition: "Unfocused from the input area, or input box is empty when using `→`" },
    { action: "Input the previous command.", shortcut: "↑", condition: "Focus on the input area. The current input is starts with `:` (a command). Or the input area is empty and placeholder is a command. It has an previous command in command history." },
    { action: "Input the next command.", shortcut: "↓", condition: "Focus on the input area. The current input is starts with `:` (a command). It has an next command in command history." },
    { action: "Change focus to input area.", shortcut: "Tab or /", condition: "Unfocused from the input area." },
  ];

  const apis = [
    { endpoint: "GET /api/generate_sse", parameters: "session, mem_length, role, store, node, use_stats, use_eval, use_location, location, images, files", description: "Generate a response from the AI model with stream." },
    { endpoint: "POST /api/generate", parameters: "session, mem_length, role, store, node, use_stats, use_eval, use_location, location, images, files", description: "Generate a response from the AI model." },
  ];

  const content = (
    <>
      <div>
        <div className="mt-2"><a href="#introduction"><u>Introduction</u></a></div>
        <div className="mt-2"><a href="#quick-start"><u>Quick Start</u></a></div>
        <div>
          <div className="mt-2"><a href="#features"><u>Features</u></a></div>
          <div className="ml-3">
            <div><a href="#features-gpt4turbo">- <u>GPT-4 Turbo</u></a></div>
            <div><a href="#features-gpt4vision-imageinput">- <u>Image Input (GPT-4 Vision)</u></a></div>
            <div><a href="#features-fileinput">- <u>File Input</u></a></div>
            <div><a href="#features-roles">- <u>Roles</u></a></div>
            <div><a href="#features-stores">- <u>Data Stores</u></a></div>
            <div><a href="#features-nodes">- <u>Nodes (Node AI)</u></a></div>
            <div><a href="#features-midjourney">- <u>Midjourney</u></a></div>
            <div><a href="#features-more">- <u>More...</u></a></div>
          </div>
        </div>
        <div>
          <div className="mt-2"><a href="#commands"><u>Commands</u></a></div>
          <div className="ml-3">
            <div><a href="#commands-general">- <u>General</u></a></div>
            <div><a href="#commands-session">- <u>Session</u></a></div>
            <div><a href="#commands-eval">- <u>Stats & Self-evaluation</u></a></div>
            <div><a href="#commands-speak">- <u>Speak</u></a></div>
            <div><a href="#commands-role">- <u>Roles</u></a></div>
            <div><a href="#commands-store">- <u>Data Store</u></a></div>
            <div><a href="#commands-node">- <u>Node (Node AI)</u></a></div>
            <div><a href="#commands-user">- <u>User</u></a></div>
            <div><a href="#commands-config">- <u>Information</u></a></div>
          </div>
        </div>
        <div className="mt-2"><a href="#functions"><u>Functions</u></a></div>
        <div className="mt-2"><a href="#shortcuts"><u>Shortcuts</u></a></div>
        <div className="mt-2"><a href="#api"><u>APIs</u></a></div>
        <div className="mt-2"><a href="#feedback"><u>Feedback & Support</u></a></div>
      </div>
      <div id="introduction" className="mt-5">Introduction</div>
      <div className="mt-2">
        Simple AI (`simple-ai.io`) is an AI chat application. It focuses on improving the user experience of interacting with AI models. It provides a command-based and easy-to-use shell interface to interact with the AI models.
      </div>
      <div id="quick-start" className="mt-5">Quick Start</div>
      <div className="mt-2">
        {country && country !== "CN" && process.env.NEXT_PUBLIC_VIDEO_ID && <div className="max-w-screen-lg">
          <YouTube
            videoId={process.env.NEXT_PUBLIC_VIDEO_ID}
            className="youtube-video"
            opts={{ 
              playerVars: {
                controls: 1,
                rel: 0,
                hl: "en",
              }
            }}
          />
        </div>}
        {((country && country === "CN") || !process.env.NEXT_PUBLIC_VIDEO_ID) && <div>
          <div className="max-w-screen-lg">
            (Quick start video preparing...)
          </div>
        </div>}
      </div>
      <div id="features" className="mt-5">Features</div>
      <div>
        {features.map((item, index) => (
          <div key={index} className="mt-2">
            <div id={item.id}>- {item.name}</div>
            <div>{item.description}</div>
          </div>
        ))}
      </div>
      <div id="features-more" className="mt-2">More features:</div>
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
        {commands.map((item, index) => (<div key={index}>
            {item.id && <div id={item.id} className="mt-3">
              - {item.title}
              {item.annotation && <div className="mt-2">{item.annotation}</div>}
            </div>}
            <div className="mt-2">
              <div>{item.command}</div>
              <div>Short description: {item.short_description || "-"}</div>
              <div>Description: {item.description || "-"}</div>
            </div>
          </div>
        ))}
      </div>
      <div id="functions" className="mt-5">Functions</div>
      <div className="mt-2">
        We provide some built-in functions to get information from the Internet. Both user and AI can use these functions. To get a list of available functions, use the `:function ls` command.
      </div>
      <div className="mt-3 table-container">
        <table>
          <thead>
            <tr>
              <th>Function</th>
              <th>Execute</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {functions.map((f, index) => (
              <tr key={index}>
                <td>{f.name}</td>
                <td>{(() => {
                  const args =(() => Object.keys(f.parameters.properties).map((p) => {
                    const type = f.parameters.properties[p].type;
                    if (type === "string") {
                      return `\"${p}\": \"___\"`;
                    } else if (type === "boolean") {
                      return `\"${p}\": [true|false]`;
                    } else {
                      return `\"${p}\": [${type}]`;
                    }
                  }).join(", "))();
                  return `!${f.name}({ ${args} })`
                })()}</td>
                <td>{f.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-2">
          * Weather data is provided by WolframAlpha.
        </div>
      </div>
      <div id="shortcuts" className="mt-5">Shortcuts</div>
      <div className="mt-3 table-container">
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
          * Command shortcuts: Stop generating (⌃c), Clear output (⌃r), Clear output and reset session (⇧⌃r), Toggle fullscreen (F11) or split mode (⌃|). In macOS you may use ⌃F11 because F11 is a system shortcut.
        </div>
      </div>
      <div id="api" className="mt-5">APIs</div>
      <div className="mt-2">
        Simple AI provides APIs for developers to integrate with their applications. The APIs is currently in beta and is subject to change. To use APIs, you need to add a cookie `auth=your_jwt_token` for user authentication. You can get the JWT token from the cookie of your browser. (Login is required.)
      </div>
      <div className="mt-3 table-container">
        <table>
          <thead>
            <tr>
              <th>Endpoint</th>
              <th>Parameters</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {apis.map((item, index) => (
              <tr key={index}>
                <td>{item.endpoint}</td>
                <td>{item.parameters}</td>
                <td>{item.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div id="feedback" className="mt-5">Feedback & Support</div>
      <div className="mt-2">
        Simple AI is open-source; you can visit our GitHub issues (<a href="https://github.com/gcc3/simple-ai-chat/issues"><u>link</u></a>) to report any issues you encounter, share your ideas or contribute to the project. Or you can join our Discord server (<a href="https://discord.gg/dRqBZjNu"><u>link</u></a>) to discuss with other users.
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