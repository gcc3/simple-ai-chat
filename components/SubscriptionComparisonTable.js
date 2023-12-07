import React from "react";

// Get amount
function getPrice(subscriptions, role) {
  if (subscriptions.hasOwnProperty(role)) {
    if (subscriptions[role].price == 0) {
      return "Free";
    }
    return subscriptions[role].price;
  }
}

const SubscriptionComparisonTable = ({ subscriptions }) => {
  const comparison = [
    { name: "GPT-4", user: "24/day", pro_user: "2400/month", super_user: "7200/month" },
    { name: "GPT-4V", user: "Yes", pro_user: "Yes", super_user: "Yes" },
    { name: "De-hallucination", user: "24/day", pro_user: "Yes", super_user: "Yes" },
    { name: "Custom Roleplay", user: "╳", pro_user: "Yes", super_user: "Yes" },
    { name: "Personal Database", user: "╳", pro_user: "╳", super_user: "Yes" },
    { name: "Pricing", user: getPrice(subscriptions, "user") , pro_user: "$" + getPrice(subscriptions, "pro_user") + "/month", super_user: "$" + getPrice(subscriptions, "super_user") + "/month" },
  ];

  return (
    <div className="mt-3 mb-5">
      <div className="mb-1">
        <div>Feature comparison</div>
      </div>
      <table className="table-fixed">
        <thead>
          <tr>
            <th rowSpan="2">Features/Price</th>
            <th colSpan="3">Subcriptions</th>
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
  );
};

export default SubscriptionComparisonTable;
