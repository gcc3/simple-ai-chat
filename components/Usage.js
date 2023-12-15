import React, { useEffect, useState } from "react";
import ProgressBar from "./ProgressBar";
import { feeCal } from "../utils/usageUtils";
const moment = require('moment');

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
      setUsage(user.usage);
    }

    if (localStorage.getItem("user") && !user) {
      getUserInfo();
    }
  });

  const content = (
    <>
      {!user && <div>Please login. To register a user, use the command `:user add [username] [email] [password?]`</div>}
      {user && <div>
        <div>
          <div className="mb-1">- Subcription</div>
          <div>User: {localStorage.getItem("user")}</div>
          <div>Email: {localStorage.getItem("userEmail")}</div>
          <div>Subscription: `{localStorage.getItem("userRole")}`</div>
          <div>Expire at: {user.role_expires_at ? moment.unix(user.role_expires_at / 1000).format('MM/DD/YYYY') : "(unlimit)"} {(user.role_expires_at !== null && user.role_expires_at < new Date()) && "(Expired)"}</div>
          <div className="mt-3">
            <div>- Frequency usage</div>
            <div className="flex mt-1">
              <table>
                <tr>
                  {<td className="mr-3">Daily: {usage.daily}</td>}
                  {<td className="mr-3">Weekly: {usage.weekly}</td>}
                  {<td className="mr-3">Monthly: {usage.monthly}</td>}
                </tr>
              </table>
            </div>
            <div className="mt-3">
              {usage.daily_limit && <ProgressBar label={"Daily usage"} progress={usage.daily} progressMax={usage.daily_limit} />}
              {usage.weekly_limit && <ProgressBar label={"Weekly usage"} progress={usage.weekly} progressMax={usage.weekly_limit} />}
              {usage.monthly_limit && <ProgressBar label={"Monthly usage"} progress={usage.monthly} progressMax={usage.monthly_limit} />}
              {usage.exceeded === true && <div className="mt-2">The usage limitation has been reached.</div>}
            </div>
          </div>
          <div className="mt-3">
            <div>- Token usage</div>
            <div className="flex">
              <table>
                <tr>
                  <td className="mr-3 mt-1">Input: 0</td>
                  <td className="mr-3">Output: 0</td>
                </tr>
              </table>
            </div>
          </div>
          <div className="mt-3">
            <div>- Database usage</div>
            <div className="flex">
              <table>
                <tr>
                  <td className="mr-3 mt-1">Size: 0MB</td>
                </tr>
              </table>
            </div>
          </div>
          <div className="mt-3">
            <div>- Service usage</div>
            <div className="flex">
              <table>
                <tr>
                  <td className="mr-3 mt-1">Midjourney: 0</td>
                </tr>
              </table>
            </div>
          </div>
          <div className="mt-3">
            <div>Fees: ${feeCal(JSON.parse(user.usage))}</div>
            <div>Balance: {user.balance}</div>
          </div>
        </div>
      </div>}
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
