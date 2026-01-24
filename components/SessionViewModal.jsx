import React from 'react';
import GenericModal from './ui/GenericModal';
import styles from './SessionViewModal.module.css'; // Will create this next
import commandJS from '../command.js'; // Assuming command.js is in the root and handles the actual execution

const SessionViewModal = ({ isOpen, onClose, showMessage }) => {
  if (!isOpen) return null;

  const handleCommand = async (cmdString) => {
    console.log(`Executing from Modal: ${cmdString}`);
    try {
      // Assuming commandJS is an async function or returns a promise
      const result = await commandJS(cmdString);
      if (result && typeof result === 'string') {
        showMessage(result, 'info'); // Display command output if any
      } else {
        showMessage(`Command "${cmdString}" executed.`, 'success');
      }
      // Some commands might require UI refresh or state change here
      // For now, just closing the modal or showing a message
    } catch (error) {
      console.error(`Error executing command "${cmdString}":`, error);
      showMessage(`Error executing command: ${error.message || error}`, 'error');
    }
    // onClose(); // Optionally close modal after every command
  };

  return (
    <GenericModal title="Session & View Commands" isOpen={isOpen} onClose={onClose}>
      <div className={styles.commandGrid}>
        <button className={styles.commandButton} onClick={() => handleCommand(':clear')}>
            Clear Output
        </button>
        <button className={styles.commandButton} onClick={() => handleCommand(':fullscreen')}>
            Toggle Fullscreen
        </button>
        <button className={styles.commandButton} onClick={() => handleCommand(':split')}>
            Toggle Split View
        </button>
        <button className={styles.commandButton} onClick={() => handleCommand(':stop')}>
            Stop Generation
        </button>
        <button className={styles.commandButton} onClick={() => handleCommand(':reset view')}>
            Reset View / Session State
        </button>
         {/* Add more buttons for other session/view commands as needed */}
      </div>
    </GenericModal>
  );
};

export default SessionViewModal;
