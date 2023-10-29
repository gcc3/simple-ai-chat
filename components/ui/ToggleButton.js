import React, { useState } from 'react';

const ToggleButton = ({ onToggle, initialState = false }) => {
  const [isToggled, setIsToggled] = useState(initialState);

  const handleToggle = () => {
    setIsToggled(!isToggled);
    if (onToggle) {
      onToggle(!isToggled);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`w-9 h-5 bg-gray-300 rounded-full p-1 transition duration-300 ease-in-out ${isToggled ? 'bg-blue-600' : ''}`}
    >
      <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isToggled ? 'translate-x-4' : ''}`}></div>
    </button>
  );
};

export default ToggleButton;