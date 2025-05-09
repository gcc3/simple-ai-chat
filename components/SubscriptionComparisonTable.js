import React from "react";
import { useTranslation, Trans } from "react-i18next";

// Get amount
function getPriceString(subscriptions, role, t) {
  let price = "";
  if (subscriptions.hasOwnProperty(role)) {
    price = (Number(subscriptions[role].price) === 0 ? t("Free") : "$" + subscriptions[role].price + "/" + t("month"));
  }
  return price;
}

const SubscriptionComparisonTable = ({ subscriptions }) => {
  const { t } = useTranslation("subscriptions");

  const comparison = [
    { name: t("Text Generationn"), user: t("Yes"), plus_user: t("Yes") },
    { name: t("GPT Vision"), user: t("Yes"), plus_user: t("Yes") },
    { name: t("Image Generation & Edit"), user: t("Yes"), plus_user: t("Yes") },
    { name: t("Model Context Protocol (MCP)"), user: t("Yes"), plus_user: t("Yes") },
    { name: t("File Input"), user: t("Yes"), plus_user: t("Yes") },
    { name: t("Roles"), user: t("Yes"), plus_user: t("Yes +support") },
    { name: t("Data Stores"), user: t("Yes"), plus_user: t("Yes +support") },
    { name: t("Nodes (Node AI)"), user: t("Yes"), plus_user: t("Yes +support") },
    { name: t("Enhanced Knowledge & Mathematics (WolframAlpha)"), user: t("Yes"), plus_user: t("Yes") },
    { name: "API", user: t("Yes"), plus_user: t("Yes") },
    { name: t("Pricing"), user: getPriceString(subscriptions, "user", t), plus_user: getPriceString(subscriptions, "plus_user", t) },
  ];

  return (
    <div className="mt-3">
      <div className="mb-1">
        <div>{ t("Features Comparison and Pricing") }</div>
      </div>
      <div className="table-container">
        <table className="table-fixed">
          <thead>
            <tr>
              <th rowSpan="2">{ t("Features") }</th>
              <th colSpan="2">{ t("Subscriptions") }</th>
            </tr>
            <tr>
              <th>`user`</th>
              <th>`plus_user`</th>
            </tr>
          </thead>
          <tbody>
            {comparison.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{item.user}</td>
                <td>{item.plus_user}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2">{ t("* For details of the usage fee, please refer to the Usage page.") }</div>
      <div>
        <Trans
          i18nKey="email_support_subscriptions"
          components={{ 1: <a href="mailto:support@simple-ai.io" target="_blank" rel="noopener noreferrer">{ t('link') }</a>, 2: <u></u> }}
          ns="translation"
        />
      </div>
    </div>
  );
};

export default SubscriptionComparisonTable;
