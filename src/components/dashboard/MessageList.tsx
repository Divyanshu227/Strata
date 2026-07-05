import React from 'react';
import { Search } from 'lucide-react';
import { Message } from '@/types/dashboard';

interface MessageListProps {
  messages: Message[];
  filteredMessages: Message[];
  isOffline: boolean;
  isSyncing: boolean;
  fetchLatestMessages: () => Promise<boolean>;
  triggerToast: (msg: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: 'all' | 'unread' | 'archived';
  setActiveTab: (tab: 'all' | 'unread' | 'archived') => void;
  setSelectedMessageId: (id: string | null) => void;
  selectedMessageId: string | null;
  totalInbox: number;
  unreadCount: number;
  archivedCount: number;
}

export default function MessageList({
  messages,
  filteredMessages,
  isOffline,
  isSyncing,
  fetchLatestMessages,
  triggerToast,
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  setSelectedMessageId,
  selectedMessageId,
  totalInbox,
  unreadCount,
  archivedCount
}: MessageListProps) {
  
  const formatFriendlyDate = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
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
  );
}
