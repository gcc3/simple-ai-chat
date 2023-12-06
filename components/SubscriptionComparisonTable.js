import React from "react";

const FeatureComparisonTable = () => {
  const features = [
    { name: "GPT-4", trial: "daily:5", user: "monthly:300", superUser: "monthly:3000" },
    { name: "GPT-4V", trial: "Not available", user: "monthly:30", superUser: "monthly:3000" },
    { name: "Pricing", trial: "Free" ,user: "$1", superUser: "$10/month" },
  ];

  return (
    <div className="mt-3 mb-5">
      <table className="table-fixed">
        <thead>
          <tr>
            <th rowSpan="2">Feature</th>
            <th colSpan="3">Roles</th>
          </tr>
          <tr>
            <th>`trial`</th>
            <th>`user`</th>
            <th>`super_user`</th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature, index) => (
            <tr key={index}>
              <td>{feature.name}</td>
              <td>{feature.trial}</td>
              <td>{feature.user}</td>
              <td>{feature.superUser}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FeatureComparisonTable;
