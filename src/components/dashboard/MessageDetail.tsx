import React from 'react';
import { Inbox, Archive, Trash2, Send } from 'lucide-react';
import { Message } from '@/types/dashboard';

interface MessageDetailProps {
  selectedMessage: Message | undefined;
  handleToggleArchive: (msg: Message) => void;
  handleDelete: (msg: Message) => void;
}

export default function MessageDetail({
  selectedMessage,
  handleToggleArchive,
  handleDelete
}: MessageDetailProps) {
  if (!selectedMessage) {
    return (
      <section className="detailsPane">
        <div className="emptyState">
          <Inbox className="emptyIcon" size={64} />
          <h3>No message selected</h3>
          <p>Select a contact submission from the inbox column to view details, archive, or reply.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="detailsPane">
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
    </section>
  );
}
