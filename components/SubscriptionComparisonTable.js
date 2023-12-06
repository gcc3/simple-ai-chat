import React from "react";

const FeatureComparisonTable = () => {
  const features = [
    { name: "GPT-4", user: "10/day", pro_user: "2000/month", super_user: "5000/month" },
    { name: "GPT-4V", user: "Yes", pro_user: "Yes", super_user: "Yes" },
    { name: "De-hallucination", user: "Yes", pro_user: "Yes", super_user: "Yes" },
    { name: "Custom Roleplay", user: "╳", pro_user: "Yes", super_user: "Yes" },
    { name: "Personal Database", user: "╳", pro_user: "╳", super_user: "Yes" },
    { name: "Pricing", user: "Free" , pro_user: "$10/month", super_user: "$30/month" },
  ];

  return (
    <div className="mt-3 mb-5">
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
