import React from "react";

// Get amount
function getPriceString(subscriptions, role) {
  let price = "";
  if (subscriptions.hasOwnProperty(role)) {
    if (subscriptions[role].price == 0) {
      price = "Free";
    }

    if (role === "user")
       price = "$" + subscriptions[role].price + "/month+(usage fee +5%)";
    else if (role === "pro_user")
      price = "$" + subscriptions[role].price + "/month+(usage fee +3%)";
    else if (role === "super_user")
      price = "$" + subscriptions[role].price + "/month+(usage fee +1%)";
  }
  return price;
}

const SubscriptionComparisonTable = ({ subscriptions }) => {
  const comparison = [
    { name: "GPT-4 Turbo", user: "100/day", pro_user: "200/day", super_user: "300/day" },
    { name: "GPT-4 Vision (Image Input)", user: "No limit", pro_user: "No limit", super_user: "No limit" },
    { name: "File Input", user: "Yes", pro_user: "Yes", super_user: "Yes" },
    { name: "Role", user: "Yes", pro_user: "Yes", super_user: "Yes" },
    { name: "Data Store", user: "Yes", pro_user: "Yes +support", super_user: "Yes +support" },
    { name: "Node (Node AI)", user: "Yes", pro_user: "Yes", super_user: "Yes +support" },
    { name: "Midjourney", user: "╳", pro_user: "20/day", super_user: "50/day" },
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
      <div className="mt-2">* For enterprise use, please contact us at `<a href="mailto:support@simple-ai.io"><u>support@simple-ai.io</u></a>`.</div>
    </div>
  );
};

export default SubscriptionComparisonTable;
