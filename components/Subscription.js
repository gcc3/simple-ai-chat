import React, { useEffect, useState } from "react";
import PayPalButton from "./PayPalButton";
import { refreshUserInfo } from "utils/userUtils";
import SubscriptionComparisonTable from "./SubscriptionComparisonTable";

// Get amount
function getPrice(subscriptions, role) {
  if (subscriptions.hasOwnProperty(role)) {
    if (subscriptions[role].price == 0) {
      return "Free";
    }
    return subscriptions[role].price;
  }
}

function Subscription() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState(null);
  const [targetRole, setTargetRole] = useState(null);
  const [amount, setAmount] = useState(null);
  const [subscriptions, setSubscriptions] = useState(null);

  useEffect(() => {
    const loadUserInfo = async () => {
      const user = await refreshUserInfo();
      if (user) {
        setUser(user);
        
        if (user.role === "root_user") {
          setMessage("You are the root_user.");
        }

        if (user.role === "super_user") {
          setMessage("You are already a super_user, for further upgrade please contact `support@simple-ai.io`.");
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
    loadUserInfo();
  }, []);

  function handleSetTargetRole(role) {
    return () => {
      setTargetRole(role);
      console.log("Target role set to:", role);

      // Set amount
      setAmount(getPrice(subscriptions, role));
    };
  }

  const content = (
    <>
      {!user && <div>Please login. To register a user, use the command `:user add [username] [email?]`</div>}
      {user && <div>
        <div>User: {user.username}</div>
        <div>Email: {user.email}</div>
        <div>Subscription: `{user.role}`</div>
      </div>}
      {subscriptions && <SubscriptionComparisonTable subscriptions={subscriptions} />}
      {user && <div className="mt-3">
        {message && <div>{message}</div>}
        {!message && <div>
          <div>Select upgrade subscription:
            <button className="m-1" onClick={handleSetTargetRole("user")}>`user`</button>
            <button className="m-1" onClick={handleSetTargetRole("pro_user")}>`pro_user`</button>
            <button className="m-1" onClick={handleSetTargetRole("super_user")}>`super_user`</button>
          </div>
          {targetRole && <div>
            <div className="mt-1">Target role: `{targetRole}`</div>
            <div>Price: {amount === 0 ? "Free" : "$" + amount}</div>
            {targetRole === user.role && <div className="mt-3">
              You are already a `{targetRole}`.
              </div>}
            {amount > 0 && targetRole !== user.role && <div className="mt-1">
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
                      <PayPalButton targetRole={targetRole} onSuccess={async (details) => {
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
                      }} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
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
