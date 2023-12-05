import React, { useEffect, useState } from "react";
import ProgressBar from "./ProgressBar";

function Usage() {
  const [user, setUser] = useState(null);
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    // Get user info
    const getUserInfo = async () => {
      const response = await fetch(`/api/user/info`, {
        method: "GET",
        credentials: 'include',
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      const user = data.user;
      setUser(user);
      setUsage(JSON.parse(user.usage));
      console.log(user.usage)
    }
    if (!user) getUserInfo();
  });

  const content = (
    <>
      {user && <div>
        <div>
          <div>User: {localStorage.getItem("user")}</div>
          <div>Email: {localStorage.getItem("userEmail")}</div>
          <div>Role: {localStorage.getItem("userRole")}</div>
          <div>Usage exceeded: {usage.exceeded ? "true" : "false"}</div>
          <ProgressBar label={"Daily usage"} progress={usage.daily} />
          <ProgressBar label={"Weekly usage"} progress={usage.weekly} />
          <ProgressBar label={"Monthly usage"} progress={usage.monthly} />
        </div>
      </div>}
      {!user && <div>Please login.</div>}
    </>
  )

  return (
    <div className="Subcription">
      <div className="text-center mb-4">
        <div>Usage</div>
      </div>
      <div>{content}</div>
    </div>
  );
}

export default Usage;
