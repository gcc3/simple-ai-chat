import React, { useState } from 'react';
import GenericModal from './ui/GenericModal';
import styles from './InfoLogsModal.module.css'; // To be created
import commandJS from '../command.js';

const InfoLogsModal = ({ isOpen, onClose, showMessage }) => {
  const [subView, setSubView] = useState(null);
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  const handleCommand = async (cmdString, clearInput = true) => {
    console.log(`Executing from InfoLogsModal: ${cmdString}`);
    try {
      const result = await commandJS(cmdString);
      if (result && typeof result === 'string') {
        showMessage(result, 'info'); // Display result in main UI output
      } else {
        showMessage(`Command "${cmdString.split(' ')[0]}" executed.`, 'success');
      }
      if (clearInput) {
        setInputValue('');
      }
      // Modals for info commands usually close after execution
      onClose();
    } catch (error) {
      console.error(`Error executing command "${cmdString}":`, error);
      showMessage(`Error: ${error.message || error}`, 'error');
    }
  };

  // Specific view for commands that might take an argument
  const renderCommandWithInputView = (commandPrefix, placeholder, title) => (
    <div className={styles.form}>
      <h4>{title}</h4>
      <label htmlFor={`input-${commandPrefix}`}>{placeholder}</label>
      <input
        id={`input-${commandPrefix}`}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
      />
      <button onClick={() => handleCommand(`:${commandPrefix} ${inputValue}`)}>Execute</button>
      <button className={styles.backButton} onClick={() => setSubView(null)}>Back</button>
    </div>
  );

  const renderMainView = () => (
    <div className={styles.commandGrid}>
      {/* Simple Commands */}
      <button className={styles.commandButton} onClick={() => handleCommand(':help')}>Help (General)</button>
      <button className={styles.commandButton} onClick={() => setSubView('helpSpecific')}>Help (Specific Command)</button>
      <button className={styles.commandButton} onClick={() => handleCommand(':info')}>Info</button>
      <button className={styles.commandButton} onClick={() => handleCommand(':stats')}>Stats</button>
      <button className={styles.commandButton} onClick={() => handleCommand(':system info')}>System Info</button>

      {/* Log Commands */}
      <button className={styles.commandButton} onClick={() => handleCommand(':log list')}>List Logs</button>
      <button className={styles.commandButton} onClick={() => handleCommand(':log next')}>Next Log Page</button>
      <button className={styles.commandButton} onClick={() => handleCommand(':log prev')}>Previous Log Page</button>

      {/* Session Commands */}
      <button className={styles.commandButton} onClick={() => handleCommand(':session list')}>List Sessions</button>
      <button className={styles.commandButton} onClick={() => setSubView('sessionAttach')}>Attach Session</button>

      {/* LS Command */}
      <button className={styles.commandButton} onClick={() => handleCommand(':ls')}>List Files (Root)</button>
      <button className={styles.commandButton} onClick={() => setSubView('lsPath')}>List Files (Path)</button>

      {/* Search Command */}
      <button className={styles.commandButton} onClick={() => setSubView('search')}>Search</button>
    </div>
  );

  const renderContent = () => {
    switch (subView) {
      case 'helpSpecific':
        return renderCommandWithInputView('help', 'Enter command name', 'Specific Help');
      case 'sessionAttach':
        return renderCommandWithInputView('session attach', 'Enter Session ID', 'Attach Session');
      case 'lsPath':
        return renderCommandWithInputView('ls', 'Enter path', 'List Files in Path');
      case 'search':
        return renderCommandWithInputView('search', 'Enter search query', 'Search');
      default:
        return renderMainView();
    }
  };

  return (
    <GenericModal title="Information & Logs" isOpen={isOpen} onClose={() => { setSubView(null); onClose(); }}>
      {renderContent()}
    </GenericModal>
  );
};

export default InfoLogsModal;
