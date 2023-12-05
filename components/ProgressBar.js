import React from 'react';

const ProgressBar = ({ label, progress }) => {
  const newProgress = progress.split('/')[0];
  const maxProgress = progress.split('/')[1];
  const width = newProgress / maxProgress * 100 + '%';

  return (<>
    <div className="mt-3">{label} ({progress}):</div>
    <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '0px' }}>
      <div
        style={{
          width: width,
          backgroundColor: 'gray',
          height: '20px',
          borderRadius: '0px',
        }}
        aria-valuenow={newProgress}
        aria-valuemin={0}
        aria-valuemax={maxProgress}
      />
    </div>
  </>);
};

export default ProgressBar;