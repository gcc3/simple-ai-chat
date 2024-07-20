import React, { useEffect, useState, useCallback, Suspense } from "react";
import { getUserInfo } from "utils/userUtils";
import { useTranslation } from "react-i18next";

function Settings() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState(null);

  const { t, ready } = useTranslation("settings");

  useEffect(() => {
    const loadUserInfo = async () => {
      const user = await getUserInfo();
      if (user) {
        setUser(user);
      }
    }

    if (localStorage.getItem("user")) {
      loadUserInfo();
    }
  }, []);

  const handleSubscribe = useCallback((subscription) => async () => {
    const response = await fetch("/api/user/update/email-subscription?" + new URLSearchParams({
      email: user.email,
      email_subscription: subscription,
    }, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }));

    const data = await response.json();
    if (response.status !== 200) {
      console.log(data.error);
      throw data.error || new Error(`Request failed with status ${response.status}`);
    }

    if (data.success) {
      console.log("Email subscription updated.");
      setMessage(data.message);
    }
  });

  const content = (
    <>
      {!user && <div>{ t("User information not found. Please login with command `:login [username] [password]`.") }</div>}
      {user && <div>
        <div>- { t("Email Subscription") }</div>
        <div className="flex flex-wrap items-center mt-2">
          <button className="ml-2" onClick={handleSubscribe("1")}>Subscribe</button>
          <button className="ml-2" onClick={handleSubscribe("0")}>Unsubscribe</button>
        </div>
      </div>}
      {message && <div className="mt-2">
        {<div className="ml-2">{message}</div>}
      </div>}
    </>
  );

  if (!ready) return (<div><br></br></div>);
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="Settings">
        <div className="text-center mb-4">
          <div>{ t("Settings") }</div>
        </div>
        <div>{content}</div>
      </div>
    </Suspense>
  );
}

export default Settings;