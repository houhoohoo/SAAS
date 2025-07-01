import React from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { ChatProvider } from './contexts/ChatContext';
import styles from './App.module.css';

function App() {
  return (
    <ChatProvider>
      <div className={styles.app}>
        <Sidebar />
        <ChatWindow />
      </div>
    </ChatProvider>
  );
}

export default App;