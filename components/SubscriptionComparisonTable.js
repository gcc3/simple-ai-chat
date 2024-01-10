import React from "react";
import { getRoleFequencyLimit } from "utils/usageUtils";

// Get amount
function getPriceString(subscriptions, role) {
  let price = "";
  if (subscriptions.hasOwnProperty(role)) {
    if (role === "user")
       price = "$" + subscriptions[role].price + "/month +usage fee";
    else if (role === "pro_user")
      price = "$" + subscriptions[role].price + "/month +usage fee";
    else if (role === "super_user")
      price = "$" + subscriptions[role].price + "/month +usage fee";
  }
  return price;
}

function getRoleFequencyLimits(role) {
  const limit = getRoleFequencyLimit(role);
  return limit.daily_limit + "/day";
}

const SubscriptionComparisonTable = ({ subscriptions }) => {
  const comparison = [
    { name: "Text Generation (GPT-4 Turbo)", user: getRoleFequencyLimits(`user`), pro_user: getRoleFequencyLimits(`pro_user`), super_user: getRoleFequencyLimits(`super_user`) },
    { name: "Image Generation (Midjourney)", user: "1/day(trial)", pro_user: "20/day", super_user: "50/day +fast" },
    { name: "Image Input (GPT-4 Vision)", user: "No limit", pro_user: "No limit", super_user: "No limit" },
    { name: "File Input", user: "Yes", pro_user: "Yes", super_user: "Yes" },
    { name: "Roles", user: "Yes", pro_user: "Yes", super_user: "Yes" },
    { name: "Data Stores", user: "Yes", pro_user: "Yes +support", super_user: "Yes +support" },
    { name: "Nodes (Node AI)", user: "Yes", pro_user: "Yes", super_user: "Yes +support" },
    { name: "Enhanced Knowledge & Mathematics (WolframAlpha)", user: "Yes(trial)", pro_user: "Yes", super_user: "Yes" },
    { name: "Pricing", user: getPriceString(subscriptions, "user"), pro_user: getPriceString(subscriptions, "pro_user"), super_user: getPriceString(subscriptions, "super_user")},
  ];

  return (
    <div className="mt-3">
      <div className="mb-1">
        <div>Features Comparison and Pricing</div>
      </div>
      <div className="table-container">
        <table className="table-fixed">
          <thead>
            <tr>
              <th rowSpan="2">Features</th>
              <th colSpan="3">Subcriptions(Roles)</th>
            </tr>
            <tr>
              <th>`user`</th>
              <th>`pro_user`</th>
              <th>`super_user`</th>
            </tr>
          </thead>
          <tbody>
            {comparison.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{item.user}</td>
                <td>{item.pro_user}</td>
                <td>{item.super_user}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2">* For details of the usage fee, please refer to the Usage page.</div>
      <div>* For enterprise use, please contact us at `<a href="mailto:support@simple-ai.io"><u>support@simple-ai.io</u></a>`.</div>
    </div>
  );
};

export default SubscriptionComparisonTable;
