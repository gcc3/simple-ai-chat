import { useTranslation, Trans } from 'react-i18next';

function UserDataPrivacy() {
  const { t, ready } = useTranslation("privacy_policy");

  const content = (
    <div>
      <div>- { t("Introduction") }</div>
      { t("Welcome to Simple AI (simple-ai.io). We are committed to protecting your personal information and your right to privacy.") }<br></br>
      <div className="mt-3">- { t("What Information We Collect") }</div>
      { t("We collect minimal user information strictly necessary to provide and improve our services.") }<br></br>
      <div>{ t("This information may include") }:</div>
      { t("- Basic account information: email address for account creation.") }<br></br>
      { t("- Usage data: email address will be used for account registeration, password recovery and service updates notification.") }<br></br>
      <div className="mt-3">- { t("How We Use Your Information") }</div>
      { t("We use your information to provide, improve, and customize our services. We do not sell, rent, or trade your information to any third parties.") }<br></br>
      <div className="mt-3">- { t("How We Store and Protect Your Information") }</div>
      { t("Your data is securely stored in our website's database. We implement a variety of security measures to maintain the safety of your personal information.") }<br></br>
      <div className="mt-3">- { t("Your Rights") }</div>
      { t("You have the right to access, update, or delete your personal information at any time. When you delete your account, we will delete all your personal information from our database.") }<br></br>
      <div className="mt-3">- { t("Changes to This Policy") }</div>
      { t("We may modify this privacy policy at any time, so please review it frequently. Changes will take effect immediately upon their posting on the website.") }<br></br>
      <div className="mt-3">- { t("Contact Us") }</div>
      <Trans
        i18nKey="email_support_privacy_policy"
        components={{ 1: <a href="mailto:support@simple-ai.io" target="_blank" rel="noopener noreferrer">{ t('link') }</a>, 2: <u></u> }}
        ns="privacy_policy"
      />
    </div>
  )

  if (!ready) return (<div><br></br></div>);
  return (
    <div className="UserDataPrivacy">
      <div className="text-center mb-4">
        <div>{ t("Privacy Policy") }</div>
      </div>
      <div>{content}</div>
    </div>
  );
}

export default UserDataPrivacy;
