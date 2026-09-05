import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import DocumentManager from './components/DocumentManager';
import AdminDashboard from './components/AdminDashboard';
import SystemDesignVisualizer from './components/SystemDesignVisualizer';
import AuthModal from './components/AuthModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'documents' | 'admin' | 'architecture'
  const [initialPrompt, setInitialPrompt] = useState('');

  const handleSelectTopicPrompt = (promptText) => {
    setActiveTab('chat');
    setInitialPrompt(promptText);
  };

  return (
    <div className="app-container">
      {/* Top Universal Navbar */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Workspace Layout */}
      <main className="main-content">
        {activeTab === 'chat' && (
          <>
            <Sidebar onSelectTopicPrompt={handleSelectTopicPrompt} />
            <ChatArea
              initialPrompt={initialPrompt}
              onClearInitialPrompt={() => setInitialPrompt('')}
            />
          </>
        )}

        {activeTab === 'documents' && <DocumentManager />}

        {activeTab === 'admin' && <AdminDashboard />}

        {activeTab === 'architecture' && <SystemDesignVisualizer />}
      </main>

      {/* Global Auth Modal */}
      <AuthModal />
    </div>
  );
}
