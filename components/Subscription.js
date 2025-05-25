import React, { useEffect, useState, useCallback } from "react";
import PayPalButton from "./PayPalButton";
import { getRoleLevel, fetchUserInfo } from "utils/userUtils";
import SubscriptionComparisonTable from "./SubscriptionComparisonTable";
import { npre } from "utils/numberUtils";
import { useTranslation } from "react-i18next";
import moment from "moment";
import { getSetting, setSetting } from "../utils/settingsUtils.js";


// Get amount
function getPrice(subscriptions, role) {
  if (subscriptions.hasOwnProperty(role)) {
    return Number(subscriptions[role].price);
  }
}

function Subscription() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState(null);
  const [targetRole, setTargetRole] = useState(null);
  const [amount, setAmount] = useState(null);
  const [bankingFee, setBankingFee] = useState(0);
  const [subscriptions, setSubscriptions] = useState(null);

  const { t, ready } = useTranslation("subscriptions");
  const { t: tt, ready: tReady } = useTranslation("translation");

  const onSuccess = useCallback(async (details) => {
    console.log("Transaction completed by Mr." + details.payer.name.given_name + ".");
    console.log("Detail: ", details);

    // Update user role
    const response = await fetch("/api/user/update/role", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: targetRole,
      }),
    });

    const data = await response.json();
    if (response.status !== 200) {
      console.log(data.error);
      throw data.error || new Error(`Request failed with status ${response.status}`);
    }

    if (data.success) {
      setMessage(data.message);

      // Refresh user info
      const user = await fetchUserInfo();
      setUser(user);
    } else {
      console.log(data.error);
      setMessage(data.error);
    }
  }, [targetRole, amount]);

  useEffect(() => {
    const loadUserInfo = async () => {
      setLoading(true);
      const user = await fetchUserInfo();
      if (user) {
        setUser(user);
        
        if (user.role === "root_user") {
          setMessage(t("You are the `root_user`."));
        }
      }
      setLoading(false);
    }

    if (getSetting("user")) {
      loadUserInfo();
    } else {
      setLoading(false);
    }

    const loadSubscriptions = async () => {
      // Fetch subscription list
      const response = await fetch("/api/subscription/list", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const subcriptions = await response.json();
      setSubscriptions(subcriptions);
    }

    loadSubscriptions();
  }, []);

  function handleSetTargetRole(role) {
    return () => {
      setTargetRole(role);
      console.log("Target role set to:", role);

      // Get price by role
      const newAmount = getPrice(subscriptions, role);

      // Banking fee
      const paypalFee = newAmount > 0 ? npre(0.044 * newAmount + 0.3, 2) : 0;
      const totalAmount = npre(newAmount + paypalFee);

      // Set amount
      setAmount(totalAmount);
      setBankingFee(paypalFee);
    };
  }

  const content = (
    <>
      {!user && <div>{ t("User information not found. Please login with command `:login [username] [password]`.") }</div>}
      {user && <div>
        <div>- { t("Subscription Status") }</div>
        <div className="mt-1">{ t("User") }: {user.username}</div>
        <div>{ t("Email") }: {user.email}</div>
        <div>{ t("Subscription") }: `{user.role}`</div>
        <div>{ t("Expire at") }: {user.role_expires_at ? moment.unix(user.role_expires_at / 1000).format('MM/DD/YYYY') : `(${ t("Unlimited") })`} {(user.role_expires_at && user.role_expires_at < new Date()) && `(${ t("Expired") })`}</div>
      </div>}
      <div className="mt-3">
        <div>- { t("Subscription plans") }</div>
        <div className="mt-1">
          1. { t("`user`: provides a general user. It's free. (You'll still need to pay the token fee you used.)") }<br></br>
          2. { t("`plus_user`: provides advanced features and support for professional uses.") }<br></br>
        </div>
      </div>
      {subscriptions && <SubscriptionComparisonTable subscriptions={subscriptions} />}
      {user && <div className="mt-4">
        {message && <div>- {message}</div>}
        {!message && <div>
          {user.role !== "root_user" && <div>
            <div>- { t("Extend, Upgrade or Downgrade") }</div>
            <div className="flex flex-wrap items-center mt-2">
              <div>{ t("Select plan") }:</div>
              <button className="ml-2" onClick={handleSetTargetRole("user")}>`user`</button>
              <button className="ml-2" onClick={handleSetTargetRole("plus_user")}>`plus_user`</button>
              {targetRole && <button className="ml-2 w-20" onClick={handleSetTargetRole(null)}>{ t("Cancel") }</button>}
            </div>
          </div>}
          {targetRole && <div className="mt-3">
            {((user.role_expires_at !== null && getRoleLevel(user.role) > getRoleLevel(targetRole) && user.role_expires_at > new Date()) 
           || (user.role_expires_at === null && getRoleLevel(user.role) > getRoleLevel(targetRole)))
            && <div>
              - { t("You are a `{{role}}`, you can downgrade to `{{targetRole}}` after your current subscription expires.", { role: user.role, targetRole: targetRole }) }
              </div>}
            {<div className="mt-1">
              {user.role_expires_at === null && getRoleLevel(user.role) >= getRoleLevel(targetRole) && <div>
                  - { tt("You already have an unlimited expiration date for `{{role}}`.", { role: user.role }) }
                </div>}
              {((getRoleLevel(targetRole) > getRoleLevel(user.role))
               || (targetRole === user.role && user.role_expires_at !== null)
               || (getRoleLevel(targetRole) < getRoleLevel(user.role) && (user.role_expires_at !== null && user.role_expires_at < new Date())))
                && <div>
                <div>{user.role == targetRole ? t("Extend 1 month for") : (getRoleLevel(user.role) < getRoleLevel(targetRole) ? t("Upgrade to") : t("Downgrade to"))} `{targetRole}`</div>
                <div>{ t("Pay") }: {"$" + amount} ({ tt("banking fee ${{bankingFee}} included", {bankingFee}) })</div>
                <div className="mt-3">{ t("Payment methods") }:</div>
                <div className="mt-1">
                  <table>
                    <thead>
                      <tr>
                        <th>{ t("Paypal or Credit Card") }</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-1">
                        <PayPalButton amount={amount} onSuccess={onSuccess} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="mt-2">* { t("Your payment will be securely handled through the banking system; we do not store or collect your payment details.") }</div>
                </div>
              </div>}
            </div>}
          </div>}
        </div>}
      </div>}
    </>
  )

  if (!ready || !tReady) return (<div><br></br></div>);
  return (
    <div className="Subcription">
      <div className="text-center mb-4">
        <div>{ t("Subscriptions") }</div>
      </div>
      {loading ? <div>{t("Loading...")}</div> : <div>{content}</div>}
    </div>
  );
}

export default Subscription;
