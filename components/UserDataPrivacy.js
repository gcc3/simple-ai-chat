function UserDataPrivacy() {
  const content = (
    <div>
      <div>- Introduction</div>
      Welcome to <u><a href="https://simple-ai.io">simple-ai.io</a></u>. We are committed to protecting your personal information and your right to privacy.<br></br>
      <div className="mt-3">- What Information We Collect</div>
      We collect minimal user information strictly necessary to provide and improve our services.<br></br>
      <div>This information may include:</div>
      - Basic account information: email address for account creation.<br></br>
      - Usage data: email address will be used for account registeration, password recovery and service updates notification.
      <div className="mt-3">- How We Use Your Information</div>
      We use your information to provide, improve, and customize our services. We do not sell, rent, or trade your information to any third parties.
      <div className="mt-3">- How We Store and Protect Your Information</div>
      Your data is securely stored in our website's database. We implement a variety of security measures to maintain the safety of your personal information.<br></br>
      <div className="mt-3">- Your Rights</div>
      You have the right to access, update, or delete your personal information at any time. When you delele your account, we will delete all your personal information from our database.<br></br>
      <div className="mt-3">- Changes to This Policy</div>
      We may modify this privacy policy at any time, so please review it frequently. Changes will take effect immediately upon their posting on the website.<br></br>
      <div className="mt-3">- Contact Us</div>
      If you have any questions or concerns about this privacy policy, please contact us at `<a href="mailto:support@simple-ai.io"><u>support@simple-ai.io</u></a>`.<br></br>
    </div>
  )

  return (
    <div className="UserDataPrivacy">
      <div className="text-center mb-4">
         <div>Privacy Policy</div>
      </div>
      <div>{content}</div>
    </div>
  );
}

export default UserDataPrivacy;
