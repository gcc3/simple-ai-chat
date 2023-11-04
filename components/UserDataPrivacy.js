function UserDataPrivacy() {
  const content = (
    <div>
      <strong>Introduction</strong><br></br>
      Welcome to <u><a href="https://simple-ai.io">simple-ai.io</a></u>. We are committed to protecting your personal information and your right to privacy.<br></br>
      <br></br>
      <strong>What Information We Collect</strong><br></br>
      We collect minimal user information strictly necessary to provide and improve our services.<br></br>
      <br></br>
      <strong>This information may include:</strong><br></br>
      - Basic account information: Email address for account creation.<br></br>
      - Usage data: Email address will be used for account registeration, password recovery and service updates notification.<br></br>
      <br></br>
      <strong>How We Use Your Information</strong><br></br>
      We use your information to provide, improve, and customize our services. We do not sell, rent, or trade your information to any third parties.<br></br>
      <br></br>
      <strong>How We Store and Protect Your Information</strong><br></br>
      Your data is securely stored in our website's database. We implement a variety of security measures to maintain the safety of your personal information.<br></br>
      <br></br>
      <strong>Your Rights</strong><br></br>
      You have the right to access, update, or delete your personal information at any time. When you delele your account, we will delete all your personal information from our database.<br></br>
      <br></br>
      <strong>Changes to This Policy</strong><br></br>
      We may modify this privacy policy at any time, so please review it frequently. Changes will take effect immediately upon their posting on the website.<br></br>
      <br></br>
      <strong>Contact Us</strong><br></br>
      If you have any questions or concerns about this privacy policy, please contact us at <code>soft@gochaichai.com</code>.<br></br>
    </div>
  )

  return (
    <div className="UserDataPrivacy">
      <div className="text-center mt-2 mb-4">
         <strong>Privacy Policy</strong>
      </div>
      <div>{content}</div>
    </div>
  );
}

export default UserDataPrivacy;
