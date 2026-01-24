import React, { useState } from 'react';
import GenericModal from './ui/GenericModal';
import styles from './CommandsModal.module.css'; // We'll create this CSS module next

// Placeholder for actual category modals - these will be created later
// import SessionViewModal from './SessionViewModal';
// import UserManagementModal from './UserManagementModal';
// import AiConfigModal from './AiConfigModal';
// import SettingsPrefsModal from './SettingsPrefsModal';
// import InfoLogsModal from './InfoLogsModal';
// import ResourceManagerModal from './ResourceManagerModal';

const CommandCategories = [
  { id: 'sessionView', name: 'Session & View' },
  { id: 'userManagement', name: 'User Management' },
  { id: 'aiConfig', name: 'AI Configuration' },
  { id: 'settingsPrefs', name: 'Settings & Preferences' },
  { id: 'infoLogs', name: 'Information & Logs' },
  { id: 'resourceManagement', name: 'Resource Management' },
];

const CommandsModal = ({ isOpen, onClose, onSelectCategory }) => {
  if (!isOpen) return null;

  return (
    <GenericModal title="Select Command Category" isOpen={isOpen} onClose={onClose}>
      <ul className={styles.categoryList}>
        {CommandCategories.map((category) => (
          <li key={category.id}>
            <button
              className={styles.categoryButton}
              onClick={() => onSelectCategory(category.id)}
            >
              {category.name}
            </button>
          </li>
        ))}
      </ul>
    </GenericModal>
  );
};

export default CommandsModal;
