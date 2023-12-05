import React from 'react';

const ProgressBar = ({ label, progress }) => {
  const nowProgress = progress.split('/')[0];
  const maxProgress = progress.split('/')[1];
  const width = nowProgress / maxProgress * 100 + '%';

  return (<>
    <div className="mt-3">{label}({progress}):</div>
    <div className="progressbar mt-1">
      <div
        className="progressbar-fill"
        style={{
          width: width,
        }}
        aria-valuenow={nowProgress}
        aria-valuemin={0}
        aria-valuemax={maxProgress}
      />
    </div>
  </>);
};

export default ProgressBar;