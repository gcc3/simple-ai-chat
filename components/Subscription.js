import React, { useEffect, useState, useCallback } from "react";
import PayPalButton from "./PayPalButton";
import { refreshUserInfo, getRoleLevel } from "utils/userUtils";
import SubscriptionComparisonTable from "./SubscriptionComparisonTable";
import { npre } from "utils/numberUtils";
import { useTranslation } from "react-i18next";

const moment = require('moment');

// Get amount
function getPrice(subscriptions, role) {
  if (subscriptions.hasOwnProperty(role)) {
    return Number(subscriptions[role].price);
  }
}

function Subscription() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState(null);
  const [targetRole, setTargetRole] = useState(null);
  const [amount, setAmount] = useState(null);
  const [bankingFee, setBankingFee] = useState(0);
  const [subscriptions, setSubscriptions] = useState(null);

  const { t } = useTranslation("subscriptions");

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
      const user = await refreshUserInfo();
      setUser(user);
    } else {
      console.log(data.error);
      setMessage(data.error);
    }
  }, [targetRole, amount]);

  useEffect(() => {
    const loadUserInfo = async () => {
      const user = await refreshUserInfo();
      if (user) {
        setUser(user);
        
        if (user.role === "root_user") {
          setMessage("You are the root_user.");
        }
      }
    }

    if (localStorage.getItem("user")) {
      loadUserInfo();
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

      // Set amount
      setAmount(newAmount + paypalFee);
      setBankingFee(paypalFee);
    };
  }

  const content = (
    <>
      {!user && <div>{ t("User infromation not found. Please login with command `:login [username] [password]`.") }</div>}
      {user && <div>
        <div>- { t("Subcription Status") }</div>
        <div className="mt-1">{ t("User") }: {user.username}</div>
        <div>{ t("Email") }: {user.email}</div>
        <div>{ t("Subscription") }: `{user.role}`</div>
        <div>{ t("Expire at") }: {user.role_expires_at ? moment.unix(user.role_expires_at / 1000).format('MM/DD/YYYY') : "(unlimit)"} {(user.role_expires_at && user.role_expires_at < new Date()) && "(Expired)"}</div>
      </div>}
      <div className="mt-3">
        <div>- { t("Subscription plans") }</div>
        <div className="mt-1">
          1. { t("`user`: provide a general user. It's free. (You'll still need to pay the token fee you used.)") }<br></br>
          2. { t("`pro_user`: provide advanced features and support for professonal uses.") }<br></br>
          3. { t("`super_user`: provide accessibility for all latest features and support.") }<br></br>
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
              <button className="ml-2" onClick={handleSetTargetRole("user") }>`user`</button>
              <button className="ml-2" onClick={handleSetTargetRole("pro_user") }>`pro_user`</button>
              <button className="ml-2" onClick={handleSetTargetRole("super_user") }>`super_user`</button>
              {targetRole && <button className="ml-2 w-20" onClick={handleSetTargetRole(null)}>{ t("Cancel") }</button>}
            </div>
          </div>}
          {targetRole && <div className="mt-3">
            {((user.role_expires_at !== null && getRoleLevel(user.role) > getRoleLevel(targetRole) && user.role_expires_at > new Date()) 
           || (user.role_expires_at === null && getRoleLevel(user.role) > getRoleLevel(targetRole)))
            && <div>
              - { t("You are a `{user.role}`, you can downgrade to `{targetRole}` after your current subscription expires.", { role: user.role, targetRole: targetRole }) }
              </div>}
            {<div className="mt-1">
              {user.role_expires_at === null && getRoleLevel(user.role) >= getRoleLevel(targetRole) && <div>
                  - { t("You already have an unlimited expiration date for `{user.role}`.", { role: user.role }) }
                </div>}
              {((getRoleLevel(targetRole) > getRoleLevel(user.role))
               || (targetRole === user.role && user.role_expires_at !== null)
               || (getRoleLevel(targetRole) < getRoleLevel(user.role) && (user.role_expires_at !== null && user.role_expires_at < new Date())))
                && <div>
                <div>{user.role == targetRole ? "Extend 1 month for" : (getRoleLevel(user.role) < getRoleLevel(targetRole) ? t("Upgrade to") : t("Downgrade to"))} `{targetRole}`</div>
                <div>{ t("Pay") }: {"$" + amount} (banking fee ${bankingFee} included)</div>
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

  return (
    <div className="Subcription">
      <div className="text-center mb-4">
        <div>{ t("Subcriptions") }</div>
      </div>
      <div>{content}</div>
    </div>
  );
}

export default Subscription;
