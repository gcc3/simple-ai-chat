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
  `npm install`  

2. Create `.env` and setup it.  
  Create `.env` from `.env.example`  

3. Run `setup.sh` to initialize.  
  `bash setup.sh`  

4. Build and run the app.  
  `npm run build`  
  Then use `npm run dev` or `npm start`  


License
-------

[Simple AI License](LICENSE) © 2023 simple-ai.io

You can fork this code and deploy it on your own machine for non-commercial use.  
Commercial use of the software, or any part of it, is not permitted, and neither is  
offering a product that competes with it, free of charge or not.  

Portions of this project are based on code from OpenAI and are provided under the MIT License.  

_Originally Forked from https://github.com/openai_  
