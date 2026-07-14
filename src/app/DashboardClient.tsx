'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Check } from 'lucide-react';
import { 
  markMessageAsRead, 
  toggleMessageArchive, 
  deleteMessage,
  updateProjectSettings,
  createNewProject,
  logoutUser,
  resendVerificationEmail
} from './actions';
import { getCachedMessages, setCachedMessages, CachedMessage } from '@/lib/indexed-db';
import { UserData, ProjectData, Message } from '@/types/dashboard';

// Import components
import Sidebar from '@/components/dashboard/Sidebar';
import MessageList from '@/components/dashboard/MessageList';
import MessageDetail from '@/components/dashboard/MessageDetail';
import SettingsPane from '@/components/dashboard/SettingsPane';

interface DashboardClientProps {
  initialUser: UserData;
  initialProjects: ProjectData[];
}

export default function DashboardClient({ 
  initialUser,
  initialProjects
}: DashboardClientProps) {
  // Client state
  const [projects, setProjects] = useState<ProjectData[]>(initialProjects);
  const [project, setProject] = useState<ProjectData>(initialProjects[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'archived'>('all');
  const [activeView, setActiveView] = useState<'inbox' | 'settings'>('inbox');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Create project form state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectPlatform, setNewProjectPlatform] = useState('');
  const [newProjectUrl, setNewProjectUrl] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  // Dynamic sync & connection states
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [isPending, startTransition] = useTransition();

  // Form states for project settings
  const [discordEnabled, setDiscordEnabled] = useState(project.discordEnabled);
  const [discordWebhook, setDiscordWebhook] = useState(project.discordWebhook || '');
  
  const [telegramEnabled, setTelegramEnabled] = useState(project.telegramEnabled);
  const [telegramToken, setTelegramToken] = useState(project.telegramToken || '');
  const [telegramChatId, setTelegramChatId] = useState(project.telegramChatId || '');
  
  const [emailEnabled, setEmailEnabled] = useState(project.emailEnabled);
  const [emailRecipient, setEmailRecipient] = useState(project.emailRecipient || '');

  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    setDiscordEnabled(project.discordEnabled);
    setDiscordWebhook(project.discordWebhook || '');
    setTelegramEnabled(project.telegramEnabled);
    setTelegramToken(project.telegramToken || '');
    setTelegramChatId(project.telegramChatId || '');
    setEmailEnabled(project.emailEnabled);
    setEmailRecipient(project.emailRecipient || '');
  }, [project.id]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !newProjectPlatform.trim()) {
      triggerToast('Project name and platform type are required.');
      return;
    }
    setIsCreatingProject(true);
    try {
      const res = await createNewProject({
        name: newProjectName,
        platform: newProjectPlatform,
        platformUrl: newProjectUrl
      });
      if (res.success && res.project) {
        const typedProj = res.project as ProjectData;
        setProjects(prev => [...prev, typedProj]);
        setProject(typedProj);
        setIsCreateModalOpen(false);
        setNewProjectName('');
        setNewProjectPlatform('');
        setNewProjectUrl('');
        triggerToast('Workspace project created successfully!');
      } else {
        triggerToast('Failed to create project: ' + res.error);
      }
    } catch (err: any) {
      triggerToast('Error: ' + err.message);
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    triggerToast('Saving settings...');
    
    try {
      const updated = await updateProjectSettings(project.id, {
        discordEnabled,
        discordWebhook: discordWebhook.trim() || null,
        telegramEnabled,
        telegramToken: telegramToken.trim() || null,
        telegramChatId: telegramChatId.trim() || null,
        emailEnabled,
        emailRecipient: emailRecipient.trim() || null,
      });

      setProject(updated);
      setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
      triggerToast('Settings updated successfully!');
    } catch (err: any) {
      triggerToast('Error: ' + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      const res = await resendVerificationEmail();
      if (res.success) {
        triggerToast('Verification email sent! Check your inbox.');
      } else {
        triggerToast('Failed: ' + res.message);
      }
    } catch (err: any) {
      triggerToast('Error: ' + err.message);
    } finally {
      setIsResending(false);
    }
  };

  /**
   * Helper to fetch latest messages from Next.js GET API route
   * and update browser IndexedDB cache.
   */
  const fetchLatestMessages = async (): Promise<boolean> => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/messages', {
        headers: {
          'Authorization': `Bearer ${project.apiKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success && Array.isArray(data.messages)) {
        setMessages(data.messages);
        if (data.project) {
          setProject(data.project);
        }
        
        // Write to IndexedDB local cache
        await setCachedMessages(data.messages);
        setIsOffline(false);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[DashboardClient] Network request failed. Serving offline cache:', err);
      setIsOffline(true);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Initial Load: sync when project selection changes
  useEffect(() => {
    const loadInitialData = async () => {
      setSelectedMessageId(null);
      setMessages([]); // clear current project messages to show shimmer skeletons
      await fetchLatestMessages();
    };
    loadInitialData();
  }, [project.id]);

  // Real-time updates: Poll for new messages every 5 seconds (only when tab is visible)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (document.visibilityState === 'visible' && !isOffline) {
        await fetchLatestMessages();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [project.apiKey, isOffline]);

  const selectedMessage = messages.find(m => m.id === selectedMessageId);

  // Trigger mark as read when a message is selected
  useEffect(() => {
    if (selectedMessage && selectedMessage.status === 'unread') {
      const previousMessages = [...messages];
      const updatedMessages = messages.map(m => m.id === selectedMessage.id ? { ...m, status: 'read' } : m);
      
      // Optimistic updates (UI + IndexedDB cache)
      setMessages(updatedMessages);
      setCachedMessages(updatedMessages as CachedMessage[]);
      
      startTransition(async () => {
        try {
          await markMessageAsRead(selectedMessage.id);
        } catch (err) {
          console.warn('[DashboardClient] Mark read failed on server. Reverting to previous status.');
          setMessages(previousMessages);
          setCachedMessages(previousMessages as CachedMessage[]);
          setIsOffline(true);
          triggerToast('Offline fallback: Status reverted locally.');
        }
      });
    }
  }, [selectedMessageId]);

  // Toast handler helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Action: Toggle Archive
  const handleToggleArchive = async (msg: Message) => {
    const isCurrentlyArchived = msg.status === 'archived';
    const newStatus = isCurrentlyArchived ? 'read' : 'archived';
    
    const previousMessages = [...messages];
    const updatedMessages = messages.map(m => m.id === msg.id ? { ...m, status: newStatus } : m);
    
    // Optimistic Update
    setMessages(updatedMessages);
    setCachedMessages(updatedMessages as CachedMessage[]);
    
    // Clear selection if we move away from active tab view
    if (activeTab === 'archived' && newStatus !== 'archived') {
      setSelectedMessageId(null);
    } else if (activeTab === 'unread' && newStatus === 'archived') {
      setSelectedMessageId(null);
    }

    startTransition(async () => {
      try {
        await toggleMessageArchive(msg.id, msg.status);
        triggerToast(isCurrentlyArchived ? 'Message moved to Inbox' : 'Message archived');
      } catch (err) {
        console.warn('[DashboardClient] Toggle archive failed on server. Reverting.');
        setMessages(previousMessages);
        setCachedMessages(previousMessages as CachedMessage[]);
        setIsOffline(true);
        triggerToast('Offline fallback: Archive status reverted.');
      }
    });
  };

  // Action: Delete Message
  const handleDelete = async (msg: Message) => {
    if (confirm(`Are you sure you want to delete the message from ${msg.name}?`)) {
      const previousMessages = [...messages];
      const updatedMessages = messages.filter(m => m.id !== msg.id);
      
      // Optimistic delete
      setMessages(updatedMessages);
      setCachedMessages(updatedMessages as CachedMessage[]);
      setSelectedMessageId(null);

      startTransition(async () => {
        try {
          await deleteMessage(msg.id);
          triggerToast('Message deleted permanently');
        } catch (err) {
          console.warn('[DashboardClient] Delete action failed on server. Reverting.');
          setMessages(previousMessages);
          setCachedMessages(previousMessages as CachedMessage[]);
          setIsOffline(true);
          triggerToast('Offline fallback: Message restored.');
        }
      });
    }
  };

  const handleLogout = async () => {
    const { logoutUser } = await import('./actions');
    await logoutUser();
    window.location.reload();
  };

  // Filter messages based on Search & Tabs
  const filteredMessages = messages.filter(msg => {
    if (activeTab === 'unread' && msg.status !== 'unread') return false;
    if (activeTab === 'archived' && msg.status !== 'archived') return false;
    if (activeTab === 'all' && msg.status === 'archived') return false; // Hide archived in Inbox

    if (searchQuery.trim() === '') return true;
    const query = searchQuery.toLowerCase();
    return (
      msg.name.toLowerCase().includes(query) ||
      msg.email.toLowerCase().includes(query) ||
      (msg.subject && msg.subject.toLowerCase().includes(query)) ||
      msg.message.toLowerCase().includes(query)
    );
  });

  // Calculate statistics
  const unreadCount = messages.filter(m => m.status === 'unread').length;
  const archivedCount = messages.filter(m => m.status === 'archived').length;
  const totalInbox = messages.filter(m => m.status !== 'archived').length;

  return (
    <div className="dashboard-container" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      
      {/* Sidebar Component */}
      <Sidebar 
        initialUser={initialUser}
        projects={projects}
        project={project}
        setProject={setProject}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        activeView={activeView}
        setActiveView={setActiveView}
        unreadCount={unreadCount}
        setIsCreateModalOpen={setIsCreateModalOpen}
        handleLogout={async () => {
          await logoutUser();
          window.location.reload();
        }}
      />

      {/* Main Content Area */}
      <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        {/* Verification Banner */}
        {initialUser.emailVerified === false && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderBottom: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', padding: '12px 24px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 600 }}>Action Required:</span> 
              Please check your inbox to verify your email address. Email routing is disabled until verified.
            </div>
            <button 
              onClick={handleResendVerification}
              disabled={isResending}
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: 'none',
                color: 'var(--danger)',
                padding: '4px 12px',
                borderRadius: '4px',
                cursor: isResending ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '12px',
                opacity: isResending ? 0.7 : 1
              }}
            >
              {isResending ? 'Sending...' : 'Resend Email'}
            </button>
          </div>
        )}

        {/* Toast Alert */}
        {toastMessage && (
          <div className="toast">
            <Check size={16} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Main View Router */}
        {activeView === 'inbox' ? (
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* 2. Middle Panel: Messages List */}
            <MessageList 
              messages={messages}
              filteredMessages={filteredMessages}
              isOffline={isOffline}
              isSyncing={isSyncing}
              fetchLatestMessages={fetchLatestMessages}
              triggerToast={triggerToast}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              setSelectedMessageId={setSelectedMessageId}
              selectedMessageId={selectedMessageId}
              totalInbox={totalInbox}
              unreadCount={unreadCount}
              archivedCount={archivedCount}
            />

            {/* 3. Right Panel: Selected Message Detail */}
            <MessageDetail 
              selectedMessage={selectedMessage}
              handleToggleArchive={handleToggleArchive}
              handleDelete={handleDelete}
            />
          </div>
      ) : (
        /* Settings & Integration View */
        <SettingsPane 
          user={initialUser}
          project={project}
          messages={messages}
          unreadCount={unreadCount}
          discordEnabled={discordEnabled}
          setDiscordEnabled={setDiscordEnabled}
          discordWebhook={discordWebhook}
          setDiscordWebhook={setDiscordWebhook}
          telegramEnabled={telegramEnabled}
          setTelegramEnabled={setTelegramEnabled}
          telegramToken={telegramToken}
          setTelegramToken={setTelegramToken}
          telegramChatId={telegramChatId}
          setTelegramChatId={setTelegramChatId}
          emailEnabled={emailEnabled}
          setEmailEnabled={setEmailEnabled}
          emailRecipient={emailRecipient}
          setEmailRecipient={setEmailRecipient}
          handleSaveSettings={handleSaveSettings}
          isSavingSettings={isSavingSettings}
          triggerToast={triggerToast}
        />
      )}
      </div>
      
      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '32px',
            width: '100%',
            maxWidth: '440px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>Create New Project Workspace</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Register a new platform to start routing its message submissions.
            </p>

            <div className="configField" style={{ marginBottom: '16px' }}>
              <label className="configLabel">Project Name</label>
              <input
                type="text"
                placeholder="e.g. My SaaS"
                className="configInput"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
            </div>

            <div className="configField" style={{ marginBottom: '16px' }}>
              <label className="configLabel">Platform Type</label>
              <input
                type="text"
                placeholder="e.g. Portfolio Website"
                className="configInput"
                value={newProjectPlatform}
                onChange={(e) => setNewProjectPlatform(e.target.value)}
              />
            </div>

            <div className="configField" style={{ marginBottom: '24px' }}>
              <label className="configLabel">Platform Origin URL</label>
              <input
                type="text"
                placeholder="e.g. https://mysite.com"
                className="configInput"
                value={newProjectUrl}
                onChange={(e) => setNewProjectUrl(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setNewProjectName('');
                  setNewProjectPlatform('');
                  setNewProjectUrl('');
                }}
                className="actionButton"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateProject}
                disabled={isCreatingProject}
                className="actionButton actionButtonAccent"
              >
                {isCreatingProject ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
