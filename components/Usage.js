import React, { useEffect, useState } from "react";
import ProgressBar from "./ProgressBar";
import { feeCal } from "../utils/usageUtils";
import { getRoleLevel } from "utils/userUtils";
const moment = require('moment');

function Usage() {
  const [user, setUser] = useState(null);
  const [usage, setUsage] = useState(null);
  const [useFequency, setUseFequency] = useState(null);
  const [fee, setFee] = useState(null);

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
      setFee(feeCal(user.usage));
      setUseFequency(user.use_fequency);
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
          {useFequency && <div className="mt-3">
            <div>- Use Frequency</div>
            <table className="table-fixed mt-1">
              <tbody>
                <tr>
                  <td className="mr-3">Daily: {useFequency.daily}</td>
                  <td className="mr-3">Weekly: {useFequency.weekly}</td>
                  <td className="mr-3">Monthly: {useFequency.monthly}</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-3">
              {useFequency.daily_limit && <ProgressBar label={"Daily usage"} progress={useFequency.daily} progressMax={useFequency.daily_limit} />}
              {useFequency.weekly_limit && <ProgressBar label={"Weekly usage"} progress={useFequency.weekly} progressMax={useFequency.weekly_limit} />}
              {useFequency.monthly_limit && <ProgressBar label={"Monthly usage"} progress={useFequency.monthly} progressMax={useFequency.monthly_limit} />}
              {useFequency.exceeded === true && <div className="mt-2">The usage limitation has been reached.</div>}
            </div>
          </div>}
          {getRoleLevel(user.role) >= 1 && <div className="mt-3">
            <div>- Token usage</div>
            <table className="table-fixed mt-1">
              <tbody>
                <tr>
                  <td>GPT-4 Turbo</td>
                  <td>Input: 0</td>
                  <td>Output: 0</td>
                </tr>
                <tr>
                  <td>GPT-4 Vision</td>
                  <td>Input: 0</td>
                  <td>Output: 0</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-2">
              <div>Fees: ${fee.gpt4Fee + fee.gpt4vFee}</div>
            </div>
          </div>}
          {getRoleLevel(user.role) >= 2 && <div className="mt-3">
            <div>- Database usage</div>
            <table className="table-fixed mt-1">
              <tbody>
                <tr>
                  <td className="mr-3 mt-1">Size: 0MB</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-2">
              <div>Fees: ${fee.dbFee}</div>
            </div>
          </div>}
          {getRoleLevel(user.role) >= 3 && <div className="mt-3">
            <div>- Service usage</div>
            <table className="table-fixed mt-1">
              <tbody>
                <tr>
                  <td className="mr-3 mt-1">Midjourney: 0</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-2">
              <div>Fees: ${fee.dbFee}</div>
            </div>
          </div>}
          <div className="mt-3">
            <div>-</div>
            <div>Total: ${fee.totalFee}</div>
            <div>Balance: ${user.balance}</div>
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
