import React, { useEffect, useState } from "react";
import PayPalButton from "./PayPalButton";
import { refreshUserInfo } from "utils/userUtils";
import FeatureComparisonTable from "./SubscriptionComparisonTable";

function Subscription() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState(null);
  const [targetRole, setTargetRole] = useState(null);

  useEffect(() => {
    // Verify user login status
    refreshUserInfo();
    setUser(localStorage.getItem("user"));
    if (localStorage.getItem("userRole") === "super_user") {
      setMessage("You are already a super_user.");
    }

    if (localStorage.getItem("userRole") === "user") {
      setTargetRole("pro_user");
    }
    if (localStorage.getItem("userRole") === "pro_user") {
      setTargetRole("super_user");
    }
  });

  const content = (
    <>
      {user && <div>
        <div>User: {localStorage.getItem("user")}</div>
        <div>Email: {localStorage.getItem("userEmail")}</div>
        <div>Subscription: `{localStorage.getItem("userRole")}`</div>
        <FeatureComparisonTable />
        {message && <div>{message}</div>}
        {!message && <div>
          <div>Payment methods:</div>
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
      {!user && <div>Please login.</div>}
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
