
Simple AI Chat
==============

Forked from https://github.com/openai/openai-quickstart-node  


Dependencies
------------

OpenAI https://platform.openai.com/docs/introduction  
React https://reactjs.org/  
Next.js https://nextjs.org/  


.env
----

OPENAI_API_KEY  
Get from https://platform.openai.com/account/api-keys  

MODEL  
gpt-3.5-turbo, etc...

END_POINT  
Now support chat_completion, text_completion  

TEMPERATURE  
From 0 to 1

FINE_TUNE_PROMPT_END  
FINE_TUNE_STOP  
For fine-tuned model,  
The prompt end will be added to the prompt  
Stop will be used to end the completion


Setup
-----

1. Install the requirements

   ```bash
   $ npm install
   ```

2. Make a copy of the example environment variables file

   ```bash
   $ cp .env.example .env
   ```

3. Add [API key](https://platform.openai.com/account/api-keys) to the newly created `.env` file

4. Run the app

   ```bash
   $ npm run dev
   ```
