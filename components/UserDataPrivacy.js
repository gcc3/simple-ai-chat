function UserDataPrivacy() {
  const content = (
    <div>
      <div>Introduction</div><br></br>
      Welcome to <u><a href="https://simple-ai.io">simple-ai.io</a></u>. We are committed to protecting your personal information and your right to privacy.<br></br>
      <br></br>
      <div>What Information We Collect</div><br></br>
      We collect minimal user information strictly necessary to provide and improve our services.<br></br>
      <br></br>
      <div>This information may include:</div><br></br>
      - Basic account information: Email address for account creation.<br></br>
      - Usage data: Email address will be used for account registeration, password recovery and service updates notification.<br></br>
      <br></br>
      <div>How We Use Your Information</div><br></br>
      We use your information to provide, improve, and customize our services. We do not sell, rent, or trade your information to any third parties.<br></br>
      <br></br>
      <div>How We Store and Protect Your Information</div><br></br>
      Your data is securely stored in our website's database. We implement a variety of security measures to maintain the safety of your personal information.<br></br>
      <br></br>
      <div>Your Rights</div><br></br>
      You have the right to access, update, or delete your personal information at any time. When you delele your account, we will delete all your personal information from our database.<br></br>
      <br></br>
      <div>Changes to This Policy</div><br></br>
      We may modify this privacy policy at any time, so please review it frequently. Changes will take effect immediately upon their posting on the website.<br></br>
      <br></br>
      <div>Contact Us</div><br></br>
      If you have any questions or concerns about this privacy policy, please contact us at <code>support@simple-ai.io</code>.<br></br>
    </div>
  )

  return (
    <div className="UserDataPrivacy">
      <div className="text-center mt-2 mb-4">
         <div>Privacy Policy</div>
      </div>
      <div>{content}</div>
    </div>
  );
}

export default UserDataPrivacy;
