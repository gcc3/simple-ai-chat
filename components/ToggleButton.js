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
      className={`mx-2 w-11 h-6 bg-gray-300 rounded-full p-1 transition duration-300 ease-in-out ${isToggled ? 'bg-blue-600' : ''}`}
    >
      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isToggled ? 'translate-x-5' : ''}`}></div>
    </button>
  );
};

export default ToggleButton;