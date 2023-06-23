
Simple AI Chat
==============

Forked from https://github.com/openai/openai-quickstart-node  


Dependencies
------------

OpenAI https://platform.openai.com/docs/introduction  
OpenAI API https://platform.openai.com/docs/api-reference  
React https://reactjs.org/  
Next.js https://nextjs.org/  


Setup
-----

1. Install the requirements  
   `$ npm install`  
   `$ npm install next -g`  

2. Create necessary files.  
   Create `log.config`  
   Create `log.txt`  
   Create `.env` from `.env.example`  
   Create `dict.csv` from `dict.csv.example` (optional)  
   Create `role.csv` from `role.csv.example` (optional)  
   `role.csv` is get from https://github.com/f/awesome-chatgpt-prompts  

3. Build and run the app.  
   `$ npm run build`  
   `$ npm run dev` or `$npm start`  


.env
----

* OPENAI_API_KEY  
Get from https://platform.openai.com/account/api-keys  

* MODEL  
gpt-3.5-turbo, etc...

* END_POINT  
Now support chat_completion, text_completion  

* TEMPERATURE  
What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random  
lower values like 0.2 will make it more focused and deterministic.  

* TOP_P  
Range 0 ~ 1, 0.1 means only the tokens comprising the top 10% probability mass are considered.  

* N  
How many completions to generate for each prompt.

* FINE_TUNE_PROMPT_END and FINE_TUNE_STOP  
For fine-tuned model,  
The prompt end will be added to the prompt  
Stop will be used to end the completion

* ROLE_CONTENT_SYSTEM  
Set the role system's content to role play.  

* PROMPT_PREFIX and PROMPT_SUFFIX  
Add prefix and suffix for prompt avoid duplicate text input.  

* MAX_TOKENS  
Control the max tokens generate in the chat completion.  

* DICT_SEARCH  
Enable the dictionary search, value should be `true` or `false`  
To use this feature, GOO_API_APP_ID must be set.  
`dict.csv` should be create before using this feature.  

* GOO_API_APP_ID  
Text extraction API  
Get from https://labs.goo.ne.jp/apiusage/  

* STREAM_CONSOLE  
Control the stream in console or not, value should be `true` or `false`  
If set to true then it will only support single session, for multiple session the text will be distort.  

* USE_EVAL  
Use AI to evaluate the result, value should be `true` or `false`  


log.config
----------

Can setup output log filter rules.  
One row one rule.  

Example:  
IP=127.0.0.1    
