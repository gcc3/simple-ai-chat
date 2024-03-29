import React from "react";
import { npre } from "utils/numberUtils";

const ProgressBar = ({ label, progress, progressMax }) => {
  const percentage = npre(Math.min(Math.round((progress / progressMax) * 100), 100)) + "%";

  return (
    <>
      <div className="mt-2">
        {label} ({progress}/{progressMax}, {percentage}):
      </div>
      <div className="progressbar">
        <div
          className="progressbar-fill"
          style={{
            width: percentage,
          }}
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={progressMax}
        />
      </div>
    </>
  );
};

export default ProgressBar;
