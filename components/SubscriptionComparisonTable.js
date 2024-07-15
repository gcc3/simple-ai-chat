import React from "react";
import { getRoleFequencyLimit } from "utils/usageUtils";
import { useTranslation, Trans } from "react-i18next";

// Get amount
function getPriceString(subscriptions, role, t) {
  let price = "";
  if (subscriptions.hasOwnProperty(role)) {
    price = (Number(subscriptions[role].price) === 0 ? t("Free") : "$" + subscriptions[role].price + "/" + t("month")) + " +" + t("usage");
  }
  return price;
}

const SubscriptionComparisonTable = ({ subscriptions }) => {
  const { t } = useTranslation("subscriptions");

  const comparison = [
    { name: t("GPT Text Generation"), user: t("Yes"), pro_user: t("Yes"), super_user: t("Yes") },
    { name: t("GPT Vision"), user: t("Yes"), pro_user: t("Yes"), super_user: t("Yes") },
    { name: t("Image Generation (Midjourney)"), user: t("No"), pro_user: "120" + " " + t("image") + "/" + t("month"), super_user: "640" + " " + t("image") + "/" + t("month") + " +" + t("speedup") },
    { name: t("File Input"), user: t("Yes"), pro_user: t("Yes"), super_user: t("Yes") },
    { name: t("Roles"), user: t("Yes"), pro_user: t("Yes"), super_user: t("Yes") },
    { name: t("Data Stores"), user: t("Yes"), pro_user: t("Yes +support"), super_user: t("Yes +support") },
    { name: t("Nodes (Node AI)"), user: t("Yes"), pro_user: t("Yes"), super_user: t("Yes +support") },
    { name: t("Enhanced Knowledge & Mathematics (WolframAlpha)"), user: t("Yes"), pro_user: t("Yes"), super_user: t("Yes") },
    { name: "API", user: t("Yes"), pro_user: t("Yes"), super_user: t("Yes") },
    { name: t("Pricing"), user: getPriceString(subscriptions, "user", t), pro_user: getPriceString(subscriptions, "pro_user", t), super_user: getPriceString(subscriptions, "super_user", t)},
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
              <th colSpan="3">{ t("Subcriptions") }</th>
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
      <div className="mt-2">{ t("* For details of the usage fee, please refer to the Usage page.") }</div>
      <div>
        <Trans
          i18nKey="email_support_subscriptions"
          components={{ 1: <a href="mailto:support@simple-ai.io" target="_blank" rel="noopener noreferrer">{ t('link') }</a>, 2: <u></u> }}
          ns="subscriptions"
        />
      </div>
    </div>
  );
};

export default SubscriptionComparisonTable;
