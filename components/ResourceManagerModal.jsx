import React, { useState } from 'react';
import GenericModal from './ui/GenericModal';
import styles from './ResourceManagerModal.module.css'; // To be created
import commandJS from '../command.js';

const ResourceManagerModal = ({ isOpen, onClose, showMessage }) => {
  const [resourceType, setResourceType] = useState('');
  const [resourceName, setResourceName] = useState('');

  // Predefined types for easier selection, can be a datalist or select
  const resourceTypes = ['model', 'role', 'function', 'store', 'node'];

  if (!isOpen) return null;

  const handleCommand = async (action) => {
    if (!resourceType || !resourceName) {
      showMessage('Resource type and name are required.', 'error');
      return;
    }

    const cmdString = `:${action} ${resourceType} ${resourceName}`;
    console.log(`Executing from ResourceManagerModal: ${cmdString}`);

    try {
      const result = await commandJS(cmdString);
      if (result && typeof result === 'string') {
        showMessage(result, 'info');
      } else {
        showMessage(`Command "${cmdString}" executed successfully.`, 'success');
      }
      // Clear fields after execution
      setResourceType('');
      setResourceName('');
      // onClose(); // Optionally close
    } catch (error) {
      console.error(`Error executing command "${cmdString}":`, error);
      showMessage(`Error: ${error.message || error}`, 'error');
    }
  };

  return (
    <GenericModal title="Use/Unuse Resources" isOpen={isOpen} onClose={onClose}>
      <div className={styles.form}>
        <label htmlFor="resource-type">Resource Type:</label>
        <input
          id="resource-type"
          type="text"
          value={resourceType}
          onChange={(e) => setResourceType(e.target.value)}
          placeholder="e.g., model, role, function"
          list="resource-type-options"
        />
        <datalist id="resource-type-options">
          {resourceTypes.map(type => (
            <option key={type} value={type} />
          ))}
        </datalist>

        <label htmlFor="resource-name">Resource Name:</label>
        <input
          id="resource-name"
          type="text"
          value={resourceName}
          onChange={(e) => setResourceName(e.target.value)}
          placeholder="Enter name of the resource"
        />

        <div className={styles.buttonGroup}>
          <button className={styles.useButton} onClick={() => handleCommand('use')}>Use Resource</button>
          <button className={styles.unuseButton} onClick={() => handleCommand('unuse')}>Unuse Resource</button>
        </div>
      </div>
    </GenericModal>
  );
};

export default ResourceManagerModal;
