import React, { useEffect, useState } from "react";
import PayPalButton from "./PayPalButton";
import { refreshUserInfo } from "utils/userUtils";

function Subscription() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Verify user login status
    refreshUserInfo();
    setUser(localStorage.getItem("user"));
  });

  const content = (
    <>
      {user && <div>
        <div>User: {localStorage.getItem("user")}</div>
        <div>Email: {localStorage.getItem("userEmail")}</div>
        <PayPalButton onSuccess={(details) => {
          console.log("Transaction completed by Mr." + details.payer.name.given_name + ".");
          console.log("Detail: ", details);

          // TODO: Save user subscription
        }} />
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
