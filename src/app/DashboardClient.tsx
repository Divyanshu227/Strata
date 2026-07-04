'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { 
  Inbox, 
  Archive, 
  Trash2, 
  Settings, 
  Search, 
  Mail, 
  Key, 
  Copy, 
  Check, 
  AlertCircle, 
  Sparkles,
  Send,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Plus
} from 'lucide-react';
import { 
  markMessageAsRead, 
  toggleMessageArchive, 
  deleteMessage,
  updateProjectSettings,
  createNewProject
} from './actions';
import { getCachedMessages, setCachedMessages, CachedMessage } from '@/lib/indexed-db';

interface UserData {
  id: string;
  name: string;
  username: string;
  email: string;
}

interface ProjectData {
  id: string;
  name: string;
  apiKey: string;
  discordEnabled: boolean;
  discordWebhook: string | null;
  telegramEnabled: boolean;
  telegramToken: string | null;
  telegramChatId: string | null;
  emailEnabled: boolean;
  emailRecipient: string | null;
  platform?: string | null;
  platformUrl?: string | null;
}

interface Message {
  id: string;
  projectId: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: string;
  createdAt: string | Date;
  spamScore?: number | null;
  priority?: string | null;
  sentiment?: string | null;
}

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
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
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
    triggerToast('Saving settings to Supabase...');
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
      triggerToast('Settings saved successfully!');
    } catch (err: any) {
      console.error(err);
      triggerToast('Failed to save settings: ' + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  /**
   * Helper to fetch latest messages from Next.js GET API route
   * and update browser IndexedDB cache.
   */
  const fetchLatestMessages = async (): Promise<boolean> => {
    setIsSyncing(true);
    try {
      console.log('[DashboardClient] Fetching latest messages from API...');
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
        console.log(`[DashboardClient] Successfully loaded ${data.messages.length} messages from server.`);
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
      console.log(`[DashboardClient] Project changed to ${project.name}. Syncing fresh data...`);
      await fetchLatestMessages();
    };
    loadInitialData();
  }, [project.id]);

  // Real-time updates: Poll for new messages every 5 seconds (only when tab is visible)
  useEffect(() => {
    console.log('[DashboardClient] Starting background message polling cycle...');
    const interval = setInterval(async () => {
      if (document.visibilityState === 'visible' && !isOffline) {
        await fetchLatestMessages();
      }
    }, 5000);
    
    return () => {
      clearInterval(interval);
    };
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

  // Utility to copy strings
  const copyToClipboard = (text: string, isToken: boolean) => {
    navigator.clipboard.writeText(text);
    if (isToken) {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
    triggerToast('Copied to clipboard!');
  };

  // Date Formatter
  const formatFriendlyDate = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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

  // Code integration snippet for user's portfolio site
  const integrationSnippet = `// API call from your Portfolio Website (HTML/JS)
async function sendContactMessage(name, email, subject, message) {
  const endpoint = '${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/messages';
  const projectId = '${project.id}';
  const apiKey = '${project.apiKey}';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-project-id': projectId,
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({ name, email, subject, message })
    });

    const result = await response.json();
    if (response.ok) {
      console.log('Message sent successfully:', result);
      return { success: true };
    } else {
      console.error('Error sending message:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Network error:', error);
    return { success: false, error: 'Network error occurred' };
  }
}`;

  return (
    <div className="appContainer">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="toast">
          <Check size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Sidebar Panel */}
      <aside className={`sidebar ${isSidebarCollapsed ? 'sidebarCollapsed' : ''}`}>
        <div className="logoArea" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Mail className="logoIcon" size={24} />
            <span className="logoText">Strata</span>
          </div>
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '4px',
              transition: 'color 0.2s'
            }}
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Project Selector Workspace */}
        {!isSidebarCollapsed ? (
          <div style={{ padding: '0 16px', marginBottom: '16px', marginTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Project Workspace</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={project.id}
                onChange={(e) => {
                  const selected = projects.find(p => p.id === e.target.value);
                  if (selected) setProject(selected);
                }}
                style={{
                  flex: 1,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: 0
                }}
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
                title="Create New Project"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', marginTop: '12px' }}>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Create New Project"
            >
              <Plus size={16} />
            </button>
          </div>
        )}

        <nav className="sidebarMenu">
          <button 
            className={`menuItem ${activeView === 'inbox' ? 'menuItemActive' : ''}`}
            onClick={() => setActiveView('inbox')}
            title="Inbox"
          >
            <div className="menuItemInner">
              <Inbox size={18} />
              <span>Inbox</span>
            </div>
            {unreadCount > 0 && (
              <span className="sidebarBadge">{unreadCount}</span>
            )}
          </button>

          <button 
            className={`menuItem ${activeView === 'settings' ? 'menuItemActive' : ''}`}
            onClick={() => setActiveView('settings')}
            title="Integration & Settings"
          >
            <div className="menuItemInner">
              <Settings size={18} />
              <span>Integration & Settings</span>
            </div>
          </button>
        </nav>

        <div className="sidebarFooter" style={{
          padding: '16px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
          gap: '12px',
          minWidth: 0
        }}>
          {!isSidebarCollapsed ? (
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {initialUser.name}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {initialUser.email}
              </span>
            </div>
          ) : null}
          <button
            onClick={async () => {
              const { logoutUser } = await import('./actions');
              await logoutUser();
              window.location.reload();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '6px',
              transition: 'all 0.2s',
              flexShrink: 0
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main View Router */}
      {activeView === 'inbox' ? (
        <>
          {/* 2. Middle Panel: Messages List */}
          <section className="listPane">
            <div className="listHeader">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '8px' }}>
                <h2 className="listTitle" style={{ margin: 0 }}>Messages</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isOffline ? (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: 'var(--warning)',
                      background: 'rgba(245, 158, 11, 0.1)',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      border: '1px solid rgba(245, 158, 11, 0.2)'
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: 'var(--warning)',
                        display: 'inline-block',
                      }}></span>
                      <span>Offline Cache</span>
                    </div>
                  ) : (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: 'var(--success)',
                      background: 'var(--success-glow)',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: 'var(--success)',
                        display: 'inline-block',
                        animation: isSyncing ? 'pulse 1s infinite' : 'none'
                      }}></span>
                      <span>{isSyncing ? 'Syncing...' : 'Live Sync'}</span>
                    </div>
                  )}
                  
                  <button 
                    onClick={async () => {
                      triggerToast('Checking server for updates...');
                      const ok = await fetchLatestMessages();
                      triggerToast(ok ? 'Sync completed successfully!' : 'Sync failed (Offline cache active)');
                    }}
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Fetch latest messages from server"
                  >
                    Sync
                  </button>
                </div>
              </div>
              
              <div className="searchContainer">
                <Search className="searchIcon" size={16} />
                <input 
                  type="text" 
                  placeholder="Search sender, email, content..." 
                  className="searchInput"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="tabsContainer">
                <button 
                  className={`tabButton ${activeTab === 'all' ? 'tabButtonActive' : ''}`}
                  onClick={() => { setActiveTab('all'); setSelectedMessageId(null); }}
                >
                  Inbox ({totalInbox})
                </button>
                <button 
                  className={`tabButton ${activeTab === 'unread' ? 'tabButtonActive' : ''}`}
                  onClick={() => { setActiveTab('unread'); setSelectedMessageId(null); }}
                >
                  Unread ({unreadCount})
                </button>
                <button 
                  className={`tabButton ${activeTab === 'archived' ? 'tabButtonActive' : ''}`}
                  onClick={() => { setActiveTab('archived'); setSelectedMessageId(null); }}
                >
                  Archived ({archivedCount})
                </button>
              </div>
            </div>

            <div className="messagesList">
              {isSyncing && messages.length === 0 ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="skeletonCard">
                    <div className="skeletonHeader">
                      <div className="skeletonName"></div>
                      <div className="skeletonTime"></div>
                    </div>
                    <div className="skeletonSubject"></div>
                    <div className="skeletonPreview"></div>
                  </div>
                ))
              ) : filteredMessages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                  <p style={{ fontSize: '14px', fontWeight: '500' }}>No messages found</p>
                  <p style={{ fontSize: '12px', marginTop: '4px', color: 'var(--text-muted)' }}>
                    {searchQuery ? 'Try a different search query' : 'Your Strata inbox is empty.'}
                  </p>
                </div>
              ) : (
                filteredMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`messageCard ${selectedMessageId === msg.id ? 'messageCardActive' : ''} ${msg.status === 'unread' ? 'messageCardUnread' : ''}`}
                    onClick={() => setSelectedMessageId(msg.id)}
                  >
                    <div className="cardHeader">
                      <span className="cardName">{msg.name}</span>
                      <span className="cardTime" suppressHydrationWarning>
                        {formatFriendlyDate(msg.createdAt)}
                      </span>
                    </div>
                    {msg.subject && (
                      <h4 className="cardSubject">{msg.subject}</h4>
                    )}
                    <p className="cardPreview" style={{ marginBottom: '6px' }}>{msg.message}</p>
                    
                    {/* Optional AI Badges */}
                    {(msg.priority || msg.sentiment || (msg.spamScore !== undefined && msg.spamScore !== null)) && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                        {msg.priority && (
                          <span style={{
                            fontSize: '9px',
                            fontWeight: '700',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: msg.priority === 'high' ? 'var(--danger-glow)' : msg.priority === 'medium' ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-tertiary)',
                            color: msg.priority === 'high' ? 'var(--danger)' : msg.priority === 'medium' ? 'var(--warning)' : 'var(--text-secondary)',
                            border: `1px solid ${msg.priority === 'high' ? 'rgba(239, 68, 68, 0.2)' : msg.priority === 'medium' ? 'rgba(245, 158, 11, 0.2)' : 'var(--border-color)'}`
                          }}>
                            {msg.priority.toUpperCase()}
                          </span>
                        )}
                        {msg.sentiment && (
                          <span style={{
                            fontSize: '9px',
                            fontWeight: '700',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: msg.sentiment === 'positive' ? 'var(--success-glow)' : msg.sentiment === 'negative' ? 'var(--danger-glow)' : 'var(--bg-tertiary)',
                            color: msg.sentiment === 'positive' ? 'var(--success)' : msg.sentiment === 'negative' ? 'var(--danger)' : 'var(--text-secondary)',
                            border: `1px solid ${msg.sentiment === 'positive' ? 'rgba(16, 185, 129, 0.2)' : msg.sentiment === 'negative' ? 'rgba(239, 68, 68, 0.2)' : 'var(--border-color)'}`
                          }}>
                            {msg.sentiment === 'positive' ? '😊 POSITIVE' : msg.sentiment === 'negative' ? '😠 NEGATIVE' : '😐 NEUTRAL'}
                          </span>
                        )}
                        {msg.spamScore !== undefined && msg.spamScore !== null && msg.spamScore > 0.5 && (
                          <span style={{
                            fontSize: '9px',
                            fontWeight: '700',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: 'var(--danger)',
                            border: '1px solid rgba(239, 68, 68, 0.3)'
                          }}>
                            🚨 SPAM: {Math.round(msg.spamScore * 100)}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* 3. Right Panel: Selected Message Detail */}
          <section className="detailsPane">
            {selectedMessage ? (
              <>
                <div className="detailsHeader">
                  <div className="detailsMeta">
                    <h1 className="detailsSubject">{selectedMessage.subject || 'No Subject'}</h1>
                    
                    <div className="detailsSenderRow">
                      <span className="detailsSenderName">{selectedMessage.name}</span>
                      <a href={`mailto:${selectedMessage.email}`} className="detailsSenderEmail">
                        &lt;{selectedMessage.email}&gt;
                      </a>
                    </div>
                    <span className="detailsTime" suppressHydrationWarning>
                      Received on {new Date(selectedMessage.createdAt).toLocaleString()}
                    </span>

                    {/* Optional AI Telemetry Metadata */}
                    {((selectedMessage.spamScore !== undefined && selectedMessage.spamScore !== null) || selectedMessage.priority || selectedMessage.sentiment) && (
                      <div style={{
                        display: 'flex',
                        gap: '16px',
                        marginTop: '12px',
                        background: 'var(--bg-glass-hover)',
                        border: '1px solid var(--border-color)',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        width: 'fit-content'
                      }}>
                        {selectedMessage.priority && (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Priority</span>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: '700',
                              color: selectedMessage.priority === 'high' ? 'var(--danger)' : selectedMessage.priority === 'medium' ? 'var(--warning)' : 'var(--text-secondary)'
                            }}>
                              {selectedMessage.priority.toUpperCase()}
                            </span>
                          </div>
                        )}
                        {selectedMessage.sentiment && (
                          <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border-color)', paddingLeft: '16px' }}>
                            <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sentiment</span>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: '700',
                              color: selectedMessage.sentiment === 'positive' ? 'var(--success)' : selectedMessage.sentiment === 'negative' ? 'var(--danger)' : 'var(--text-secondary)'
                            }}>
                              {selectedMessage.sentiment === 'positive' ? '😊 Positive' : selectedMessage.sentiment === 'negative' ? '😠 Negative' : '😐 Neutral'}
                            </span>
                          </div>
                        )}
                        {selectedMessage.spamScore !== undefined && selectedMessage.spamScore !== null && (
                          <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border-color)', paddingLeft: '16px' }}>
                            <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Spam Score</span>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: '700',
                              color: selectedMessage.spamScore > 0.5 ? 'var(--danger)' : 'var(--success)'
                            }}>
                              {Math.round(selectedMessage.spamScore * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="detailsActions">
                    <button 
                      className="actionButton"
                      onClick={() => handleToggleArchive(selectedMessage)}
                      title={selectedMessage.status === 'archived' ? 'Move back to Inbox' : 'Archive message'}
                    >
                      <Archive size={16} />
                      <span>{selectedMessage.status === 'archived' ? 'Unarchive' : 'Archive'}</span>
                    </button>
                    
                    <a 
                      href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject || 'Inquiry from portfolio')}`}
                      className="actionButton actionButtonAccent"
                      title="Reply via Email"
                    >
                      <Send size={16} />
                      <span>Reply</span>
                    </a>

                    <button 
                      className="actionButton actionButtonDanger"
                      onClick={() => handleDelete(selectedMessage)}
                      title="Delete permanently"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="detailsContent">
                  <div className="messageBody">
                    {selectedMessage.message}
                  </div>
                </div>
              </>
            ) : (
              <div className="emptyState">
                <Inbox className="emptyIcon" size={64} />
                <h3>No message selected</h3>
                <p>Select a contact submission from the inbox column to view details, archive, or reply.</p>
              </div>
            )}
          </section>
        </>
      ) : (
        /* Settings & Integration View */
        <section className="settingsPane">
          <h2 className="settingsTitle">
            <Settings size={28} style={{ color: 'var(--accent)' }} />
            <span>Settings & Integration Guide</span>
          </h2>

          <div className="statsGrid">
            <div className="statCard">
              <div className="statIconWrapper">
                <Inbox size={20} style={{ color: 'var(--accent-light)' }} />
              </div>
              <div className="statText">
                <span className="statValue">{messages.length}</span>
                <span className="statLabel">Total Submissions</span>
              </div>
            </div>

            <div className="statCard">
              <div className="statIconWrapper">
                <AlertCircle size={20} style={{ color: 'var(--warning)' }} />
              </div>
              <div className="statText">
                <span className="statValue">{unreadCount}</span>
                <span className="statLabel">Unread Messages</span>
              </div>
            </div>

            <div className="statCard">
              <div className="statIconWrapper">
                <CheckSquare size={20} style={{ color: 'var(--success)' }} />
              </div>
              <div className="statText">
                <span className="statValue">
                  {[project.discordEnabled, project.telegramEnabled, project.emailEnabled].filter(Boolean).length} / 3
                </span>
                <span className="statLabel">Active Channels</span>
              </div>
            </div>
          </div>

          <div className="settingsSection">
            <h3 className="sectionTitle">
              <Sparkles size={18} style={{ color: 'var(--accent-light)' }} />
              <span>Step 1: Connect your Portfolio Website</span>
            </h3>
            <p className="sectionDesc">
              Send a JSON POST request to your Strata endpoint when a user submits your portfolio's contact form.
            </p>
            
            <div className="codeBlockHeader">
              <span>portfolio-contact.js</span>
              <button 
                onClick={() => copyToClipboard(integrationSnippet, false)}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {copiedCode ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="codeBlock">{integrationSnippet}</pre>
          </div>

          <div className="settingsSection">
            <h3 className="sectionTitle">
              <Settings size={18} style={{ color: 'var(--accent-light)' }} />
              <span>Step 2: Configure Notification Routing Channels</span>
            </h3>
            <p className="sectionDesc">
              Enable channels and enter credentials to route incoming submissions dynamically.
            </p>

            {/* A. Discord Routing Channel */}
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>Discord Webhook Alerts</span>
                </div>
                <label className="switch" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    checked={discordEnabled}
                    onChange={(e) => setDiscordEnabled(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {discordEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>
              
              {discordEnabled && (
                <div className="configField">
                  <label className="configLabel">Webhook URL</label>
                  <input 
                    type="text" 
                    placeholder="https://discord.com/api/webhooks/..." 
                    className="configInput" 
                    value={discordWebhook}
                    onChange={(e) => setDiscordWebhook(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* B. Telegram Routing Channel */}
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>Telegram Bot Alerts</span>
                </div>
                <label className="switch" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    checked={telegramEnabled}
                    onChange={(e) => setTelegramEnabled(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {telegramEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>
              
              {telegramEnabled && (
                <div className="gridTwoCol">
                  <div className="configField">
                    <label className="configLabel">Bot API Token</label>
                    <input 
                      type="password" 
                      placeholder="123456789:ABCdefGhIJKlmNoPQRsT..." 
                      className="configInput" 
                      value={telegramToken}
                      onChange={(e) => setTelegramToken(e.target.value)}
                    />
                  </div>
                  <div className="configField">
                    <label className="configLabel">Chat Target ID</label>
                    <input 
                      type="text" 
                      placeholder="-100123456789" 
                      className="configInput" 
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* C. Email Routing Channel */}
            <div style={{ paddingBottom: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>Email SMTP Alerts</span>
                </div>
                <label className="switch" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    checked={emailEnabled}
                    onChange={(e) => setEmailEnabled(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {emailEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>
              
              {emailEnabled && (
                <div className="configField">
                  <label className="configLabel">Recipient Email Address</label>
                  <input 
                    type="email" 
                    placeholder="my-alerts@domain.com" 
                    className="configInput" 
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Save Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <button 
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="actionButton actionButtonAccent"
                style={{ minWidth: '140px' }}
              >
                {isSavingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </section>
      )}
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
