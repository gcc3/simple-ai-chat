import React from "react";

const FeatureComparisonTable = () => {
  const features = [
    { name: "Pricing", user: "Free", superUser: "$5/month" },
    { name: "GPT-4-Turbo", user: "daily:50 weekly:70 monthly:300", superUser: "daily:500 weekly:700 monthly:3000" },
    { name: "GPT-4V", user: "daily:5 weekly:7 monthly:30", superUser: "daily:500 weekly:700 monthly:3000" },
  ];

  return (
    <div className="mt-3 mb-5">
      <table>
        <thead>
          <tr>
            <th rowSpan="2">Feature</th>
            <th colSpan="2">Roles</th>
          </tr>
          <tr>
            <th>`user`</th>
            <th>`super_user`</th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature, index) => (
            <tr key={index}>
              <td>{feature.name}</td>
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
