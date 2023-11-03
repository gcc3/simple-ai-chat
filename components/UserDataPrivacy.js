function UserDataPrivacy() {
  const content = (
    <div>
      * Introduction<br></br>
      
      <p>Welcome to <a href="https://simple-ai.io">simple-ai.io</a>. We are committed to protecting your personal information and your right to privacy.</p>
      
      * What Information We Collect<br></br>
      
      <p>We collect minimal user information strictly necessary to provide and improve our services.</p>
      
      <p>This information may include:</p>
      <p>- Basic account information: Email address for account creation.</p>
      <p>- Usage data: Email address will be used for account registeration, password recovery and service updates notification.</p>

      * How We Use Your Information<br></br>
      
      <p>We use your information to provide, improve, and customize our services. We do not sell, rent, or trade your information to any third parties.</p>
      
      * How We Store and Protect Your Information<br></br>
      
      <p>Your data is securely stored in our website's database. We implement a variety of security measures to maintain the safety of your personal information.</p>
      
      * Your Rights<br></br>
      
      <p>You have the right to access, update, or delete your personal information at any time. When you delele your account, we will delete all your personal information from our database.</p>
      
      * Changes to This Policy<br></br>
      
      <p>We may modify this privacy policy at any time, so please review it frequently. Changes will take effect immediately upon their posting on the website.</p>
      
      * Contact Us<br></br>
      
      <p>If you have any questions or concerns about this privacy policy, please contact us at soft@gochaichai.com.</p>
    </div>
  )

  return (
    <div className="UserDataPrivacy">
      <div className="text-center mt-2 mb-4">
         - Privacy Policy -
      </div>
      <div>{content}</div>
    </div>
  );
}

export default UserDataPrivacy;
