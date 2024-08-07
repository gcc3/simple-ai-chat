import React, { useEffect, useState, useCallback } from "react";
import ProgressBar from "./ProgressBar";
import { getRoleLevel, getUserInfo, getUserUsage } from "utils/userUtils";
import PayPalButton from "./PayPalButton";
import { npre } from "utils/numberUtils";
import { plusFeeCal } from "utils/usageUtils";
import { useTranslation } from "react-i18next";

const moment = require('moment');

function Usage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [usage, setUsage] = useState(null);
  const [message, setMessage] = useState(null);

  // For adding balance
  const [amount, setAmount] = useState(0);
  const [bankingFee, setBankingFee] = useState(0);

  const { t, ready } = useTranslation("usage");

  const onSuccess = useCallback(async (details) => {
    console.log("Transaction completed by Mr." + details.payer.name.given_name + ".");

    // Update user role
    const response = await fetch("/api/user/update/balance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amount,
        details: JSON.stringify(details),
      }),
    });
  
    const data = await response.json();
    if (response.status !== 200) {
      console.log(data.error);
      throw data.error || new Error(`Request failed with status ${response.status}`);
    }
  
    if (data.success) {
      setMessage(data.message);
  
      // Refresh user and usage
      const [user, usage] = await Promise.all([getUserInfo(), getUserUsage()]);
      setUser(user);
      setUsage(usage);
    } else {
      console.log(data.error);
      setMessage(data.error);
    }
  }, [amount]);

  useEffect(() => {
    // Get user info
    const updateUserInfoAndUsage = async () => {
      setLoading(true);

      // Refresh user and usage
      const [user, usage] = await Promise.all([getUserInfo(), getUserUsage()]);
      setUser(user);
      setUsage(usage);

      if (user.role === "root_user") {
        setMessage(t("You are the `root_user`."));
      }

      setLoading(false);
    }

    if (localStorage.getItem("user") && !usage) {
      updateUserInfoAndUsage();
    } else {
      setLoading(false);
    }
  }, []);

  function handleSetAmount(newAmount) {
    return () => {
      // Banking fee
      const paypalFee = newAmount > 0 ? npre(0.044 * newAmount + 0.3, 2) : 0;

      setAmount(newAmount + paypalFee);
      setBankingFee(paypalFee);
      console.log("Targe amount is set to:", newAmount);
    };
  }

  const content = (
    <>
      {!user && <div>{ t("User information not found. Please login with command `:login [username] [password]`.") }</div>}
      {user && <div>
        <div>
          <div className="mb-1">- { t("Subcription Status") }</div>
          <div>{ t("User") }: {user.username}</div>
          <div>{ t("Email") }: {user.email}</div>
          <div>{ t("Subscription") }: `{user.role}`</div>
          <div>{ t("Expire at") }: {user.role_expires_at ? moment.unix(user.role_expires_at / 1000).format('MM/DD/YYYY') : `(${ t("Unlimited") })`} {(user.role_expires_at && user.role_expires_at < new Date()) && "(Expired)"}</div>
          {usage && getRoleLevel(user.role) >= 1 && <div className="mt-3">
            <div>- { t("Monthly Usage") }</div>
            <div className="mt-1">{ t("Use Count") }</div>
            <table className="table-fixed mt-1">
              <tbody>
                <tr>
                  <td className="mr-3">{ t("Use Count") }</td>
                  <td className="mr-3">{ t("This Month") }: {usage.use_count_monthly.this_month}</td>
                  <td className="mr-3">{ t("Last Month") }: {usage.use_count_monthly.last_month}</td>
                </tr>
              </tbody>
            </table>
            {usage.model_usage.map((modelUsage, index) => (
              <React.Fragment key={index}>
                <div className="mt-3">{modelUsage.model}</div>
                <table className="table-fixed mt-1">
                  <tbody>
                    <tr>
                      <td className="mr-3">{ t("Input") }</td>
                      <td className="mr-3">{ t("This Month") }: {modelUsage.token.this_month.input}</td>
                      <td className="mr-3">{ t("Last Month") }: {modelUsage.token.last_month.input}</td>
                    </tr>
                    <tr>
                      <td className="mr-3">{ t("Output") }</td>
                      <td className="mr-3">{ t("This Month") }: {modelUsage.token.this_month.output}</td>
                      <td className="mr-3">{ t("Last Month") }: {modelUsage.token.last_month.output}</td>
                    </tr>
                    <tr>
                      <td className="mr-3">{ t("Usage Fees") }:</td>
                      <td className="mr-3"> ${modelUsage.fee.this_month}</td>
                      <td className="mr-3"> ${modelUsage.fee.last_month}</td>
                    </tr>
                  </tbody>
                </table>
              </React.Fragment>
            ))}
            <div className="mt-2">* { t("For token pricing, refer to the OpenAI official pricing document.") } (<a href="https://openai.com/pricing#language-models"><u>link</u></a>) </div>
            <div>* { t("1% ~ 3% for maintaince service.") }</div>
            <div className="mt-3">- { t("Fequencies") }</div>
            <table className="table-fixed mt-1">
              <tbody>
                <tr>
                  <td className="mr-3">{ t("Use Count") }</td>
                  <td className="mr-3">{ t("Daily") }: {usage.use_count_fequencies.daily}</td>
                  <td className="mr-3">{ t("Weekly") }: {usage.use_count_fequencies.weekly}</td>
                  <td className="mr-3">{ t("Monthly") }: {usage.use_count_fequencies.monthly}</td>
                </tr>
              </tbody>
            </table>
            {usage.model_usage.map((modelUsage, index) => (
              <React.Fragment key={index}>
                <div className="mt-3">{modelUsage.model}</div>
                <table className="table-fixed mt-1">
                  <tbody>
                    <tr>
                      <td className="mr-3">{ t("Input") }</td>
                      <td className="mr-3">{ t("Daily") }: {modelUsage.token_fequencies.daily.input}</td>
                      <td className="mr-3">{ t("Weekly") }: {modelUsage.token_fequencies.weekly.input}</td>
                      <td className="mr-3">{ t("Monthly") }: {modelUsage.token_fequencies.monthly.input}</td>
                    </tr>
                    <tr>
                      <td className="mr-3">{ t("Output") }</td>
                      <td className="mr-3">{ t("Daily") }: {modelUsage.token_fequencies.daily.output}</td>
                      <td className="mr-3">{ t("Weekly") }: {modelUsage.token_fequencies.weekly.output}</td>
                      <td className="mr-3">{ t("Monthly") }: {modelUsage.token_fequencies.monthly.output}</td>
                    </tr>
                  </tbody>
                </table>
              </React.Fragment>
            ))}
            <div className="mt-3">
              {usage.use_count_fequencies.daily_limit && <ProgressBar label={ t("Daily usage") } 
                progress={usage.use_count_fequencies.daily} progressMax={usage.use_count_fequencies.daily_limit} />}
              {usage.use_count_fequencies.weekly_limit && <ProgressBar label={ t("Weekly usage") } 
                progress={usage.use_count_fequencies.weekly} progressMax={usage.use_count_fequencies.weekly_limit} />}
              {usage.use_count_fequencies.monthly_limit && <ProgressBar label={ t("Monthly usage") } 
                progress={usage.use_count_fequencies.monthly} progressMax={usage.use_count_fequencies.monthly_limit} />}
              {usage.use_count_fequencies.exceeded === true && <div className="mt-2">The usage limitation has been reached.</div>}
            </div>
            {getRoleLevel(user.role) >= 2 && <div className="mt-3">
              <div>- { t("File Storage Usage") }</div>
              <table className="table-fixed mt-1">
                <tbody>
                  <tr>
                    <td className="mr-3 mt-1">{ t("Size") }: 0MB</td>
                  </tr>
                </tbody>
              </table>
            </div>}
            {getRoleLevel(user.role) >= 3 && <div className="mt-3">
              <div>- { t("Services Usage") }</div>
              <table className="table-fixed mt-1">
                <tbody>
                  <tr>
                    <td className="mr-3 mt-1">Midjourney: 0</td>
                  </tr>
                  <tr>
                    <td className="mr-3 mt-1">WolframAlpha: 0</td>
                  </tr>
                </tbody>
              </table>
            </div>}
            <div className="mt-3">
              <div>- { t("Fees and Balance") }</div>
              <ProgressBar label={ t("Usage") } progress={npre(usage.total_usage_fee_this_month 
                                                        + plusFeeCal(user.role, usage.total_usage_fee_this_month))} 
                                                          progressMax={npre(user.balance)} />
              <div className="mt-3">{ t("Total Fees") }: ${npre(usage.total_usage_fee_this_month 
                                                         + plusFeeCal(user.role, usage.total_usage_fee_this_month))}</div>
              <div>{ t("Balance") }: ${npre(user.balance)}</div>
            </div>
          </div>}
        </div>
        <div className="mt-4">
          {message && <div>{message}</div>}
          {!message && <div>
            {user.role !== "root_user" && <div>
              <div>- { t("Add Balance") }</div>
              <div className="flex flex-wrap items-center mt-1">
                <div>{ t("Select amount") }:</div>
                <button className="ml-2 w-11" onClick={handleSetAmount(1)}>$1</button>
                <button className="ml-2 w-11" onClick={handleSetAmount(5)}>$5</button>
                <button className="ml-2 w-11" onClick={handleSetAmount(10)}>$10</button>
                <button className="ml-2 w-11" onClick={handleSetAmount(20)}>$20</button>
                <button className="ml-2 w-11" onClick={handleSetAmount(50)}>$50</button>
                {amount > 0 && <button className="ml-2 w-20" onClick={handleSetAmount(0)}>{ t("Cancel") }</button>}
              </div>
            </div>}
            {amount !== null && amount > 0 && <div className="mt-3">
              <div>{ t("Pay") }: {"$" + amount} ({ t("banking fee {{bankingFee}} included", { bankingFee }) })</div>
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
        </div>
      </div>}
    </>
  )

  if (!ready) return (<div><br></br></div>);
  return (
    <div className="Subcription">
      <div className="text-center mb-4">
        <div>{ t("Usage") }</div>
      </div>
      {loading ? <div>{t("Loading...")}</div> : <div>{content}</div>}
    </div>
  );
}

export default Usage;
