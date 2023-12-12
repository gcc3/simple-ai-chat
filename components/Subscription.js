import React, { useEffect, useState, useCallback } from "react";
import PayPalButton from "./PayPalButton";
import { refreshUserInfo } from "utils/userUtils";
import SubscriptionComparisonTable from "./SubscriptionComparisonTable";
const moment = require('moment');

// Get amount
function getPrice(subscriptions, role) {
  if (subscriptions.hasOwnProperty(role)) {
    if (subscriptions[role].price == 0) {
      return "Free";
    }
    return subscriptions[role].price;
  }
}

function getDiscount(promotionCode) {
  return 0;
}

function getRoleLevel(role) {
  if (role === "user") return 1;
  if (role === "pro_user") return 2;
  if (role === "super_user") return 3;
  if (role === "root_user") return 4;
}

function Subscription() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState(null);
  const [targetRole, setTargetRole] = useState(null);
  const [amount, setAmount] = useState(null);
  const [subscriptions, setSubscriptions] = useState(null);
  const [promotionCode, setPromotionCode] = useState('');

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
      throw data.message || new Error(`Request failed with status ${response.status}`);
    }

    if (data.success) {
      setMessage(data.message);

      // Refresh user info
      const user = await refreshUserInfo();
      setUser(user);
    } else {
      setMessage(data.message);
      if (data.error) console.log(data.error);
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

    if (localStorage.getItem("user")) {
      loadUserInfo();
    }
  }, []);

  function handleSetTargetRole(role) {
    return () => {
      setTargetRole(role);
      console.log("Target role set to:", role);

      // Set amount
      setAmount(getPrice(subscriptions, role));
    };
  }

  function handleApplyPromotionCode(e) {
    const discount = getDiscount(promotionCode);
    setAmount(Math.max(amount - discount, 0));
  }

  const content = (
    <>
      {!user && <div>Please login. To register a user, use the command `:user add [username] [email] [password?]`</div>}
      {user && <div>
        <div>User: {user.username}</div>
        <div>Email: {user.email}</div>
        <div>Subscription: `{user.role}`</div>
        <div>Expire at: {user.role_expires_at ? moment.unix(user.role_expires_at / 1000).format('MM/DD/YYYY') : "unlimit"}</div>
      </div>}
      {subscriptions && <SubscriptionComparisonTable subscriptions={subscriptions} />}
      {user && <div className="mt-4">
        {message && <div>- {message}</div>}
        {!message && <div>
          {user.role !== "root_user" && <div>Select upgrade subscription:
            <button className="ml-2" onClick={handleSetTargetRole("user")}>`user`</button>
            <button className="ml-2" onClick={handleSetTargetRole("pro_user")}>`pro_user`</button>
            <button className="ml-2" onClick={handleSetTargetRole("super_user")}>`super_user`</button>
          </div>}
          {targetRole && <div className="mt-3">
            {getRoleLevel(user.role) > getRoleLevel(targetRole) && <div>
              - You are a `{user.role}`, you can downgrade to `{targetRole}` after your current subscription expires.
              </div>}
            {amount > 0 && <div className="mt-1">
              {process.env.USE_PROMO_CODE === "true" && <div className="mt-3 flex items-center">Promotion code:
                <input
                  className="ml-1 pl-2 pr-2 h-8 border"
                  id="promotion-code"
                  type="text"
                  value={promotionCode}
                  onChange={(e) => setPromotionCode(e.target.value)}
                />
                <button onClick={handleApplyPromotionCode} className="ml-2">Apply</button>
              </div>}
              {!user.role_expires_at && getRoleLevel(user.role) >= getRoleLevel(targetRole) && <div>
                  - You already have an unlimited expiration date for `{user.role}`.
                </div>}
              {user.role_expires_at && getRoleLevel(user.role) <= getRoleLevel(targetRole) && <div>
                <div>{user.role == targetRole ? "Extend 1 month for" : "Upgrade to"} role: `{targetRole}`</div>
                <div>Price: {amount === 0 ? "Free" : "$" + amount + "/month"}</div>
                <div className="mt-3">Payment methods:</div>
                <div className="mt-1">
                  <table>
                    <thead>
                      <tr>
                        <th>Paypal or Credit Card</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-1">
                        <PayPalButton targetRole={targetRole} amount={amount} onSuccess={onSuccess} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
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
        <div>Subscribe to become a pro/super user.</div>
      </div>
      <div>{content}</div>
    </div>
  );
}

export default Subscription;
