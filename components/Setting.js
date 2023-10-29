import React, { useState } from 'react';
import ToggleButton from './ui/ToggleButton';

const Setting = ({ label, type, initialState = false }) => {
  const [isToggled, setIsToggled] = useState(initialState);

  const handleToggle = () => {
    setIsToggled(!isToggled);
  };

  const renderInput = () => {
    switch (type) {
      case 'toggle':
        return <ToggleButton isToggled={isToggled} onToggle={handleToggle} />;
      case 'text':
        return <input type="text" />;
      case 'dropdown':
        return (
          <select>
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
            <option value="option3">Option 3</option>
          </select>
        );
      case 'file':
        return <input type="file" />;
      default:
        return null;
    }
  };

  return (
    <div className="mb-2 flex justify-between items-center p-2 bg-gray-100 rounded-md">
      <div className="space-y-2 ml-2">
        <div>{label}</div>
      </div>
      <div className="flex justify-center mr-1">{renderInput()}</div>
    </div>
  );
};

export default Setting;