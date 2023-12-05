import React, { useEffect, useState } from "react";
import PayPalButton from "./PayPalButton";
import { refreshUserInfo } from "utils/userUtils";
import FeatureComparisonTable from "./SubscriptionComparisonTable";

function Subscription() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    // Verify user login status
    refreshUserInfo();
    setUser(localStorage.getItem("user"));
    if (localStorage.getItem("userRole") === "super_user") {
      setMessage("You are already a super_user.");
    }
  });

  const content = (
    <>
      {user && <div>
        {message && <div>{message}</div>}
        {!message && <div>
          <div>User: {localStorage.getItem("user")}</div>
          <div>Email: {localStorage.getItem("userEmail")}</div>
          <div>Role: {localStorage.getItem("userRole")}</div>
          <FeatureComparisonTable />
          <PayPalButton onSuccess={async (details) => {
            console.log("Transaction completed by Mr." + details.payer.name.given_name + ".");
            console.log("Detail: ", details);

            // Update user role
            const response = await fetch("/api/user/update/role", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                role: "super_user",
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
        </div>}
      </div>}
      {!user && <div>Please login to subscribe.</div>}
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
