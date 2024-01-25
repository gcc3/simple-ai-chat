import React, { useEffect, useState, useCallback } from "react";
import ProgressBar from "./ProgressBar";
import { getRoleLevel } from "utils/userUtils";
import PayPalButton from "./PayPalButton";
import { refreshUserInfo } from "utils/userUtils";
import { npre } from "utils/numberUtils";
import { plusFeeCal } from "utils/usageUtils";
import { useTranslation } from "react-i18next";

const moment = require('moment');

function Usage() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState(null);
  
  const [tokenFequencies, setTokenFequencies] = useState(0);
  const [tokenMonthly, setTokenMonthly] = useState(0);
  const [useCountFequencies, setUseCountFequencies] = useState(0);
  const [useCountMonthly, setUseCountMonthly] = useState(0);
  const [gpt4FeeLastMonth, setGpt4FeeLastMonth] = useState(0);
  const [gpt4vFeeLastMonth, setGpt4vFeeLastMonth] = useState(0);
  const [totalFeeLastMonth, setTotalFeeLastMonth] = useState(0);
  const [gpt4FeeThisMonth, setGpt4FeeThisMonth] = useState(0);
  const [gpt4vFeeThisMonth, setGpt4vFeeThisMonth] = useState(0);
  const [totalFeeThisMonth, setTotalFeeThisMonth] = useState(0);
  const [plusFeeThisMonth, setPlusFeeThisMonth] = useState(0);  // x% of total fee
  const [amount, setAmount] = useState(0);
  const [bankingFee, setBankingFee] = useState(0);

  const { t } = useTranslation("usage");

  const onSuccess = useCallback(async (details) => {
    console.log("Transaction completed by Mr." + details.payer.name.given_name + ".");
    console.log("Detail: ", details);

    // Update user role
    const response = await fetch("/api/user/update/balance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
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
  }, [amount]);

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
      setUseCountFequencies(user.usage.use_count_fequencies);
      setUseCountMonthly(user.usage.use_count_monthly);
      setTokenFequencies(user.usage.token_fequencies);
      setTokenMonthly(user.usage.token_monthly);

      if (user.role === "root_user") {
        setMessage("You are the root_user.");
      }

      // Fee calculation
      setGpt4FeeLastMonth(npre(user.usage.gpt4_fee_last_month));
      setGpt4vFeeLastMonth(npre(user.usage.gpt4v_fee_last_month));
      setTotalFeeLastMonth(npre(user.usage.gpt4_fee_last_month + user.usage.gpt4v_fee_last_month));
      setGpt4FeeThisMonth(npre(user.usage.gpt4_fee_this_month));
      setGpt4vFeeThisMonth(npre(user.usage.gpt4v_fee_this_month));
      setTotalFeeThisMonth(npre(user.usage.gpt4_fee_this_month + user.usage.gpt4v_fee_this_month));

      // Plus fee
      setPlusFeeThisMonth(plusFeeCal(user.role, user.usage.gpt4_fee_this_month + user.usage.gpt4v_fee_this_month));
    }

    if (localStorage.getItem("user") && !user) {
      getUserInfo();
    }
  });

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
      {!user && <div>{ t("User infromation not found. Please login with command `:login [username] [password]`.") }</div>}
      {user && <div>
        <div>
          <div className="mb-1">- { t("Subcription Status") }</div>
          <div>{ t("User") }: {localStorage.getItem("user") }</div>
          <div>{ t("Email") }: {localStorage.getItem("userEmail") }</div>
          <div>{ t("Subscription") }: `{localStorage.getItem("userRole") }`</div>
          <div>{ t("Expire at") }: {user.role_expires_at ? moment.unix(user.role_expires_at / 1000).format('MM/DD/YYYY') : "(unlimit)"} {(user.role_expires_at && user.role_expires_at < new Date()) && "(Expired)"}</div>
          {user.usage && getRoleLevel(user.role) >= 1 && <div className="mt-3">
            <div>- { t("Monthly Usage") }</div>
            <div className="mt-1">{ t("Use Count") }</div>
            <table className="table-fixed mt-1">
              <tbody>
                <tr>
                  <td className="mr-3">{ t("Use Count") }</td>
                  <td className="mr-3">{ t("This Month") }: {useCountMonthly.this_month}</td>
                  <td className="mr-3">{ t("Last Month") }: {useCountMonthly.last_month}</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-3">{ t("GPT-4 Turbo Token") }</div>
            <table className="table-fixed mt-1">
              <tbody>
                <tr>
                  <td className="mr-3">{ t("Input") }</td>
                  <td className="mr-3">{ t("This Month") }: {tokenMonthly.token.this_month.input}</td>
                  <td className="mr-3">{ t("Last Month") }: {tokenMonthly.token.last_month.input}</td>
                </tr>
                <tr>
                  <td className="mr-3">{ t("Output") }</td>
                  <td className="mr-3">{ t("This Month") }: {tokenMonthly.token.this_month.output}</td>
                  <td className="mr-3">{ t("Last Month") }: {tokenMonthly.token.last_month.output}</td>
                </tr>
                <tr>
                  <td className="mr-3">{ t("Usage Fees") }:</td>
                  <td className="mr-3"> ${gpt4FeeThisMonth}</td>
                  <td className="mr-3"> ${gpt4FeeLastMonth}</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-3">{ t("GPT-4 Vision Token") }</div>
            <table className="table-fixed mt-1">
              <tbody>
                <tr>
                  <td className="mr-3">{ t("Input") }</td>
                  <td className="mr-3">{ t("This Month") }: {tokenMonthly.token_v.this_month.input}</td>
                  <td className="mr-3">{ t("Last Month") }: {tokenMonthly.token_v.last_month.input}</td>
                </tr>
                <tr>
                  <td className="mr-3">{ t("Output") }</td>
                  <td className="mr-3">{ t("This Month") }: {tokenMonthly.token_v.this_month.output}</td>
                  <td className="mr-3">{ t("Last Month") }: {tokenMonthly.token_v.last_month.output}</td>
                </tr>
                <tr>
                  <td className="mr-3">{ t("Usage Fees") }:</td>
                  <td className="mr-3"> ${gpt4vFeeThisMonth}</td>
                  <td className="mr-3"> ${gpt4vFeeLastMonth}</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-2">* { t("For token pricing, refer to the OpenAI official pricing document.") } (<a href="https://openai.com/pricing#language-models"><u>link</u></a>) </div>
            <div>* { t("1% ~ 3% for maintaince service.") }</div>
            <div className="mt-3">- { t("Fequencies") }</div>
            <table className="table-fixed mt-1">
              <tbody>
                <tr>
                  <td className="mr-3">{ t("Use Count") }</td>
                  <td className="mr-3">{ t("Daily") }: {useCountFequencies.daily}</td>
                  <td className="mr-3">{ t("Weekly") }: {useCountFequencies.weekly}</td>
                  <td className="mr-3">{ t("Monthly") }: {useCountFequencies.monthly}</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-3">{ t("GPT-4 Turbo Token") }</div>
            <table className="table-fixed mt-1">
              <tbody>
                <tr>
                  <td className="mr-3">{ t("Input") }</td>
                  <td className="mr-3">{ t("Daily") }: {tokenFequencies.token.daily.input}</td>
                  <td className="mr-3">{ t("Weekly") }: {tokenFequencies.token.weekly.input}</td>
                  <td className="mr-3">{ t("Monthly") }: {tokenFequencies.token.monthly.input}</td>
                </tr>
                <tr>
                  <td className="mr-3">{ t("Output") }</td>
                  <td className="mr-3">{ t("Daily") }: {tokenFequencies.token.daily.output}</td>
                  <td className="mr-3">{ t("Weekly") }: {tokenFequencies.token.weekly.output}</td>
                  <td className="mr-3">{ t("Monthly") }: {tokenFequencies.token.monthly.output}</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-3">{ t("GPT-4 Vision Token") }</div>
            <table className="table-fixed mt-1">
              <tbody>
                <tr>
                  <td className="mr-3">{ t("Input") }</td>
                  <td className="mr-3">{ t("Daily") }: {tokenFequencies.token_v.daily.input}</td>
                  <td className="mr-3">{ t("Weekly") }: {tokenFequencies.token_v.weekly.input}</td>
                  <td className="mr-3">{ t("Monthly") }: {tokenFequencies.token_v.monthly.input}</td>
                </tr>
                <tr>
                  <td className="mr-3">{ t("Output") }</td>
                  <td className="mr-3">{ t("Daily") }: {tokenFequencies.token_v.daily.output}</td>
                  <td className="mr-3">{ t("Weekly") }: {tokenFequencies.token_v.weekly.output}</td>
                  <td className="mr-3">{ t("Monthly") }: {tokenFequencies.token_v.monthly.output}</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-3">
              {useCountFequencies.daily_limit && <ProgressBar label={ t("Daily usage") } progress={useCountFequencies.daily} progressMax={useCountFequencies.daily_limit} />}
              {useCountFequencies.weekly_limit && <ProgressBar label={ t("Weekly usage") } progress={useCountFequencies.weekly} progressMax={useCountFequencies.weekly_limit} />}
              {useCountFequencies.monthly_limit && <ProgressBar label={ t("Monthly usage") } progress={useCountFequencies.monthly} progressMax={useCountFequencies.monthly_limit} />}
              {useCountFequencies.exceeded === true && <div className="mt-2">The usage limitation has been reached.</div>}
            </div>
          </div>}
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
            <ProgressBar label={ t("Usage") } progress={npre(totalFeeThisMonth + plusFeeThisMonth)} progressMax={npre(user.balance)} />
            <div className="mt-3">{ t("Total Fees") }: ${npre(totalFeeThisMonth + plusFeeThisMonth)}</div>
            <div>{ t("Balance") }: ${npre(user.balance)}</div>
          </div>
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
        </div>
      </div>}
    </>
  )

  return (
    <div className="Subcription">
      <div className="text-center mb-4">
        <div>{ t("Usage") }</div>
      </div>
      <div>{content}</div>
    </div>
  );
}

export default Usage;
