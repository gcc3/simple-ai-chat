
Email Sender
============


Dependencies
------------

AWS SES service  
Python 3  


Setup
-----

`pip install -r requirements.txt`


Usage
-----

Before sending setup `content.txt`.  

Test sendable  
This will send to a single email for testing.  
`python send.py --email your_email@email.com`  

Test send, will not send real email  
`python send.py --test`  

Send to all users  
A confirmation is required.    
`python send.py`  
