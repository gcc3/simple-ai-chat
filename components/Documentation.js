import React from 'react';

const Documentation = () => {
  const features = [
    { name: "GPT-4 Turbo", description: "Chat with the cutting-edge GPT-4 Turbo model." },
    { name: "GPT-4 Vision", description: "Interact with powerful vision models." },
    { name: "Fullscreen mode", description: "A larger input and output area is provided. Use `:fullscreen` to turn on fullscreen mode. Use \`:fullscreen split\` to use a vertically splited screen." },
    { name: "De-hallucination(`self_eval_score`)", description: "Detect hallucinations in chat to provide more trustworthiness, use command \`:stats on\`." },
    { name: "Roles/assistants", description: "Let ChatGPT assume various roles or act as an assistant to provide more satisfactory answers. You can customize your own roles/assistant instructions with a prompt and interact with them." },
    { name: "Personal Database (In progress)", description: "Utilize an advanced vector database engine for powerful data searches. (super_user)" },
  ];

  const shortcuts = [
    { name: "Stop generating", description: "`Control + C`." },
    { name: "Clear output", description: "`Control + R`." },
    { name: "Reset session", description: "`Control + Shift + R`, will start a new session" },
    { name: "Clear the input/unfocus input box", description: "`ESC`." },
    { name: "Focus on input", description: "`Tab` or `/` key." },
    { name: "Repeat last input(placeholder text)", description: "`Tab` key" },
    { name: "Navigate history(session logs)", description: "Arrow keys \"←\", and \"→\". Note: before navigating unfocus from the input box is required." },
  ];

  const content = (
    <>
      <div>Shurtcuts:</div>
      <div>
        {shortcuts.map((item, index) => (
          <div key={index} className="mt-2">
            <div>- {item.name}</div>
            <div>{item.description}</div>
          </div>
        ))}
      </div>
      <div className="mt-5">Features:</div>
      <div>
        {features.map((item, index) => (
          <div key={index} className="mt-2">
            <div>- {item.name}</div>
            <div>{item.description}</div>
          </div>
        ))}
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