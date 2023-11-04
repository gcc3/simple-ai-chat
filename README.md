
Simple AI Chat
==============


A dialogue application implemented based on OpenAI's API.  
The backend of which can be customizable.  


Dependencies
------------

OpenAI API https://platform.openai.com/docs/api-reference  
openai-node https://github.com/openai/openai-node  
React https://reactjs.org/  
Redux https://redux.js.org/  
Next.js https://nextjs.org/  
WolframAlpha APIs https://products.wolframalpha.com/api  
Vectara https://vectara.com/  
tailwind https://tailwindcss.com/docs/


Main Features
-------------

Commands are supported, use `:help` to show commands.  

* Dictionary search  
A local dictionary will be used as messages to let AI reference to enhance the AI response quality.  
To check/add entry use `:entry list`, `:search [keyword]`, and `:entry add`. 

* Function calling  
Support for [function calling](https://openai.com/blog/function-calling-and-other-api-updates), the AI can call the function itself, and with the description it can know when to use the function. Amazing!  
To list available functions, use `:function ls`  
To execute a function from input, use `!function_name(argument=value)`  
Example: `!get_weather(location=Tokyo)`  

* Session  
Use `:info` to check the current session ID, and attach the session with `:session [session_id]` to continue the previous talk.  
Use `:log` to show the current conversation history.  

* Roleplay  
To use roleplay, simply type `:role use [role_name]`.  
Use `:role list` to check current available roles.  
Prompts provided by the Awesome ChatGPT Prompts  

* Self Result Evaluation  
I found that the AI can evaluate the result of itself very well.  
And this can solve the credibility problem in dictionary searches.  
To show the stats information includings the self result evaluation use `:stats on`.  

* Location Service  
Use the device location to enhance the geology location based questions (like weather or time).  
To enable use `:location on`  

* Speak  
Use `:speak on` to turn on the speak after generating.  
Use `:speak stop` to stop the speaking.  
To change language use `:lang use [language code]`  

* AI links   
Refer AI Links below.  

* Vector Database  
Query data from vector database engine.  
Currently support [Vectara](https://vectara.com/).  

* Dark Mode  
A terminal style dark theme.  
Use `:theme [light/dark]` to change color theme.

* Full Screen Mode  
Use `:fullscreen on` to turn on fullscreen mode.  

* User  
Use `:user` command to add new user, set user settings, password, Email.  
Use `:login`, `:logout` to login and logout user.  
User settings will be applied after login.  

* Formatters  
Support code block display with a markdown formatter.  
Support URL formatter to add href.  

* Multiple Lines Input  
It's possible to input multiple lines. Use `crtl` or `alt` with `enter` key to break new line.

* Placeholder  
Use placeholder to store and show the last input.  
Use `tab` key to restore input from the placehodler.  


AI Links
--------

Simple AI is able to link to another support AI by function calling.  

The API response format:  

```json
{
    "result": "Sample result text."
}
```

Also, 2 projects [simple-ai-node](https://github.com/gcc3/simple-ai-node) and [simple-ai-hub](https://github.com/gcc3/simple-ai-hub) are provided.  
To use multiple AI node, a AI hub is suggested, it can send query to multipe node simultaneously.  

To use AI links:  

1. Set `USE_NODE_AI` to `true`.  
2. Set `NODE_AI_URL` to the AI node.  


Shortcuts
---------

`/` or `TAB` to jump to input box.  
`TAB` key to restore the placeholder text which is the last input.  
`ESC` to clear input.  
`control + C` to stop generating.  
`control + F` to toggle fullscreen mode on/off.  
`control + L` to clear output and reset.  


Setup
-----

1. Install the requirements  
   `$ npm install`  
   `$ npm install next -g`  

2. Create necessary files.  
   Create `log.config`  
   Create `log.txt`  
   Create `.env` from `.env.example`  
   Create `dict.csv` from `dict.csv.example` (required if turn on the dictionary search.)  
   Create `role.csv` from `role.csv.example` (optional)  
   `role.csv.example` is got from https://github.com/f/awesome-chatgpt-prompts  
   * `db.sqlite` will be created automatically.  

3. Build and run the app.  
   `$ npm run build`  
   `$ npm run dev` or `$npm start`


.env
----

* OPENAI_API_KEY  
Get from https://platform.openai.com/account/api-keys  

* MODEL  
`gpt-4`, `gpt-3.5-turbo`, etc...

* TEMPERATURE  
What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random  
lower values like 0.2 will make it more focused and deterministic.  

* TOP_P  
Range 0 ~ 1, 0.1 means only the tokens comprising the top 10% probability mass are considered.  

* N  
How many completions to generate for each prompt.

* ROLE_CONTENT_SYSTEM  
Set the role system's content to role play.  

* PROMPT_PREFIX and PROMPT_SUFFIX  
Add prefix and suffix for prompt avoid duplicate text input.

* INIT_PLACEHOLDER and ENTER  
Control the default placeholder text and enter key text.  

* WAITING and QUERYING  
Indicating the message that will show when waiting and querying.  

* MAX_TOKENS  
Control the max tokens generate in the chat completion.  

* DICT_SEARCH  
Enable the dictionary search, value should be `true` or `false`  
To use this feature, GOO_API_APP_ID must be set.  
`dict.csv` should be create before using this feature.  

* GOO_API_APP_ID  
Text extraction API  
Get from https://labs.goo.ne.jp/apiusage/  

* USE_EVAL  
Use AI to evaluate the result, value should be `true` or `false`.  

* USE_FUNCTION_CALLING  
Use function calling feature, value should be `true` or `false`.  

* WOLFRAM_ALPHA_APPID  
For API calls for wolfram alpha API.  
Get from https://products.wolframalpha.com/api

* USE_NODE_AI  
[Simple AI Node](https://github.com/gcc3/simple-ai-node) is available to help the chat answer with data.
To use multiple node, consider use [Simple AI Hub](https://github.com/gcc3/simple-ai-hub)  
Function calling: `query_node_ai(query)`  

* NODE_AI_URL  
To set up the node AI API url.  

* FORCE_NODE_AI_QUERY  
Force to query node AI for every query.  

* USE_VECTOR  
Control enable vectara (vector database), value should be `true` or `false`.  

* VECTARA_API_KEY  
The API key of the vectara, can generate from the console.  

* VECTARA_CUSTOMER_ID  
The customer ID of vectara, can get from user profile.  

* VECTARA_CORPUS_ID  
The indice id.  

* FORCE_VECTOR_QUERY  
Force query from the vectara vector database.  

* DB  
Use database to store logs, use `DB=sqlite`.  
Use file to store logs, use `DB=file`.  

* JWT_SECRET  
Secret for user authentication.  
Generate with `openssl rand -hex 16`.  


log.config
----------

Can setup output log filter rules for not storing testing messages.  
One row one rule.  
Example:  `IP=127.0.0.1`, `USER=username`  

_Originally Forked from https://github.com/openai/openai-quickstart-node_  
