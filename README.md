
Simple AI Chat
==============


Simple AI Chat is a command-based AI chat application, aimed at providing users with an easy and simple AI experience. This application is deployed to [simple-ai.io](https://simple-ai.io). You can fork this code and deploy it on your machine for non-commercial use. (For details, please refer to the LICENSE file.) For bugs or suggestions, please report to the repository's GitHub Issues.  


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

* Vision  
Vision models, or called GPT-4V is now supported.  
Use `+img[https://image_url]` to ask question about an image/multiple images.  

* Function calling  
Support for [function calling](https://openai.com/blog/function-calling-and-other-api-updates), the AI can call the function itself, and with the description it can know when to use the function. Amazing!  
To list available functions, use `:function ls`  
To execute a function from input, use `!function_name({ "argument": "value" })`  
Example: `!get_time({ "timezone": "UTC" })`  
!get_weather({ "location": "kyoto" })

* Session  
to continue the previous talk, use `:session attach [session_id]` to attach to a session.  
Use `:info` to check the current session ID.  

* Logs  
Use `:log` to show the current conversation(session) history.  

* Session log  
Use arrow key "←", and "→" to check and print previous or next session log.  
Before switching log, unfocusing input box is required.
Use "ESC" key to unfocus, or just click somewhere else.  

* Role
Roles are prompts created for certain purposes.  
User can custom own role prompt.  
To use role, simply type `:role use [role_name]`.  
Use `:role list` to check current available roles.  
Prompts provided by the Awesome ChatGPT Prompts  

* Custom Roles 
Use `:user role` command to add, set, delete custom roles.  

* Self Result Evaluation  
I found that the AI can evaluate the result of itself very well.  
And this can solve the credibility problem.  
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

* Themes  
Provide light theme by default, a dark theme, and a terminal style theme.  
Use `:theme [light/dark/terminal]` to change color theme.

* Fullscreen Mode  
Use `:fullscreen` to turn on fullscreen mode.  
Use `:fullscreen split` to use a vertically splited screen.  

* User  
User `:user add [username] [email] [password?]` to create a new user.  
If no password set, it will send the initial password to email.  
Use `:user set pass [password]` to change password.  
`:user set email [email]` will send a verification email to user, after verified, email will be updated.  
Use `:login [username] [password]`, `:logout` to login and logout user.  
Use `:user reset pass [username] [email]` to recover user password.  
User settings will be applied after login.  
When user deleted, this is a soft deleted.  
When user re-add himself use same email address, user subscription will be resumed.  

* Formatters  
Support code block display with a markdown formatter.  
Support URL formatter to add href.  

* Multiple Lines Input  
It's possible to input multiple lines. Use `crtl` or `alt` with `enter` key to break new line.

* Placeholder  
Use placeholder to store and show the last input.  
Use `tab` key to restore input from the placehodler.  

* File upload  
Support image type: JPG, PNG  
Support file type: TXT, JSON, DOCX, PDF  
User can upload these types and query for file content.  
Image type will be answer with vision model.  


Roles
-----

System has 4 kinds of roles.
1. root_user, system management
2. super_user, advanced use
3. pro_user, professional use
4. user, basic use


Messages
--------

| #  | Part                           | Role            | Description                              |
|----|--------------------------------|-----------------|------------------------------------------|
| -3 | System master message          | system          | set with `ROLE_CONTENT_SYSTEM`           |
| -2 | Role prompt                    | system          | Role prompt message.                     |
| -1 | Chat history                   | user, assistant | Chat history from user and assistant     |
|  0 | User input                     | user            | Direct input provided by the user,       |
|  1 | Function calling result        | function        | Result of function calling (tool calls)  |
|  2 | Vector database query result   | system          | Result from a query to a vector database |
|  3 | Node AI query result           | -               | Replace with result from AI node or hub  |
|  4 | Location info                  | system          | Add when location service is enabled     |


Node (AI Node)
--------------

Simple AI is able to link to another support AI or data source.  
To use AI links, set `USE_NODE_AI` to `true`.  

Any API response format as following can be used as a `node``:  

Simply use text:

```json
{
    "result": "Sample result text."
}
```

Or more complex:

```json
{
    "result": {
      "text": "Sample result text.",
      "image": [
         {
            "name": "file_name.file_extension",
            "image_url": "",
         },
      ],
      "files": [
         {
            "name": "file_name.file_extension",
            "url": "file_url",
         },
      ]
    }
}
```

Another 2 repositories [simple-ai-node](https://github.com/gcc3/simple-ai-node) and [simple-ai-hub](https://github.com/gcc3/simple-ai-hub) are provided.  
To use multiple AI node, a AI hub is suggested, it can send query to multipe node simultaneously.  


Shortcuts
---------

`/` or `TAB` to jump to input box.  
`TAB` key to restore the placeholder text which is the last input.  
`ESC` to clear input.  
`control + C` to stop generating.  
`control + R` to reset session.  
`Left arrow` or `k` to navigating to the previous session history/log.  
`Right arrow` or `j` to navigating to the next session history/log. 


Setup
-----

1. Install the requirements  
   `$ npm install`  
   `$ npm install next -g`  

2. Create necessary files.  
   Create `log.config`  
   Create `.env` from `.env.example`  
   Create `role.csv` from `role.csv.example` (optional)  
   `role.csv.example` is got from https://github.com/f/awesome-chatgpt-prompts  
   * `db.sqlite` will be created automatically.  

3. Build and run the app.  
   `$ npm run build`  
   `$ npm run dev` or `$npm start`


.env
----

* ROOT_PASS  
System root password, will be set when database initialized.

* OPENAI_API_KEY  
Get from https://platform.openai.com/account/api-keys  

* MODEL  
`gpt-4`, `gpt-3.5-turbo`, etc...

* MODEL_V  
Vision models.  

* TEMPERATURE  
What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random  
lower values like 0.2 will make it more focused and deterministic.  

* TOP_P  
Range 0 ~ 1, 0.1 means only the tokens comprising the top 10% probability mass are considered.  

* N  
How many completions to generate for each prompt.

* ROLE_CONTENT_SYSTEM  
Set the role system's content to role play.  

* INIT_PLACEHOLDER and ENTER  
Control the default placeholder text and enter key text.  

* WAITING and QUERYING  
Indicating the message that will show when waiting and querying.  

* MAX_TOKENS  
Control the max tokens generate in the chat completion.  

* USE_FUNCTION_CALLING  
Use function calling feature, value should be `true` or `false`.  

* WOLFRAM_ALPHA_APPID  
For API calls for wolfram alpha API.  
Get from https://products.wolframalpha.com/api

* USE_NODE_AI  
[Simple AI Node](https://github.com/gcc3/simple-ai-node) is available to help the chat answer with data.
To use multiple node, consider use [Simple AI Hub](https://github.com/gcc3/simple-ai-hub)  
Function calling: `query_node_ai(query)`  

* USE_VECTOR  
Control enable vectara (vector database), value should be `true` or `false`.  

* VECTARA_API_KEY  
The API key of the vectara, can generate from the console.  

* VECTARA_CUSTOMER_ID  
The customer ID of vectara, can get from user profile.  

* DB  
Database engline, example `DB=sqlite`.  
Supported engine: `sqlite`.  

* JWT_SECRET  
Secret for user authentication.  
Generate with `openssl rand -hex 16`.  

* AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME  
Config to use AWS service, eg, S3 Bucket, SES.  

* USE_ACCESS_CONTROL  
When it enabled, will count user usage and limit access for normal `user`.
The value should be `true` or `false`.

* USE_PAYMENT  
Enabel payment for upgrading user account.  
The value should be `true` or `false`.  

* PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET  
When using paypal as a payment method.

* SAME_SITE_COOKIE  
In production set to `SameSite=Lax; Secure`

* USE_EMAIL  
Use email to reset password or notifications.  
The value should be `true` or `false`.  

* ROLE_USAGE_LIMIT and ROLE_AMOUNT  
Useage limit is for seting limit for different roles.  
Format: `role:daily_limit,weekly_limit,monthly_limit`.  
Role amount is for setting price.  
Format `role:amount`.  
Roles are separated by `;`.  

* USE_PROMO_CODE  
Control use promotion code or not.  
The value should be `true` or `false`.  

* HUNTER_API_KEY  
Use hunter API to verify email.  

* GOOGLE_API_KEY  
Use for detect accurate address.  


Coding rules
------------

For API response
Return a RESTful API response, with correct response code.  
If there is an error, exmple response as below:  

```
return res.status(400).json({
   success: false,
   error: "Error message",
});
```

or 

```
return res.status(400).json({
   success: false,
   error: error,  // If there is error handling
});
```

If success, example response as below:

```
res.status(200).json({
   success: true,
   message: "Success message.",
   some_additonal_obj,
});
```


log.config
----------

Can setup output log filter rules for not storing testing messages.  
One row one rule.  
Example:  `IP=127.0.0.1`, `USER=username`  

_Originally Forked from https://github.com/openai/openai-quickstart-node_  
