<div align="center">
  <a href="https://ollama.com">
    <img alt="ollama" height="200px" src="https://github.com/user-attachments/assets/1f8f0f14-23d6-4e45-9a32-ad79a390b35b">
  </a>
</div>


Simple AI
=========


Simple AI (`simple-ai-chat`) is a command-based AI chat application that supports both the web and CLI, aimed at providing users with an easy and simple AI experience.
It can use advanced large language models (LLMs) from multiple companies: OpenAI, xAI, Google AI, Anthropic, and Ollama models.

Text generation, image generation, and vision models are supported.
Features like function calling and the Model Control Protocol (MCP) are also supported.

The application is deployed at [simple-ai.io](https://simple-ai.io).  

For bugs or suggestions, please report them to the repository's [GitHub Issues page](https://github.com/gcc3/simple-ai-chat/issues).  


Quick Start
-----------

1. Web interface  
  [`https://simple-ai.io`](https://simple-ai.io)  

2. CLI  
  Install: `npm i simple-ai-chat -g`  
  Start: `simple-ai-chat` or `sc`  
  Start CLI will also start the MCP client.  
  npm package: [`simple-ai-chat`](https://www.npmjs.com/package/simple-ai-chat)  

3. Web CLI  
  [`https://cli.simple-ai.io`](https://cli.simple-ai.io)  
  The CLI interface in the browser, no installation needed.  

4. MCP client  
  Install: `npm i simple-ai-chat -g`  
  Use `smcp` to start the client service.  
  The `mcpconfig.json` file is located in the `~/.simple` folder.  


Documentation
-------------

The documentation of user manual is available at [`simple-ai.io`](https://simple-ai.io). 
In the webpage, there is a little dot on the bottom right corner, click it to open the back page. 
Alternatively, you can use the command `:store use "Simple AI Documentation"` to enable the data to AI, and ask it.  

Full documentation is available at [`simple-ai.io/docs`](https://simple-ai.io/docs).

### Decision generation API

`POST /api/generate/decision` accepts a question or an existing decision JSON draft and returns a complete JSON decision object directly.

```sh
curl http://localhost:3000/api/generate/decision \
  -H 'Content-Type: application/json' \
  -d '{"question":"比较上海和东京居住哪里好"}'
```

Response structure (illustrative content):

```json
{
  "analysis": "先结合预算、工作地点和生活习惯，比较住房、日常消费与通勤成本。",
  "options": ["上海", "东京"],
  "dimensions": [
    { "name": "房价", "analysis": "两地的住房负担都受区域、面积和收入影响，仅比较总价不足以判断。", "conclusion": "应按目标区域、住房面积和当地收入比较实际负担。" },
    { "name": "物价", "analysis": "日常支出取决于外食频率、采购渠道和消费偏好，需要采用相同消费标准比较。", "conclusion": "应根据饮食和消费习惯比较每月日常开销。" },
    { "name": "交通费", "analysis": "交通支出取决于实际通勤路线和公司补贴，还需考虑通勤时间。", "conclusion": "应结合通勤距离、交通方式及公司补贴比较支出。" }
  ],
  "overall_conclusion": "优先选择工作机会、语言环境与预算更匹配的城市；明确收入和目标区域后再做最终决定。"
}
```

To supplement and improve an existing decision, send it directly as the request body:

```sh
curl http://localhost:3000/api/generate/decision \
  -H 'Content-Type: application/json' \
  -d '{"analysis":"比较上海和东京的居住成本","options":["上海","东京"],"dimensions":[{"name":"房价","analysis":"","conclusion":""}],"overall_conclusion":""}'
```

The AI builds on the draft's topic, options and relevant dimensions, fills gaps, improves
the analysis and conclusions, and adds useful missing dimensions. It returns the full updated
object in the same response structure. Draft fields may be omitted or left empty, but at least
one field must contain meaningful content. Supplied fields must have the types shown above.

`question` accepts either question text or a decision object (also accepted as a JSON string).
The existing `user_input` field is an alias. A decision object can also be sent directly as
the request body, as in the example above.
Optional fields: `model`, `session`, and `time`. The configured model is used by default;
a timestamp session is created when omitted. The model must support text generation and
JSON object output. Values follow the question's language, and dimensions are chosen for
each question. Every dimension includes non-empty `name`, `analysis`, and `conclusion` strings.
Existing authentication, access control, usage accounting and history logging apply.
Invalid input returns HTTP 400; invalid or incomplete model output returns HTTP 502.
Errors have the shape `{ "success": false, "error": "..." }`.


CLI Interface
-------------

`cli.js` is for the command-line interface. 

* Setup with npm package  

Instll from npm package  
`npm i simple-ai-chat -g`  

Start the CLI with npm package command
`simple-ai-chat` or `sc`  

Check version  
`sc [-v|--version]`  

Update  
`npm install simple-ai-chat -g`  

Note: Start the CLI interface will also start the MCP client.  

* CLI commands

Use the VI as editor for input  
`:vi`  

Exit  
`:exit`  

* Development  

Start the CLI  
`node cli.js`  

Debug  
`sc [-d|--debug]`  

Change server base URL  
By default the CLI will communicate with `simple-ai.io` server.  
To change the server base URL use the command:
`sc [-b|--base-url <base_url>]`  


MCP Client
----------

`mcp.js` is for the MCP client.  

Start the MCP client  
`node mcp.js`  

Configure the MCP client  
Use `mcpconfig.json` located in the `~/.simple` folder to setup the MCP connection.  

npm package start  
After installing the npm package, start with the command  
`smcp`  

Work with Docker MCP Tookit  
Install Docker and setup the [MCP Tookit](https://docs.docker.com/ai/mcp-catalog-and-toolkit/toolkit/).  
Use `mcpconfig.json.docker.example` to connect.  


Local Installation
------------------

0. Prerequisites  
   OpenAI API key (get from https://platform.openai.com/account/api-keys)  

1. Install the requirements.

   `corepack enable`

   `pnpm install --frozen-lockfile`

2. Create `.env` and setup it.  
  Create `.env` from `.env.example`  

3. Run `setup.sh` to initialize.  
  `bash setup.sh`  

4. Build and run the app.

   `pnpm build`

   Then use `pnpm dev` or `pnpm start`


License
-------

[Simple AI License](LICENSE) © 2023 simple-ai.io

You can fork this code and deploy it on your own machine for non-commercial use.  
Commercial use of the software, or any part of it, is not permitted, and neither is  
offering a product that competes with it, free of charge or not.  

Portions of this project are based on code from OpenAI and are provided under the MIT License.  

_Originally Forked from https://github.com/openai_  
