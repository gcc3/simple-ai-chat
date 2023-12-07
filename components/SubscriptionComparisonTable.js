import React from "react";

const FeatureComparisonTable = () => {
  const features = [
    { name: "GPT-4", user: "24/day", pro_user: "2400/month", super_user: "7200/month" },
    { name: "GPT-4V", user: "Yes", pro_user: "Yes", super_user: "Yes" },
    { name: "De-hallucination", user: "24/day", pro_user: "Yes", super_user: "Yes" },
    { name: "Custom Roleplay", user: "╳", pro_user: "Yes", super_user: "Yes" },
    { name: "Personal Database", user: "╳", pro_user: "╳", super_user: "Yes" },
    { name: "Pricing", user: "Free" , pro_user: "$5/month", super_user: "$15/month" },
  ];

  return (
    <div className="mt-3 mb-5">
      <div className="mb-1">
        <div>Feature comparison</div>
      </div>
      <table className="table-fixed">
        <thead>
          <tr>
            <th rowSpan="2">Feature</th>
            <th colSpan="3">Roles/subcriptions</th>
          </tr>
          <tr>
            <th>`user`</th>
            <th>`pro_user`</th>
            <th>`super_user`</th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature, index) => (
            <tr key={index}>
              <td>{feature.name}</td>
              <td>{feature.user}</td>
              <td>{feature.pro_user}</td>
              <td>{feature.super_user}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FeatureComparisonTable;
