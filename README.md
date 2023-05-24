
Simple AI Chat
==============

Forked from https://github.com/openai/openai-quickstart-node  


Dependencies
------------

OpenAI https://platform.openai.com/docs/introduction  
OpenAI API https://platform.openai.com/docs/api-reference  
React https://reactjs.org/  
Next.js https://nextjs.org/  


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

* GOO_API_APP_ID  
Text extraction API  
Get from https://labs.goo.ne.jp/apiusage/  


Setup
-----

1. Install the requirements

   ```bash
   $ npm install
   $ npm install next -g
   ```

2. Make a copy of the example environment variables file

   ```bash
   $ cp .env.example .env
   ```

3. Run the app

   ```bash
   $ npm run dev
   ```
   
4. Create `dict.csv` (optional)

  The format should be "entry", "defination"
  
