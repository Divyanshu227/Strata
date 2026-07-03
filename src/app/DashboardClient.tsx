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
  ExternalLink, 
  AlertCircle, 
  Sparkles,
  Send,
  CheckSquare
} from 'lucide-react';
import { 
  markMessageAsRead, 
  toggleMessageArchive, 
  deleteMessage,
  triggerManualSync
} from './actions';

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: string;
  createdAt: string | Date;
}

interface DashboardClientProps {
  initialMessages: Message[];
  apiToken: string;
  discordConfigured: boolean;
  isOffline: boolean;
}

export default function DashboardClient({ 
  initialMessages, 
  apiToken, 
  discordConfigured,
  isOffline
}: DashboardClientProps) {
  // Client state
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'archived'>('all');
  const [activeView, setActiveView] = useState<'inbox' | 'settings'>('inbox');
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [isPending, startTransition] = useTransition();

  // Sync state if initialMessages changes (Next.js server-side revalidation updates this)
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const selectedMessage = messages.find(m => m.id === selectedMessageId);

  // Trigger mark as read when a message is selected
  useEffect(() => {
    if (selectedMessage && selectedMessage.status === 'unread') {
      // Optimistic update
      setMessages(prev => 
        prev.map(m => m.id === selectedMessage.id ? { ...m, status: 'read' } : m)
      );
      
      startTransition(async () => {
        await markMessageAsRead(selectedMessage.id);
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
    
    // Optimistic update
    setMessages(prev => 
      prev.map(m => m.id === msg.id ? { ...m, status: newStatus } : m)
    );
    
    // Clear selection if we move away from archived tab or vice-versa
    if (activeTab === 'archived' && newStatus !== 'archived') {
      setSelectedMessageId(null);
    } else if (activeTab === 'unread' && newStatus === 'archived') {
      setSelectedMessageId(null);
    }

    startTransition(async () => {
      await toggleMessageArchive(msg.id, msg.status);
      triggerToast(isCurrentlyArchived ? 'Message moved to Inbox' : 'Message archived');
    });
  };

  // Action: Delete Message
  const handleDelete = async (msg: Message) => {
    if (confirm(`Are you sure you want to delete the message from ${msg.name}?`)) {
      // Optimistic update
      setMessages(prev => prev.filter(m => m.id !== msg.id));
      setSelectedMessageId(null);

      startTransition(async () => {
        await deleteMessage(msg.id);
        triggerToast('Message deleted permanently');
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
    // 1. Tab filter
    if (activeTab === 'unread' && msg.status !== 'unread') return false;
    if (activeTab === 'archived' && msg.status !== 'archived') return false;
    if (activeTab === 'all' && msg.status === 'archived') return false; // Hide archived by default in "All" inbox tab

    // 2. Search query filter
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
  const endpoint = '${process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')}/api/messages';
  const apiToken = '${apiToken}';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiToken
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
      <aside className="sidebar">
        <div className="logoArea">
          <Mail className="logoIcon" size={24} />
          <span className="logoText">MailBox</span>
        </div>

        <nav className="sidebarMenu">
          <button 
            className={`menuItem ${activeView === 'inbox' ? 'menuItemActive' : ''}`}
            onClick={() => setActiveView('inbox')}
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
          >
            <div className="menuItemInner">
              <Settings size={18} />
              <span>Integration & Settings</span>
            </div>
          </button>
        </nav>

        <div className="sidebarFooter">
          <div className="apiTokenCard">
            <span className="apiTokenTitle">
              <Key size={14} />
              <span>API Authorization Token</span>
            </span>
            <span className="apiTokenValue">
              <span style={{ fontSize: '11px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '170px' }}>
                {apiToken === 'NOT_CONFIGURED' ? 'Configure in .env.local' : apiToken}
              </span>
              {apiToken !== 'NOT_CONFIGURED' && (
                <button 
                  onClick={() => copyToClipboard(apiToken, true)}
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title="Copy Token"
                >
                  {copiedToken ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                </button>
              )}
            </span>
          </div>
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
                      }}></span>
                      <span>Live Sync</span>
                    </div>
                  )}
                  
                  <button 
                    onClick={async () => {
                      triggerToast('Synchronizing databases...');
                      const ok = await triggerManualSync();
                      triggerToast(ok ? 'Sync completed successfully!' : 'Sync failed (Offline fallback active)');
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
                    title="Synchronize local SQLite cache with Supabase"
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
              {filteredMessages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                  <p style={{ fontSize: '14px', fontWeight: '500' }}>No messages found</p>
                  <p style={{ fontSize: '12px', marginTop: '4px', color: 'var(--text-muted)' }}>
                    {searchQuery ? 'Try a different search query' : 'Your mailbox is empty.'}
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
                    <p className="cardPreview">{msg.message}</p>
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
                  {discordConfigured ? 'Active' : 'Inactive'}
                </span>
                <span className="statLabel">Discord Webhook</span>
              </div>
            </div>
          </div>

          <div className="settingsSection">
            <h3 className="sectionTitle">
              <Sparkles size={18} style={{ color: 'var(--accent-light)' }} />
              <span>Step 1: Connect your Portfolio Website</span>
            </h3>
            <p className="sectionDesc">
              Send a JSON POST request to your MailBox endpoint when a user submits your portfolio's contact form.
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
              <AlertCircle size={18} style={{ color: 'var(--warning)' }} />
              <span>Step 2: Environment Variables configuration</span>
            </h3>
            <p className="sectionDesc">
              Configure your project parameters inside your local environment configuration file: [ .env.local ]
            </p>

            <div className="configField">
              <label className="configLabel">API Token (Authorization Header)</label>
              <input 
                type="text" 
                readOnly 
                className="configInput" 
                value={`API_TOKEN="${apiToken}"`} 
              />
            </div>

            <div className="configField">
              <label className="configLabel">Discord Webhook Notification URL</label>
              <input 
                type="text" 
                placeholder='DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."' 
                className="configInput" 
                readOnly
                value={discordConfigured ? 'DISCORD_WEBHOOK_URL="[CONFIGURED_IN_ENV]"' : 'DISCORD_WEBHOOK_URL=""'}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                {discordConfigured 
                  ? '✅ Active: You will receive instant notifications in your Discord channel whenever someone submits a message.'
                  : '⚠️ Inactive: Set the DISCORD_WEBHOOK_URL inside .env.local to enable real-time notifications.'
                }
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
