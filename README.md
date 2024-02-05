
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


Features
--------

Refer the [Documentation](https://simple-ai.io) page.  
Click the dot in the screen corner.  


Node (AI Node)
--------------

Simple AI is able to link to another support AI or data source.  
To use AI links, set `USE_NODE_AI` to `true`.  

Request will be sent from Simple AI as following format:  
GET http://endpoint_url?query_parameter_for_input=query_string&history=history_json_string

Any API response format as following can be treated as a `node`:  
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
    "images": [
      {
        "image_url": "image_url",
      },
    ],
    "files": [
      {
        "url": "file_url",
      },
    ]
  }
}
```

Another 2 repositories [simple-ai-node](https://github.com/gcc3/simple-ai-node) and [simple-ai-hub](https://github.com/gcc3/simple-ai-hub) are provided.  
To use multiple AI node, a AI hub is suggested, it can send query to multipe node simultaneously.  


Setup
-----

1. Install the requirements  
   `$ npm install`  
   `$ npm install next -g`  

2. Create necessary files.  
   Create `.env` from `.env.example`  
   Create `role.csv` from `role.csv.example` (optional)  
   `role.csv.example` is got from https://github.com/f/awesome-chatgpt-prompts  
   * `db.sqlite` will be created automatically.  

3. Build and run the app.  
   `$ npm run build`  
   `$ npm run dev` or `$npm start`


.env
----

* NODE_ENV  
For development environment use `development`.
For production environment use `production`.

* NEXT_PUBLIC_BASE_URL  
Fill in the base URL, for example: `http://localhost:3000`  

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
To use multiple node, consider use [Simple AI Hub](https://github.com/gcc3/simple-ai-hub).  

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

* NEXT_PUBLIC_ROLE_USAGE_LIMIT and NEXT_PUBLIC_ROLE_AMOUNT  
Useage limit is for seting limit for different roles.  
Format: `role:daily_limit,weekly_limit,monthly_limit`.  
Role amount is for setting price.  
Format `role:amount`.  
Roles are separated by `;`.  

* HUNTER_API_KEY  
Use hunter API to verify email.  

* GOOGLE_API_KEY  
Use for detect accurate address.   

* MINIMALIST  
For minimalist, a more simple UI.  
The value should be `true` or `false`.  

* WELCOME_MESSAGE and VIDEO_ID  
Set a welcome message and introduction video in front page.  

* IPINFO_TOKEN  
`ipinfo.io` token for getting country from IP.  

* NEXT_PUBLIC_DISCORD
Discord invitation link, the last part.  

* VECTARA_API_KEY  
VECTARA_CUSTOMER_ID  
VECTARA_CLIENT_ID  
VECTARA_CLIENT_SECRET  
DOCUMENT_CORPUS_ID  
Default vectara database settings, and documentation corpus ID.  


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

Or  

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

_Originally Forked from https://github.com/openai/openai-quickstart-node_  
