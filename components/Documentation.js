import React from 'react';
import { getCommands } from '/command';
import { getFunctions } from '../function';
import YouTube from 'react-youtube';
import { useTranslation } from 'react-i18next';

const Documentation = ({ country }) => {
  const { t } = useTranslation();

  const features = [
    { id: "features-gpt4turbo", name: "Text Generation (GPT-4 Turbo)", description: "Chat with the state-of-the-art GPT-4 Turbo model provided by OpenAI." },
    { id: "features-imagegeneration-midjourney", name: "Image Generation (Midjourney)", description: "Midjourney is the first system Node AI. It utilizes the most advanced image generation AI, the Midjourney in combination with ChatGPT prompts to generate high-quality certified images. To use turn this feature on, use command `:node use \"Midjourney\"`." },
    { id: "features-gpt4vision-imageinput", name: "Image Input (GPT-4 Vision)", description: "Interact with powerful vision model, GPT-4 Vision. To use Vision model, simply paste the image to the input box. * The GPT-4 Vision model not support function calling." },
    { id: "features-fileinput", name: "File Input", description: "Upload files (supporting plain text, DOCX, PDF, JSON), and they will be processed as text. The results will be inserted into the prompt and will provide a GPT reference." },
    { id: "features-roles", name: "Roles", description: "Allow GPT to act as a role to provide more satisfactory answers. You can either use pre-defined system roles or create custom instruction prompts to tailor user roles to your specific requirements." },
    { id: "features-stores", name: "Data Stores", description: "Support for vector database and relational database search and query. For vector database user can upload files to your personal database. When a store is used, the results will be inserted as prompts to provide knowledgeable answers. Multiple data store can be used simultaneously." },
    { id: "features-nodes", name: "Nodes (Node AI)", description: "Connect to another AI or any data source to use its data. When a node is used, the results will be utilized as prompts provided for the AI." },
    { id: "feature-mathematics-wolframalpha", name: "Enhanced Knowledge & Mathematics (WolframAlpha)", description: "As one of the AI callable function, WolframAlpha is a highly capable computational knowledge engine that enhances the reliability of answers provided." },
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
    { name: "Mathematical Equation", description: "Supports the display of mathematical equations in LaTeX format in the results. When user copy the text in equation, the original LaTeX will be copied." },
    { name: "Shortcuts", description: "Supports convenient shortcut operations. Refer: `Shortcuts`" },
  ];

  const commands = getCommands();

  const functions = getFunctions();

  const shortcuts = [
    { action: "Stop generating. (`:stop`)", shortcut: "⌃C", condition: "Generating." },
    { action: "Clear output. (`:clear`)", shortcut: "⌃R", condition: "Has output." },
    { action: "Clear output and reset session. (`:reset`)", shortcut: "⇧⌃R", condition: "-" },
    { action: "Fullscreen. (`:fullscreen [off?]`)", shortcut: "F11(*)", condition: "-" },
    { action: "Split screen. (`:fullscreen split`)", shortcut: "⌃|", condition: "-" },
    { action: "Clear the input.", shortcut: "ESC", condition: "Focused on the input area. Input area not empty." },
    { action: "Unfocus from the input box.", shortcut: "ESC", condition: "Focused on the input area. Input area is empty/cleared." },
    { action: "Repeat last input.", shortcut: "Tab", condition: "Focused on the input area. Input area is empty/cleared." },
    { action: "Command autocomplete.", shortcut: "Tab", condition: "Focused on the input area. Input commands `:role use`, `:store use`, `:node use`, `:theme` and type the starts characters of the value." },
    { action: "Previous log (same session).", shortcut: "← or K", condition: "Unfocused from the input area or input box is empty when using `←`." },
    { action: "Next log (same session).", shortcut: "→ or J", condition: "Unfocused from the input area or input box is empty when using `→`" },
    { action: "Previous command.", shortcut: "↑", condition: "Focus on the input area. The current input is starts with `:` (a command). Or the input area is empty and placeholder is a command. It has an previous command in command history." },
    { action: "Next command.", shortcut: "↓", condition: "Focus on the input area. The current input is starts with `:` (a command). It has an next command in command history." },
    { action: "Change focus to input area.", shortcut: "Tab or /", condition: "Unfocused from the input area." },
  ];

  const gestures = [
    { action: "Previous log (same session).", gesture: "Swipe Right", condition: "Not on code block." },
    { action: "Next log (same session).", gesture: "Swipe Left", condition: "Not on code block." },
  ];

  const apis = [
    { endpoint: "GET /api/generate_sse", parameters: "session, mem_length, role, store, node, use_stats, use_eval, use_location, location, images, files", description: "Generate a response from the AI model with stream." },
    { endpoint: "POST /api/generate", parameters: "session, mem_length, role, store, node, use_stats, use_eval, use_location, location, images, files", description: "Generate a response from the AI model." },
  ];

  const faqs = [
    { question: "How to copy the result?", answer: "You can click the model name to copy the whole result (raw)." },
    { question: "How to share a session?", answer: "You can press Control key and click the model name, a `:session attach` command with the session ID will be automatically copied to your clipboard." },
    { question: "Does Simple AI store my credit card information?", answer: "No, we do not store any credit card numbers. Payments are securely processed through an embedded page provided by the payment service provider, and the information is sent directly to the banking system." },
  ];

  const content = (
    <>
      <div>
        <div className="mt-2"><a href="#introduction"><u>Introduction</u></a></div>
        <div className="mt-2"><a href="#quick-start"><u>Quick Start</u></a></div>
        <div>
          <div className="mt-2"><a href="#features"><u>Features</u></a></div>
          <div className="ml-3">
            <div><a href="#features-gpt4turbo">- <u>Text Generation (GPT-4 Turbo)</u></a></div>
            <div><a href="#features-imagegeneration-midjourney">- <u>Image Generation (Midjourney)</u></a></div>
            <div><a href="#features-gpt4vision-imageinput">- <u>Image Input (GPT-4 Vision)</u></a></div>
            <div><a href="#features-fileinput">- <u>File Input</u></a></div>
            <div><a href="#features-roles">- <u>Roles</u></a></div>
            <div><a href="#features-stores">- <u>Data Stores</u></a></div>
            <div><a href="#features-nodes">- <u>Nodes (Node AI)</u></a></div>
            <div><a href="#feature-mathematics-wolframalpha">- <u>Enhanced Knowledge & Mathematics (WolframAlpha)</u></a></div>
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
        <div className="mt-2"><a href="#shortcuts"><u>Shortcuts & Gestures</u></a></div>
        <div className="mt-2"><a href="#api"><u>APIs</u></a></div>
        <div className="mt-2"><a href="#faqs"><u>FAQs</u></a></div>
        <div className="mt-2"><a href="#feedback"><u>Feedback & Support</u></a></div>
      </div>
      <div id="introduction" className="mt-5">Introduction</div>
      <div className="mt-2">
        Simple AI (simple-ai.io) is an AI chat application based on OpenAI's latest GPT-4 Turbo model, the most advanced AI model in the world. We focus on improving user experience and providing powerful features for interacting with AI models. Simple AI is the first AI chat application to support both OpenAI's GPT models and to offer integration with other AI systems, such as Midjourney for image generation, and WolframAlpha for knowledge and mathematics. Additionally, we provide a command-based and easy-to-use shell interface, along with shortcuts and gestures, to facilitate user interactions with the AI models. With all these features, Simple AI stands as one of the most powerful AI chat applications in the world.
      </div>
      <div className="mt-2">
        - What I can do with Simple AI?<br/>
        <div className="mt-1">
          1. Basic Use<br/>
          * Chat. Ask complex questions. Problem Solving.<br/>
          * Generate text or translate text, for any languages.<br/>
          * Summarize long text.<br/>
          * Upload an image and inquire about it.<br/>
          * Upload a text, Word or PDF file and ask about the content.<br/>
          * Access a wide range of knowledge.<br/>
          * Generate source code from nature language.<br/>
          * Give GPT a preset instruction, or role play.<br/>
        </div>
        <div className="mt-1">
          2. Advanced Use<br/>
          * Solve complex mathematical problems. (with WolframAlpha)<br/>
          * Generate high-quality images. (with Midjourney)<br/>
        </div>
        <div className="mt-1">
          3. Professional Use<br/>
          * Link with your own data. We support link to relational database and vector database.<br/>
          * Build to link with other AI systems, or your own APIs.<br/>
          <div className="ml-5">And more...</div>
        </div>
      </div>
      <div className="mt-2">
        - Is Simple AI free?<br/>
        * Yes, most of the services are free for `user`; however, the OpenAI token is not free. You need to pay-as-you-use.<br/>
        * For professional use, please consider using our `pro_user` or `super_user`, refer Subcriptions page.<br/>
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
        We provide some built-in functions to get information from the API or execute some tasks. Both user and AI can call these functions. To get a list of available functions, use the `:function ls` command.
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
      <div id="shortcuts" className="mt-5">Shortcuts & Gestures</div>
      <div className="mt-3">Shortcuts</div>
      <div className="mt-1 table-container">
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
                <td className="text-center">{item.shortcut}</td>
                <td>{item.action}</td>
                <td>{item.condition}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-1">
        * In macOS you may use ⌃F11 because F11 is a system shortcut.
      </div>
      <div className="mt-3">Gestures</div>
      <div className="mt-1 table-container">
        <table>
          <thead>
            <tr>
              <th>Gesture</th>
              <th>Action</th>
              <th>Condition</th>
            </tr>
          </thead>
          <tbody>
            {gestures.map((item, index) => (
              <tr key={index}>
                <td>{item.gesture}</td>
                <td>{item.action}</td>
                <td>{item.condition}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2">Gestures can be used on touch screens, such as smartphones and tablets.</div>
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
      <div id="faqs" className="mt-5">FAQs</div>
      <div className="mt-2">
        {faqs.map((item, index) => (
          <div key={index} className="mt-2">
            <div>- {item.question}</div>
            <div>{item.answer}</div>
          </div>
        ))}
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