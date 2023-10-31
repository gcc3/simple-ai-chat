import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm'

function UserDataPrivacy() {
  const markdown = `
  **1. Introduction**
  
  Welcome to [SimpleAI](simple-ai.io). We are committed to protecting your personal information and your right to privacy.
  
  **2. What Information We Collect**
  
  We collect minimal user information strictly necessary to provide and improve our services. This information may include:
  
  - Basic account information: Email address for account creation.
  - Usage data: Email address will be used for account registeration, password recovery and service updates notification.
  
  **3. How We Use Your Information**
  
  We use your information to provide, improve, and customize our services. We do not sell, rent, or trade your information to any third parties. 
  
  **4. How We Store and Protect Your Information**
  
  Your data is securely stored in our website's database. We implement a variety of security measures to maintain the safety of your personal information.
  
  **5. Your Rights**
  
  You have the right to access, update, or delete your personal information at any time. When you delele your account, we will delete all your personal information from our database.
  
  **6. Changes to This Policy**
  
  We may modify this privacy policy at any time, so please review it frequently. Changes will take effect immediately upon their posting on the website.
  
  **7. Contact Us**
  
  If you have any questions or concerns about this privacy policy, please contact us at soft@gochaichai.com.
  `

  return (
    <div className="UserDataPrivacy">
      <div className="text-center">
        <Markdown>
          **Privacy Policy**
        </Markdown>
      </div>
      <Markdown remarkPlugins={[remarkGfm]} children={markdown} />
    </div>
  );
}

export default UserDataPrivacy;
