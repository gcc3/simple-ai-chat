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

You can fork this code and deploy it on your own machine for non-commercial use. (For details, please refer to the [LICENSE](https://github.com/gcc3/simple-ai-chat/blob/master/LICENSE) file.) For bugs or suggestions, please report them to the repository's [GitHub Issues page](https://github.com/gcc3/simple-ai-chat/issues).  


Quick Start
-----------

1. Web interface  
    [`https://simple-ai.io`](https://simple-ai.io)  

2. CLI  
    Install: `npm i simple-ai-chat -g`  
    Start: `simple-ai-chat` or `sc`  
    Start CLI will also start the MCP client.  
    npm package: [`simple-ai-chat`](https://www.npmjs.com/package/simple-ai-chat)  

3. MCP client  
    Install: `npm i simple-ai-chat -g`  
    Use `smcp` to start the client service.  
    The `mcpconfig.json` file is located in the `~/.simple` folder.  

4. Ollama  
    Set the environment variable `OLLAMA_ORIGINS` to `*` or your domain to allow CORS.  
    Start the Ollama server with `ollama serve`.
    ```
    export OLLAMA_ORIGINS="*"
    ollama serve
    ```
    Note: to use function calling, set `:stream off` as in Ollama it's not supported.  


Documentation
-------------

The documentation is available at [`simple-ai.io`](https://simple-ai.io). 
In the webpage, there is a little dot on the bottom right corner, click it to open the back page. 
Alternatively, you can use the command `:store use "Simple AI Documentation"` to enable the data to AI, and ask it.  


Dependencies
------------

OpenAI https://platform.openai.com/docs/api-reference  
React https://reactjs.org/  
Next.js https://nextjs.org/  
tailwind https://tailwindcss.com/docs/  
Anthropic https://www.anthropic.com/  
Google AI https://ai.google.dev/gemini-api/docs  
xAI https://x.ai/  
Ollama https://ollama.com/  
WolframAlpha APIs https://products.wolframalpha.com/api  


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
`npm update simple-ai-chat -g`  

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
  `npm install`  

2. Create `.env` and setup it.  
  Create `.env` from `.env.example`  
  For setup refer to the `.env` section below.

3. Run `setup.sh` to initialize.  
  `bash setup.sh`  

4. Build and run the app.  
  `npm run build`  
  Then use `npm run dev` or `npm start`  


`.env` Setup
------------

Copy `.env.example` to `.env` and fill in the values.  

PORT  
The port for the server, default is `3000`.  

PM2_NAME  
The process name for PM2, default is `simple-ai.io`.  

NODE_ENV  
For development environment use `development`.  
For production environment use `production`.  

NEXT_PUBLIC_BASE_URL  
Fill in the base URL, for example: `http://localhost:3000`  

ROOT_PASS  
System root password, will be set when database initialized.  

OPENAI_BASE_URL and OPENAI_API_KEY  
Key can get from https://platform.openai.com/account/api-keys  
Base URL is the API endpoint, `https://api.openai.com/v1`, etc...

MODEL  
Large language model, `gpt-4o`, etc...  

TEMPERATURE  
What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random  
lower values like 0.2 will make it more focused and deterministic.  

ROLE_CONTENT_SYSTEM  
Set the system prompt.  

WELCOME_MESSAGE
Control the custom welcome message.  

WOLFRAM_ALPHA_APPID  
For API calls for wolfram alpha API.  
Get from https://products.wolframalpha.com/api

USE_NODE_AI  
[Simple AI Node](https://github.com/gcc3/simple-ai-node) is available to help the chat answer with data.
To use multiple nodes, consider using [Simple AI Hub](https://github.com/gcc3/simple-ai-hub).  

DB  
Database engline, example `DB=sqlite`.  
Supported engine: `sqlite`.  

JWT_SECRET  
Secret for user authentication.  
Generate with `openssl rand -hex 16`.  

AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME  
Config to use AWS service, eg, S3 Bucket, SES.  

USE_ACCESS_CONTROL  
When it enabled, will count user usage and limit access for normal `user`.
The value should be `true` or `false`.

USE_PAYMENT  
Enable payment.  
The value should be `true` or `false`.  

PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET  
When using paypal as a payment method.

SAME_SITE_COOKIE  
In production set to `SameSite=Lax; Secure`

USE_EMAIL  
Use email to reset password or notifications.  
The value should be `true` or `false`.  

NEXT_PUBLIC_ROLE_USAGE_LIMIT and NEXT_PUBLIC_ROLE_AMOUNT  
Usage limit is for setting limit for different roles.  
Format: `role:daily_limit,weekly_limit,monthly_limit`.  
Role amount is for setting price.  
Format `role:amount`.  
Roles are separated by `;`.  

HUNTER_API_KEY  
Use hunter API to verify email.  

GOOGLE_API_KEY  
Use for detect accurate address.   

MINIMALIST  
For minimalist, a more simple UI.  
The value should be `true` or `false`.  

IPINFO_TOKEN  
IP info (`ipinfo.io`) is used for getting country from IP.   
Use IP info is for enable or disable the IP support, the value should be `true` or `false`.  
`ipinfo.io` token will be used.  

USE_USER_ACCOUNTS  
Enable user accounts, the value should be `true` or `false`.  

DEFAULT_FUNCTIONS, DEFAULT_ROLE, DEFAULT_STORES, DEFAULT_NODE  
Default functions, role, stores and node.  
Example: 
DEFAULT_FUNCTIONS=get_time,get_weather,redirect_to_url  
DEFAULT_STORES=store1,store2  

_Originally Forked from https://github.com/openai_  
