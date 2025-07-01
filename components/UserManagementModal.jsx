import React, { useState } from 'react';
import GenericModal from './ui/GenericModal';
import styles from './UserManagementModal.module.css'; // Will create this next
import commandJS from '../command.js';

const UserManagementModal = ({ isOpen, onClose, showMessage }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [email, setEmail] = useState('');
  const [subView, setSubView] = useState(null); // 'login', 'setPassword', 'addUser', 'invite'

  if (!isOpen) return null;

  const handleCommand = async (cmdString, clearFields = true) => {
    console.log(`Executing from Modal: ${cmdString}`);
    try {
      const result = await commandJS(cmdString);
      if (result && typeof result === 'string') {
        showMessage(result, 'info');
      } else {
        showMessage(`Command "${cmdString.split(' ')[0]}" executed successfully.`, 'success');
      }
      if (clearFields) {
        setUsername('');
        setPassword('');
        setNewPassword('');
        setEmail('');
        setSubView(null); // Go back to main view of this modal
      }
    } catch (error) {
      console.error(`Error executing command "${cmdString}":`, error);
      showMessage(`Error: ${error.message || error}`, 'error');
    }
  };

  const renderSubView = () => {
    switch (subView) {
      case 'login':
        return (
          <div className={styles.form}>
            <h3>Login</h3>
            <label htmlFor="login-username">Username</label>
            <input id="login-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" />
            <label htmlFor="login-password">Password</label>
            <input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" />
            <button onClick={() => handleCommand(`:login ${username} ${password}`)}>Submit Login</button>
            <button className={styles.backButton} onClick={() => setSubView(null)}>Back</button>
          </div>
        );
      case 'setPassword':
        return (
          <div className={styles.form}>
            <h3>Set New Password</h3>
            {/* Assuming current user context, might need username if admin */}
            <label htmlFor="setpass-new">New Password</label>
            <input id="setpass-new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
            {/* Add old password field if not admin / based on command spec */}
            <button onClick={() => handleCommand(`:user set password ${newPassword}`)}>Set Password</button>
            <button className={styles.backButton} onClick={() => setSubView(null)}>Back</button>
          </div>
        );
      case 'addUser':
        return (
          <div className={styles.form}>
            <h3>Add New User</h3>
            <label htmlFor="adduser-username">Username</label>
            <input id="adduser-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="New username" />
            <label htmlFor="adduser-password">Password</label>
            <input id="adduser-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New user's password" />
            <button onClick={() => handleCommand(`:user add ${username} ${password}`)}>Add User</button>
            <button className={styles.backButton} onClick={() => setSubView(null)}>Back</button>
          </div>
        );
      case 'invite':
        return (
          <div className={styles.form}>
            <h3>Invite User</h3>
            <label htmlFor="invite-email">Email</label>
            <input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email to invite" />
            <button onClick={() => handleCommand(`:invite send ${email}`)}>Send Invite</button>
            <button className={styles.backButton} onClick={() => setSubView(null)}>Back</button>
          </div>
        );
      default:
        return (
          <div className={styles.commandGrid}>
            <button className={styles.commandButton} onClick={() => setSubView('login')}>Login</button>
            <button className={styles.commandButton} onClick={() => handleCommand(':logout', false)}>Logout</button>
            <button className={styles.commandButton} onClick={() => setSubView('setPassword')}>Set Password</button>
            <button className={styles.commandButton} onClick={() => setSubView('addUser')}>Add User</button>
            {/* Simple user delete, might need confirmation or username input */}
            {/* <button className={styles.commandButton} onClick={() => handleCommand(':user delete self_or_username')}>Delete User</button> */}
            <button className={styles.commandButton} onClick={() => setSubView('invite')}>Invite User</button>
          </div>
        );
    }
  };

  return (
    <GenericModal title="User Management" isOpen={isOpen} onClose={() => { setSubView(null); onClose(); }}>
      {renderSubView()}
    </GenericModal>
  );
};

export default UserManagementModal;
