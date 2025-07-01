import React, { useState, useEffect } from 'react';
import GenericModal from './ui/GenericModal';
import styles from './AiConfigModal.module.css'; // To be created
import commandJS from '../command.js';
// import { getModels, getRoles, getFunctions } from '../utils/configUtils'; // Assuming utility functions to fetch these

const AiConfigModal = ({ isOpen, onClose, showMessage }) => {
  const [subView, setSubView] = useState(null); // e.g., 'model', 'role', 'function'
  const [inputValue, setInputValue] = useState('');
  const [inputValue2, setInputValue2] = useState('');

  // Example: Fetch dynamic data for selects/datalists if needed
  // const [models, setModels] = useState([]);
  // useEffect(() => {
  //   if (isOpen) {
  //     // const fetchedModels = await getModels();
  //     // setModels(fetchedModels);
  //   }
  // }, [isOpen]);

  if (!isOpen) return null;

  const handleCommand = async (cmdString, clearFields = true) => {
    console.log(`Executing from AiConfigModal: ${cmdString}`);
    try {
      const result = await commandJS(cmdString);
      if (result && typeof result === 'string') {
        showMessage(result, 'info');
      } else {
        showMessage(`Command "${cmdString.split(' ')[0]}" executed successfully.`, 'success');
      }
      if (clearFields) {
        setInputValue('');
        setInputValue2('');
        // Do not reset subView here, user might want to perform more actions in the same sub-view
      }
    } catch (error) {
      console.error(`Error executing command "${cmdString}":`, error);
      showMessage(`Error: ${error.message || error}`, 'error');
    }
  };

  const renderModelView = () => (
    <div className={styles.form}>
      <h4>Model Commands</h4>
      <button onClick={() => handleCommand(':model list')}>List Models</button>
      <label htmlFor="model-name">Model Name to Use:</label>
      <input id="model-name" type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="e.g., gpt-4" />
      <button onClick={() => handleCommand(`:model use ${inputValue}`)}>Use Model</button>
      <button className={styles.backButton} onClick={() => setSubView(null)}>Back to AI Config</button>
    </div>
  );

  const renderRoleView = () => (
    <div className={styles.form}>
      <h4>Role Commands</h4>
      <button onClick={() => handleCommand(':role list')}>List Roles</button>
      <label htmlFor="role-name-use">Role Name to Use:</label>
      <input id="role-name-use" type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="e.g., helpful_assistant" />
      <button onClick={() => handleCommand(`:role use ${inputValue}`)}>Use Role</button>

      <hr className={styles.divider} />
      <h5>Add New Role</h5>
      <label htmlFor="role-name-add">New Role Name:</label>
      <input id="role-name-add" type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="e.g., code_explainer" />
      <label htmlFor="role-prompt">System Prompt:</label>
      <textarea id="role-prompt" value={inputValue2} onChange={(e) => setInputValue2(e.target.value)} placeholder="Define the role's behavior" rows="3"></textarea>
      <button onClick={() => handleCommand(`:role add ${inputValue} "${inputValue2}"`)}>Add Role</button>
      <button className={styles.backButton} onClick={() => setSubView(null)}>Back to AI Config</button>
    </div>
  );

  const renderFunctionView = () => (
    <div className={styles.form}>
      <h4>Function Commands</h4>
      <button onClick={() => handleCommand(':function list')}>List Functions</button>
      <label htmlFor="function-name-use">Function Name to Use/Unuse:</label>
      <input id="function-name-use" type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="e.g., get_weather" />
      <button onClick={() => handleCommand(`:function use ${inputValue}`)}>Use Function</button>
      <button onClick={() => handleCommand(`:function unuse ${inputValue}`)}>Unuse Function</button>
      <button className={styles.backButton} onClick={() => setSubView(null)}>Back to AI Config</button>
    </div>
  );

  const renderGenerateView = () => (
    <div className={styles.form}>
      <h4>Generate</h4>
      <label htmlFor="generate-prompt">Optional Prompt:</label>
      <input id="generate-prompt" type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Enter prompt or leave blank" />
      <button onClick={() => handleCommand(inputValue ? `:generate ${inputValue}` : ':generate')}>Generate</button>
      <button className={styles.backButton} onClick={() => setSubView(null)}>Back to AI Config</button>
    </div>
  );

  const renderEvalView = () => (
    <div className={styles.form}>
      <h4>Evaluate Expression</h4>
      <label htmlFor="eval-expression">Expression:</label>
      <input id="eval-expression" type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="e.g., 2 + 2" />
      <button onClick={() => handleCommand(`:eval ${inputValue}`)}>Evaluate</button>
      <button className={styles.backButton} onClick={() => setSubView(null)}>Back to AI Config</button>
    </div>
  );

  const renderMainView = () => (
    <div className={styles.commandGrid}>
      <button className={styles.categorySectionButton} onClick={() => setSubView('model')}>Manage Models</button>
      <button className={styles.categorySectionButton} onClick={() => setSubView('role')}>Manage Roles</button>
      <button className={styles.categorySectionButton} onClick={() => setSubView('function')}>Manage Functions</button>
      <button className={styles.categorySectionButton} onClick={() => handleCommand(':store list')}>Manage Stores (List)</button>
      <button className={styles.categorySectionButton} onClick={() => handleCommand(':node list')}>Manage Nodes (List)</button>
      <button className={styles.categorySectionButton} onClick={() => setSubView('generate')}>Force Generate</button>
      <button className={styles.categorySectionButton} onClick={() => setSubView('eval')}>Evaluate Expression</button>
    </div>
  );

  const renderContent = () => {
    switch (subView) {
      case 'model': return renderModelView();
      case 'role': return renderRoleView();
      case 'function': return renderFunctionView();
      case 'generate': return renderGenerateView();
      case 'eval': return renderEvalView();
      default: return renderMainView();
    }
  };

  return (
    <GenericModal title="AI Configuration" isOpen={isOpen} onClose={() => { setSubView(null); onClose(); }}>
      {renderContent()}
    </GenericModal>
  );
};

export default AiConfigModal;
