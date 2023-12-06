import React from 'react';

const ProgressBar = ({ label, progress }) => {
  const nowProgress = progress.split('/')[0];
  const maxProgress = progress.split('/')[1];
  const percentage = Math.round((nowProgress / maxProgress) * 100) + '%';

  return (<>
    <div className="mt-2">{label} ({progress}, {percentage}):</div>
    <div className="progressbar mt-1">
      <div
        className="progressbar-fill"
        style={{
          width: percentage,
        }}
        aria-valuenow={nowProgress}
        aria-valuemin={0}
        aria-valuemax={maxProgress}
      />
    </div>
  </>);
};

export default ProgressBar;