import React, { useState, useEffect } from 'react';
import GenericModal from './ui/GenericModal';
import styles from './SettingsPrefsModal.module.css'; // To be created
import commandJS from '../command.js';
import { getLanguages } from '../utils/langUtils.js'; // Assuming this utility exists

const SettingsPrefsModal = ({ isOpen, onClose, showMessage }) => {
  const [subView, setSubView] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [inputValue2, setInputValue2] = useState('');
  const [languages, setLanguages] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const langs = getLanguages(); // Format: [{ language_code: 'en', native_name: 'English' }, ...]
      setLanguages(langs);
      // Potentially load current settings to pre-fill forms, e.g., current theme or lang
      // For instance, setInputValue(getCurrentLangFromLocalStorage());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCommand = async (cmdString, clearFields = true) => {
    console.log(`Executing from SettingsPrefsModal: ${cmdString}`);
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
      }
      // Some commands like :theme might require a page reload or dynamic style update
      // which should be handled by the command itself or a callback.
    } catch (error) {
      console.error(`Error executing command "${cmdString}":`, error);
      showMessage(`Error: ${error.message || error}`, 'error');
    }
  };

  const renderThemeView = () => (
    <div className={styles.form}>
      <h4>Change Theme</h4>
      <div className={styles.buttonGroup}>
        <button onClick={() => handleCommand(':theme light', false)}>Light</button>
        <button onClick={() => handleCommand(':theme dark', false)}>Dark</button>
        <button onClick={() => handleCommand(':theme terminal', false)}>Terminal</button>
        {/* Add other themes if available */}
      </div>
      <button className={styles.backButton} onClick={() => setSubView(null)}>Back</button>
    </div>
  );

  const renderLangView = () => (
    <div className={styles.form}>
      <h4>Change Language</h4>
      <label htmlFor="lang-code">Language Code (e.g., en, es, fr):</label>
      <input
        id="lang-code"
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Enter language code"
        list="language-options"
      />
      <datalist id="language-options">
        {languages.map(lang => (
          <option key={lang.language_code} value={lang.language_code}>
            {lang.native_name}
          </option>
        ))}
      </datalist>
      <button onClick={() => handleCommand(`:lang use ${inputValue}`)}>Set Language</button>
      <button className={styles.backButton} onClick={() => setSubView(null)}>Back</button>
    </div>
  );

  const renderSpeakView = () => (
    <div className={styles.form}>
      <h4>Text-to-Speech (TTS)</h4>
      <div className={styles.buttonGroup}>
        <button onClick={() => handleCommand(':speak on', false)}>Enable TTS</button>
        <button onClick={() => handleCommand(':speak off', false)}>Disable TTS</button>
        {/* Add voice selection if :speak use <voice_name> is supported */}
      </div>
      <label htmlFor="speak-voice">Voice Name (optional):</label>
      <input id="speak-voice" type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="e.g., David (if supported)" />
      <button onClick={() => handleCommand(`:speak use ${inputValue}`)}>Set Voice</button>
      <button className={styles.backButton} onClick={() => setSubView(null)}>Back</button>
    </div>
  );

  const renderVoiceInputView = () => (
    <div className={styles.form}>
      <h4>Voice Input (STT)</h4>
       <div className={styles.buttonGroup}>
        <button onClick={() => handleCommand(':voice on', false)}>Enable Voice Input</button>
        <button onClick={() => handleCommand(':voice off', false)}>Disable Voice Input</button>
      </div>
      <label htmlFor="voice-model">Voice Model (optional):</label>
      <input id="voice-model" type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="e.g., whisper-1 (if supported)" />
      <button onClick={() => handleCommand(`:voice use ${inputValue}`)}>Set Voice Model</button>
      <button className={styles.backButton} onClick={() => setSubView(null)}>Back</button>
    </div>
  );

  const renderLocationView = () => (
    <div className={styles.form}>
      <h4>Set Location</h4>
      <label htmlFor="location-string">Location:</label>
      <input id="location-string" type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="e.g., New York, US" />
      <button onClick={() => handleCommand(`:location set ${inputValue}`)}>Set Location</button>
      <button className={styles.backButton} onClick={() => setSubView(null)}>Back</button>
    </div>
  );

  const renderStreamView = () => (
     <div className={styles.form}>
      <h4>Streaming Mode</h4>
      <div className={styles.buttonGroup}>
        <button onClick={() => handleCommand(':stream on', false)}>Enable Streaming</button>
        <button onClick={() => handleCommand(':stream off', false)}>Disable Streaming</button>
      </div>
      <button className={styles.backButton} onClick={() => setSubView(null)}>Back</button>
    </div>
  );

  const renderGenericSetView = () => (
    <div className={styles.form}>
      <h4>Generic Set Command</h4>
      <label htmlFor="set-key">Setting Key:</label>
      <input id="set-key" type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="e.g., theme, memLength" />
      <label htmlFor="set-value">Setting Value:</label>
      <input id="set-value" type="text" value={inputValue2} onChange={(e) => setInputValue2(e.target.value)} placeholder="e.g., dark, 10" />
      <button onClick={() => handleCommand(`:set ${inputValue} ${inputValue2}`)}>Set Value</button>
      <button className={styles.backButton} onClick={() => setSubView(null)}>Back</button>
    </div>
  );


  const renderMainView = () => (
    <div className={styles.commandGrid}>
      <button className={styles.categorySectionButton} onClick={() => setSubView('theme')}>Theme</button>
      <button className={styles.categorySectionButton} onClick={() => setSubView('lang')}>Language</button>
      <button className={styles.categorySectionButton} onClick={() => setSubView('speak')}>Text-to-Speech</button>
      <button className={styles.categorySectionButton} onClick={() => setSubView('voice')}>Voice Input</button>
      <button className={styles.categorySectionButton} onClick={() => setSubView('location')}>Location</button>
      <button className={styles.categorySectionButton} onClick={() => setSubView('stream')}>Streaming</button>
      <button className={styles.categorySectionButton} onClick={() => setSubView('genericSet')}>Generic Set</button>
    </div>
  );

  const renderContent = () => {
    switch (subView) {
      case 'theme': return renderThemeView();
      case 'lang': return renderLangView();
      case 'speak': return renderSpeakView();
      case 'voice': return renderVoiceInputView();
      case 'location': return renderLocationView();
      case 'stream': return renderStreamView();
      case 'genericSet': return renderGenericSetView();
      default: return renderMainView();
    }
  };

  return (
    <GenericModal title="Settings & Preferences" isOpen={isOpen} onClose={() => { setSubView(null); onClose(); }}>
      {renderContent()}
    </GenericModal>
  );
};

export default SettingsPrefsModal;
