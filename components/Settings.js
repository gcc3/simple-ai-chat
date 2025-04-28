import React, { useEffect, useState, useCallback } from "react";
import { getUserInfo } from "utils/userUtils";
import { useTranslation } from "react-i18next";
import { setRtl } from "utils/rtlUtils.js";

function Settings() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [lang, setLang] = useState(null);
  const [message, setMessage] = useState(null);

  const { t, i18n, ready } = useTranslation("settings");
  const { t: tt } = useTranslation("translation");

  useEffect(() => {
    const loadBasicSettings = async () => {
      const languagesJson = await (await fetch("/api/system/languages")).json();
      setLanguages(languagesJson);
    }

    const loadUserSettings = async () => {
      setLoading(true);
      const user = await getUserInfo()
      setUser(user);
      setLoading(false);
    }

    loadBasicSettings();
    if (localStorage.getItem("user")) {
      loadUserSettings();
    } else {
      setLoading(false);
    }

    // Set initial language
    setLang(localStorage.getItem("lang").replace("force", "").trim());
  }, []);

  const updateUserSettings = async (key, value) => {
    const response = await fetch("/api/user/update/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key, value }),
    });

    const data = await response.json();
    if (response.status !== 200) {
      console.log(data.error);
      throw data.error || new Error(`Request failed with status ${response.status}`);
    }

    if (data.success) {
      localStorage.setItem(key, value);
      console.log("Settings updated.");
      setMessage(t("Settings updated."));
    }
  }

  const handleSetLanguage = useCallback((newLang) => async () => {
    // Set language
    const lang_ = newLang.replace("force", "").trim()
    setLang(lang_);
    const i18nLang = lang_.split("-")[0];
    i18n.changeLanguage(i18nLang)
    .then(async () => {
      console.log("Language: " + lang_ + ", i18n: " + i18n.language);
      console.log('Language test:', tt("hello"));
      setRtl(i18nLang === "ar");

      // Update user settings
      if (user) {
        await updateUserSettings("lang", newLang);
      }
    });
  }, [i18n, t, user]);

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
      setMessage(t(data.message));
    }
  }, [user, t]);

  const content = (
    <>
      {message && <div>
        {<div className="ml-2">{message}</div>}
      </div>}
      {languages && <div>
        <div className="mt-3">- {t("Language")}</div>
        <div className="flex flex-wrap items-center mt-2">
          {languages.map((l) => (
            <button 
              className="ml-2 mb-1" 
              key={l.language_code} 
              onClick={handleSetLanguage(l.language_code + " force")} 
              style={{ backgroundColor: l.language_code == lang ? '#EAEAEA' : '' }}
            >
              {l.native_name}
            </button>
          ))}
        </div>
      </div>}
      {user && <div>
        <div className="mt-2">- {t("Email Subscription")}</div>
        <div className="flex flex-wrap items-center mt-2">
          <button className="ml-2" onClick={handleSubscribe("1")}>{t("Subscribe")}</button>
          <button className="ml-2" onClick={handleSubscribe("0")}>{t("Unsubscribe")}</button>
        </div>
      </div>}
    </>
  );

  if (!ready) return (<div><br></br></div>);
  return (
    <div className="Settings">
      <div className="text-center mb-4">
        <div>{t("Settings")}</div>
      </div>
      {loading ? <div>{t("Loading...")}</div> : <div>{content}</div>}
    </div>
  );
}

export default Settings;