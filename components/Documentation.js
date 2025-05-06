import React, { useEffect, useState   } from 'react';
import { getCommands } from '../command.js';
import { getFunctions } from '../function.js';
import { useTranslation, Trans } from 'react-i18next';

const Documentation = () => {
  const { t, ready } = useTranslation("documentation");
  const { t: tt, ready: transReady } = useTranslation("translation");

  const [functions, setFunctions] = useState([]);

  useEffect(() => {
    const fetchFunctions = async () => {
      const fetchedFunctions = await getFunctions();
      setFunctions(fetchedFunctions);
    };
    fetchFunctions();
  }, []);

  const quick_starts = [
    { id: "quick_start_0", content: tt("quick_start_0") },
    { id: "quick_start_1", content: tt("quick_start_1") },
    { id: "quick_start_2", content: tt("quick_start_2") },
    { id: "quick_start_3", content: tt("quick_start_3") },
    { id: "quick_start_4", content: tt("quick_start_4") },
    { id: "quick_start_5", content: tt("quick_start_5") },
    { id: "quick_start_6", content: tt("quick_start_6") },
    { id: "quick_start_7", content: tt("quick_start_7") },
    { id: "quick_start_8", content: tt("quick_start_8") },
  ];

  const features = [
    { id: "features-gpt-textgeneration", name: t("GPT Text Generation"), description: t("Chat with the state-of-the-art GPT model powered by OpenAI.") },
    { id: "features-gpt-vision", name: t("GPT Vision"), description: t("Interact with powerful GPT vision model. To use Vision model, paste or drag and drop the image to the input box.") },
    { id: "features-fileinput", name: t("File Input"), description: t("Upload files (supporting plain text, DOCX, PDF, JSON), and they will be processed as text. The results will be inserted into the prompt and will provide a GPT reference.") },
    { id: "features-roles", name: t("Roles"), description: t("Allow GPT to act as a role to provide more satisfactory answers. You can either use pre-defined system roles or create custom instruction prompts to tailor user roles to your specific requirements.") },
    { id: "features-stores", name: t("Data Stores"), description: t("Support for files and relational database queries. If a store is used, the query results will be inserted as prompts to provide knowledgeable answers. Multiple data store can be used simultaneously.") },
    { id: "features-nodes", name: t("Nodes (Node AI)"), description: t("Connect to another AI or any data source to use its data. When a node is used, the results will be utilized as prompts provided for the AI.") },
    { id: "features-mathematics-wolframalpha", name: t("Enhanced Knowledge & Mathematics (WolframAlpha)"), description: t("As one of the AI callable function, WolframAlpha is a highly capable computational knowledge engine that enhances the reliability of answers provided.") },
  ];

  const sub_features = [
    { name: t("Full-screen mode and split-screen mode"), description: t("For easy use requiring extensive input and output, such as programmers, essay writer. To use split-screen mode, use command `:fullscreen split`.") },
    { name: t("De-hallucination"), description: t("Detect hallucinations in chat to provide more trustworthiness. When the AI exhibits hallucination, it can sometimes generate completely fabricated answers. By enabling the dehallucination feature, a message in stats (`self_eval_score`) will be displayed along with statistics to allow users to judge the accuracy of the information. Essentially, this feature resends the user's input and the AI's output, along with reference information, back to AI for self-evaluation. Use command `:stats on`, and `:eval on` to turn on it.") },
    { name: t("TTS voice"), description: t("Reading with an option to select from the system's local TTS voice library, use command `:speak on` to enable.") },
    { name: t("Themes"), description: t("Supports 3 themes: Light mode, Dark mode, and Matrix-style Terminal mode.") },
    { name: t("Function calls"), description: t("GPT will choise function to use to get information he need. Such as weather and time queries. Functions can be called by user directlly from the input as well. To list all available functions use `:function ls`. Also refer: Functions") },
    { name: t("Page redirection"), description: t("As one of the `functions calls`, `redirect_to_url()` can redirection or open URL in a new tab. GPT will do it automatically, for example: Open the official website of OpenAI. You can use it to open multiple URLs, simultaneously.") },
    { name: t("Location-based query"), description: t("Questioning based on user's geographic location information. e.g., answering `How's the weather today?` by automatically obtaining the location. To use location feature, use command `:location on`.") },
    { name: t("Code highlighting"), description: t("Code highlighting for different themes, support all programming languages.") },
    { name: t("Mathematical Equation"), description: t("Supports the display of mathematical equations in LaTeX format in the results. When user copy the text in equation, the original LaTeX will be copied.") },
    { name: t("Shortcuts"), description: t("Supports convenient shortcut operations. Refer: `Shortcuts`") },
    { name: t("Internationalization and localization"), description: t("Simple AI supports 18 languages: Arabic, Bengali, Chinese, Dutch, English, French, German, Hindi, Indonesian, Italian, Japanese, Korean, Polish, Portuguese, Russian, Spanish, Swedish, Turkish. Please let us know if you need support for your language.") },
  ];

  const commands = getCommands();
  const shortcuts = [
    { action: t("Stop generating. (`:stop`)"), shortcut: "⌃C", condition: t("Generating.") },
    { action: t("Clear output. (`:clear`)"), shortcut: "⌃R", condition: t("Has output.") },
    { action: t("Clear output and reset session. (`:reset`)"), shortcut: "⇧⌃R", condition: "-" },
    { action: t("Fullscreen. (`:fullscreen [off?]`)"), shortcut: "F11(*)", condition: "-" },
    { action: t("Split screen. (`:fullscreen split`)"), shortcut: "⌃|", condition: "-" },
    { action: t("Clear the input."), shortcut: "ESC", condition: t("Cursor focused on the input area. Input area not empty.") },
    { action: t("Unfocus cursor from the input box."), shortcut: "ESC", condition: t("Cursor is focused on the input area. Input area is empty/cleared.") },
    { action: t("Repeat last input."), shortcut: "Tab", condition: t("Cursor is focused on the input area. Input area is empty/cleared.") },
    { action: t("Command autocomplete."), shortcut: "Tab", condition: t("Cursor is focused on the input area. Command inputted. Type the starts characters of the value.") },
    { action: t("Previous session."), shortcut: "↑ or H", condition: t("Unfocused from the input area or input box is empty (for ↑). Not generating in progress.") },
    { action: t("Next session."), shortcut: "↓ or L", condition: t("Unfocused from the input area or input box is empty (for ↓). Not generating in progress.") },
    { action: t("Previous log (same session)."), shortcut: "← or K", condition: t("Unfocused from the input area or input box is empty (for ←). Not generating in progress.") },
    { action: t("Next log (same session)."), shortcut: "→ or J", condition: t("Unfocused from the input area or input box is empty (for →). Not generating in progress.") },
    { action: t("Previous command."), shortcut: "↑", condition: t("Cursor is focused on the input area. The current input is starts with `:`. Has a previous command in command history.") },
    { action: t("Next command."), shortcut: "↓", condition: t("Cursor is focused on the input area. The current input is starts with `:`. Has a next command in command history.") },
    { action: t("Change focus to input area."), shortcut: "Tab or /", condition: t("Unfocused from the input area.") },
  ];

  const gestures = [
    { action: t("Previous log (same session)."), gesture: t("Swipe Right"), condition: t("Not on code block.") },
    { action: t("Next log (same session)."), gesture: t("Swipe Left"), condition: t("Not on code block.") },
    { action: t("Auto input/Autocomplete."), gesture: t("Swipe Right"), condition: t("Touch swipe on input box.") },
    { action: t("Delete input."), gesture: t("Swipe Left"), condition: t("Touch swipe on input box.") },
  ];

  const apis = [
    { endpoint: "GET /api/generate_sse", parameters: "session, mem_length, role, stores, node, use_stats, use_eval, use_location, location, images, files", description: t("Generate a response from the AI model with stream.") },
    { endpoint: "POST /api/generate", parameters: "session, mem_length, role, stores, node, use_stats, use_eval, use_location, location, images, files", description: t("Generate a response from the AI model.") },
  ];

  const faqs = [
    { question: t("How to copy the result?"), answer: t("You can click the model name to copy the whole result (raw).") },
    { question: t("How to share a session?"), answer: t("You can press Control key (for macOS press command key) and click the model name, a `:session attach` command with the session ID will be automatically copied to your clipboard.") },
  ];

  const content = (
    <>
      <div>
        <div className="mt-2"><a href="#introduction"><u>{ t("Introduction") }</u></a></div>
        <div className="mt-2"><a href="#quick-start"><u>{ t("Quick Start") }</u></a></div>
        <div>
          <div className="mt-2"><a href="#features"><u>{ t("Features") }</u></a></div>
          <div className="ml-3">
            <div><a href="#features-gpt-textgeneration">- <u>{ t("GPT Text Generation") }</u></a></div>
            <div><a href="#features-gpt-vision">- <u>{ t("GPT Vision") }</u></a></div>
            <div><a href="#features-fileinput">- <u>{ t("File Input") }</u></a></div>
            <div><a href="#features-roles">- <u>{ t("Roles") }</u></a></div>
            <div><a href="#features-stores">- <u>{ t("Data Stores") }</u></a></div>
            <div><a href="#features-nodes">- <u>{ t("Nodes (Node AI)") }</u></a></div>
            <div><a href="#features-mathematics-wolframalpha">- <u>{ t("Enhanced Knowledge & Mathematics (WolframAlpha)") }</u></a></div>
            <div><a href="#features-more">- <u>{ t("more...") }</u></a></div>
          </div>
        </div>
        <div>
          <div className="mt-2"><a href="#commands"><u>{ t("Commands") }</u></a></div>
          <div className="ml-3">
            <div><a href="#commands-general">- <u>{ t("General") }</u></a></div>
            <div><a href="#commands-session">- <u>{ t("Sessions & Logs") }</u></a></div>
            <div><a href="#commands-model">- <u>{ t("Models") }</u></a></div>
            <div><a href="#commands-eval">- <u>{ t("Stats & Self-evaluation") }</u></a></div>
            <div><a href="#commands-speak">- <u>{ t("Speak") }</u></a></div>
            <div><a href="#commands-role">- <u>{ t("Roles") }</u></a></div>
            <div><a href="#commands-store">- <u>{ t("Data Store") }</u></a></div>
            <div><a href="#commands-node">- <u>{ t("Node (Node AI)") }</u></a></div>
            <div><a href="#commands-user">- <u>{ t("User") }</u></a></div>
            <div><a href="#commands-config">- <u>{ t("Information") }</u></a></div>
            <div><a href="#commands-cli">- <u>{ t("CLI (Command-line Interface)") }</u></a></div>
          </div>
        </div>
        <div className="mt-2"><a href="#functions"><u>{ t("Functions") }</u></a></div>
        <div className="mt-2"><a href="#shortcuts"><u>{ t("Shortcuts & Gestures") }</u></a></div>
        <div className="mt-2"><a href="#api"><u>{ t("APIs") }</u></a></div>
        <div className="mt-2"><a href="#faqs"><u>{ t("FAQs") }</u></a></div>
        <div className="mt-2"><a href="#feedback"><u>{ t("Feedback & Support") }</u></a></div>
      </div>
      <div id="introduction" className="mt-5">{ t("Introduction") }</div>
      <div className="mt-2">
        { t("Hi, welcome to Simple AI! 🚀 I'm working to provide a more professional and programmer-friendly user interface for interacting with the AI.") }
      </div>
      <div className="mt-2">
        - { t("What I can do with Simple AI?") }<br/>
        <div className="mt-1">
          { t("1. Basic Use") }<br/>
          { t("* Chat. Ask complex questions. Problem Solving.") }<br/>
          { t("* Generate text or translate text, for any languages.") }<br/>
          { t("* Summarize long text.") }<br/>
          { t("* Upload an image and inquire about it.") }<br/>
          { t("* Upload a text, Word or PDF file and ask about the content.") }<br/>
          { t("* Access a wide range of knowledge.") }<br/>
          { t("* Generate source code from natural language.") }<br/>
          { t("* Give GPT a preset instruction, or role play.") }<br/>
        </div>
        <div className="mt-1">
          { t("2. Advanced Use") }<br/>
          { t("* Solve complex mathematical problems. (with WolframAlpha)") }<br/>
          { t("* Link with your own data. Support link to relational database.") }<br/>
          { t("* Build to link with other AI systems, or your own APIs.") }<br/>
          <div className="ml-5">{ t("And more...") }</div>
        </div>
      </div>
      <div id="quick-start" className="mt-5">{ t("Quick Start") }</div>
      <div className="mt-2">
        {quick_starts.map((item, index) => (
          <div key={index}>
            <div id={item.id}>{ index + 1 }. { t(item.content) }</div>
          </div>
        ))}
      </div>
      <div id="features" className="mt-5">{ t("Features") }</div>
      <div>
        {features.map((item, index) => (
          <div key={index} className="mt-2">
            <div id={item.id}>- {item.name}</div>
            <div>{item.description}</div>
          </div>
        ))}
      </div>
      <div id="features-more" className="mt-2">{ t("More features") }:</div>
      <div>
        {sub_features.map((item, index) => (
          <div key={index} className="mt-2">
            <div>- {item.name}</div>
            <div>{item.description}</div>
          </div>
        ))}
      </div>
      <div id="commands" className="mt-5">{ t("Commands") }</div>
      <div className="mt-2">
        { t("Simple AI is command-based; most operations can be executed with commands. To distinguish from general input, commands must start with a `:`. For example, to change the theme, use the `:theme` command; to enter full-screen mode, use the `:fullscreen` command. Use `:help` to list all available commands.") }
      </div>
      <div className="mt-1">
        { t("The Commands is designed to mimic a Unix shell. You can use `Tab` key to autocomplete. Use ↑ and ↓ key to navigate between command history. Use Control + C to stop.") }
      </div>
      <div>
        {commands.map((item, index) => (<div key={index}>
            {item.id && <div id={item.id} className="mt-3">
              - { t(item.title) }
              {item.annotation && <div className="mt-2">{item.annotation}</div>}
            </div>}
            <div className="mt-2">
              <div>{item.command}</div>
              {item.options && <div className="mt-1">{ t("Command options") }: {item.options}</div>}
              <div>{ t("Short description") }: {item.short_description || "-"}</div>
              <div>{ t("Description") }: {item.description || "-"}</div>
            </div>
          </div>
        ))}
      </div>
      <div id="functions" className="mt-5">{ t("Functions") }</div>
      <div className="mt-2">
        { t("We offer several built-in functions that allow both users and the AI to retrieve information from the API or perform certain tasks. To view a list of available functions, use the `:function ls` command.") }
      </div>
      <div className="mt-3 table-container">
        <table>
          <thead>
            <tr>
              <th>{ t("Function") }</th>
              <th>{ t("Execute") }</th>
              <th>{ t("Description") }</th>
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
      </div>
      <div className="mt-2">
        * { t("Weather data is provided by WolframAlpha.") }
      </div>
      <div id="shortcuts" className="mt-5">{ t("Shortcuts & Gestures") }</div>
      <div className="mt-3">{ t("Shortcuts") }</div>
      <div className="mt-1 table-container">
        <table>
          <thead>
            <tr>
              <th>{ t("Shortcut") }</th>
              <th>{ t("Action") }</th>
              <th>{ t("Condition") }</th>
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
        * { t("In macOS you may use ⌃F11 because F11 is a system shortcut.") }
      </div>
      <div className="mt-3">{ t("Gestures") }</div>
      <div className="mt-1 table-container">
        <table>
          <thead>
            <tr>
              <th>{ t("Gesture") }</th>
              <th>{ t("Action") }</th>
              <th>{ t("Condition") }</th>
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
      <div className="mt-2">{ t("Gestures can be used on touch screens, such as smartphones and tablets.") }</div>
      <div id="api" className="mt-5">{ t("APIs") }</div>
      <div className="mt-2">
        { t("Simple AI provides APIs for developers to integrate with their applications. The APIs is currently in beta and is subject to change. To use APIs, you need to add a cookie `auth=your_jwt_token` for user authentication. You can get the JWT token from the cookie of your browser. (Login is required.)") }
      </div>
      <div className="mt-3 table-container">
        <table>
          <thead>
            <tr>
              <th>{ t("Endpoint") }</th>
              <th>{ t("Parameters") }</th>
              <th>{ t("Description") }</th>
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
      <div id="faqs" className="mt-5">{ t("FAQs") }</div>
      <div className="mt-2">
        {faqs.map((item, index) => (
          <div key={index} className="mt-2">
            <div>- {item.question}</div>
            <div>{item.answer}</div>
          </div>
        ))}
      </div>
      <div id="feedback" className="mt-5">{ t("Feedback & Support") }</div>
      <div className="mt-2">
        - <Trans
            i18nKey="discord_server"
            components={{ 1: <a href="https://discord.gg/sRcj4HZyzU" target="_blank" rel="noopener noreferrer">{ t('link') }</a>, 2: <u></u> }}
            ns="translation"
          />
      </div>
      <div>
        - <Trans
            i18nKey="email_support"
            components={{ 1: <a href="mailto:support@simple-ai.io" target="_blank" rel="noopener noreferrer">{ t('link') }</a>, 2: <u></u> }}
            ns="translation"
          />
      </div>
      <div>
        - <Trans
            i18nKey="github_issues"
            components={{ 1: <a href="https://github.com/gcc3/simple-ai-chat/issues" target="_blank" rel="noopener noreferrer">{ t('link') }</a>, 2: <u></u> }}
            ns="translation"
          />
      </div>
    </>
  )

  if (!ready || !transReady) return (<div><br></br></div>);
  return (
    <div className="Documentation">
      <div className="text-center mb-4">
        <div>{ t("Documentation") }</div>
      </div>
      <div>{content}</div>
    </div>
  );
};

export default Documentation;