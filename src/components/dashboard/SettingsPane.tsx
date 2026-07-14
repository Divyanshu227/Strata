import React, { useState } from 'react';
import { Settings, Inbox, AlertCircle, CheckSquare, Key, Check, Copy, Eye, EyeOff, Bot, Code } from 'lucide-react';
import { UserData, ProjectData, Message } from '@/types/dashboard';

interface SettingsPaneProps {
  user: UserData;
  project: ProjectData;
  messages: Message[];
  unreadCount: number;
  discordEnabled: boolean;
  setDiscordEnabled: (v: boolean) => void;
  discordWebhook: string;
  setDiscordWebhook: (v: string) => void;
  telegramEnabled: boolean;
  setTelegramEnabled: (v: boolean) => void;
  telegramToken: string;
  setTelegramToken: (v: string) => void;
  telegramChatId: string;
  setTelegramChatId: (v: string) => void;
  emailEnabled: boolean;
  setEmailEnabled: (v: boolean) => void;
  emailRecipient: string;
  setEmailRecipient: (v: string) => void;
  handleSaveSettings: () => void;
  isSavingSettings: boolean;
  triggerToast: (msg: string) => void;
}

export default function SettingsPane({
  user,
  project,
  messages,
  unreadCount,
  discordEnabled,
  setDiscordEnabled,
  discordWebhook,
  setDiscordWebhook,
  telegramEnabled,
  setTelegramEnabled,
  telegramToken,
  setTelegramToken,
  telegramChatId,
  setTelegramChatId,
  emailEnabled,
  setEmailEnabled,
  emailRecipient,
  setEmailRecipient,
  handleSaveSettings,
  isSavingSettings,
  triggerToast
}: SettingsPaneProps) {
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [showApiKey, setShowApiKey] = useState(false);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [id]: true }));
    setTimeout(() => setCopiedStates(prev => ({ ...prev, [id]: false })), 2000);
    triggerToast('Copied to clipboard!');
  };

  const endpointUrl = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/messages`;
  
  const integrationSnippet = `// API call using Fetch
async function sendContactMessage(name, email, subject, message) {
  const response = await fetch('${endpointUrl}', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-project-id': '${project.id}',
      'Authorization': 'Bearer ${project.apiKey}'
    },
    body: JSON.stringify({ name, email, subject, message })
  });
  return response.json();
}`;

  const curlSnippet = `curl -X POST ${endpointUrl} \\
  -H "Content-Type: application/json" \\
  -H "x-project-id: ${project.id}" \\
  -H "Authorization: Bearer ${project.apiKey}" \\
  -d '{"name":"John","email":"john@test.com","subject":"Hello","message":"Hi there"}'`;

  const jsonInput = `{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Hello",
  "message": "I'd like to work with you."
}`;

  const jsonOutput = `{
  "success": true,
  "message": "Message sent successfully"
}`;

  const aiPrompt = `I have a website and I want to integrate Strata as my contact form backend. Please write the necessary code to send form submissions to my Strata endpoint.

API DETAILS:
- Endpoint: POST ${endpointUrl}
- Required Headers: 
  - "Content-Type": "application/json"
  - "x-project-id": "YOUR_PROJECT_ID"
  - "Authorization": "Bearer YOUR_API_KEY"

PAYLOAD STRUCTURE (JSON):
{
  "name": "string (required)",
  "email": "string (required)",
  "subject": "string (optional)",
  "message": "string (required)"
}

EXPECTED SUCCESS RESPONSE (200 OK):
{
  "success": true,
  "message": "Message sent successfully"
}

Please implement the API call, handling loading states, success messages, and error states gracefully. Remember to keep the API keys out of client-side code if possible, or use environment variables.`;

  return (
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
          <Key size={18} style={{ color: 'var(--accent-light)' }} />
          <span>Credentials</span>
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>API Endpoint</span>
              <span style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>{endpointUrl}</span>
            </div>
            <button onClick={() => copyToClipboard(endpointUrl, 'url')} className="actionButton" style={{ padding: '6px' }}>
              {copiedStates['url'] ? <Check size={16} style={{ color: 'var(--success)' }} /> : <Copy size={16} />}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Project ID</span>
              <span style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>{project.id}</span>
            </div>
            <button onClick={() => copyToClipboard(project.id, 'projectId')} className="actionButton" style={{ padding: '6px' }}>
              {copiedStates['projectId'] ? <Check size={16} style={{ color: 'var(--success)' }} /> : <Copy size={16} />}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>API Key (Bearer Token)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                  {showApiKey ? project.apiKey : '•'.repeat(Math.min(project.apiKey.length, 32))}
                </span>
                <button onClick={() => setShowApiKey(!showApiKey)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <button onClick={() => copyToClipboard(project.apiKey, 'apiKey')} className="actionButton" style={{ padding: '6px' }}>
              {copiedStates['apiKey'] ? <Check size={16} style={{ color: 'var(--success)' }} /> : <Copy size={16} />}
            </button>
          </div>

        </div>
      </div>

      <div className="settingsSection">
        <h3 className="sectionTitle">
          <Bot size={18} style={{ color: 'var(--accent-light)' }} />
          <span>AI Agent Prompt (Quick Start)</span>
        </h3>
        <p className="sectionDesc">
          Building your site with AI? Just copy this prompt into Cursor, ChatGPT, or GitHub Copilot and it will instantly build a working React/Next.js contact form integrated with your Strata backend.
        </p>
        <div className="codeBlockHeader" style={{ background: 'var(--accent-light)', color: '#000' }}>
          <span style={{ fontWeight: 600 }}>Prompt for AI Assistant</span>
          <button onClick={() => copyToClipboard(aiPrompt, 'prompt')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            {copiedStates['prompt'] ? <Check size={14} /> : <Copy size={14} />}
            <span>{copiedStates['prompt'] ? 'Copied' : 'Copy Prompt'}</span>
          </button>
        </div>
        <pre className="codeBlock" style={{ whiteSpace: 'pre-wrap', borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 'none' }}>{aiPrompt}</pre>
      </div>

      <div className="settingsSection">
        <h3 className="sectionTitle">
          <Code size={18} style={{ color: 'var(--accent-light)' }} />
          <span>API Integration Guide</span>
        </h3>
        <p className="sectionDesc">
          Send a JSON POST request to your Strata endpoint when a user submits your form.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
          <div>
            <div className="codeBlockHeader">
              <span>Sample Request (Fetch)</span>
              <button onClick={() => copyToClipboard(integrationSnippet, 'fetch')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {copiedStates['fetch'] ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
              </button>
            </div>
            <pre className="codeBlock" style={{ fontSize: '11px' }}>{integrationSnippet}</pre>
          </div>
          
          <div>
            <div className="codeBlockHeader">
              <span>Sample Request (cURL)</span>
              <button onClick={() => copyToClipboard(curlSnippet, 'curl')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {copiedStates['curl'] ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
              </button>
            </div>
            <pre className="codeBlock" style={{ fontSize: '11px', whiteSpace: 'pre-wrap' }}>{curlSnippet}</pre>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
          <div>
            <div className="codeBlockHeader">
              <span>Expected Input (JSON)</span>
              <button onClick={() => copyToClipboard(jsonInput, 'input')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {copiedStates['input'] ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
              </button>
            </div>
            <pre className="codeBlock" style={{ fontSize: '11px' }}>{jsonInput}</pre>
          </div>
          
          <div>
            <div className="codeBlockHeader">
              <span>Success Output (JSON)</span>
              <button onClick={() => copyToClipboard(jsonOutput, 'output')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {copiedStates['output'] ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
              </button>
            </div>
            <pre className="codeBlock" style={{ fontSize: '11px' }}>{jsonOutput}</pre>
          </div>
        </div>
      </div>

      <div className="settingsSection">
        <h3 className="sectionTitle">
          <Settings size={18} style={{ color: 'var(--accent-light)' }} />
          <span>Configure Notification Routing Channels</span>
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
            <div className="configField" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="configLabel">Webhook URL</label>
              <input 
                type="text" 
                placeholder="https://discord.com/api/webhooks/..." 
                className="configInput" 
                value={discordWebhook}
                onChange={(e) => setDiscordWebhook(e.target.value)}
              />
              <details style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>How to get a Discord Webhook URL?</summary>
                <ol style={{ paddingLeft: '20px', marginTop: '12px', marginBottom: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>Open your Discord server and click on the server name to open the menu.</li>
                  <li>Select <strong>Server Settings</strong>.</li>
                  <li>In the left sidebar, navigate to <strong>Integrations</strong>.</li>
                  <li>Click on <strong>Webhooks</strong> and then <strong>New Webhook</strong>.</li>
                  <li>Customize the webhook&apos;s name and choose the channel where notifications should be sent.</li>
                  <li>Click the <strong>Copy Webhook URL</strong> button.</li>
                  <li>Paste the URL in the input field above and click <strong>Save Settings</strong> at the bottom of the page.</li>
                </ol>
              </details>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
              <details style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>How to get a Telegram Bot Token and Chat ID?</summary>
                <ol style={{ paddingLeft: '20px', marginTop: '12px', marginBottom: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>Open Telegram and search for <strong>@BotFather</strong>. Start a chat and type <code>/newbot</code>.</li>
                  <li>Follow the prompts to name your bot and choose a username. BotFather will give you a <strong>Bot API Token</strong>. Copy and paste it above.</li>
                  <li>Create a new Telegram group or channel where you want to receive notifications, and add your newly created bot to it.</li>
                  <li>Send a test message (e.g., &quot;hello&quot;) in the group.</li>
                  <li>Open a browser tab and go to <code>https://api.telegram.org/bot&lt;YourBotToken&gt;/getUpdates</code> (replace &lt;YourBotToken&gt; with your actual token).</li>
                  <li>Look for <code>&quot;chat&quot;: &#123;&quot;id&quot;: -123456789&#125;</code> in the JSON response. Copy the number into the <strong>Chat Target ID</strong> field above.</li>
                  <li>Click <strong>Save Settings</strong> at the bottom of the page.</li>
                </ol>
              </details>
            </div>
          )}
        </div>

        {/* C. Email Routing Channel */}
        <div style={{ paddingBottom: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>Email SMTP Alerts</span>
            </div>
            <label className="switch" style={{ display: 'flex', alignItems: 'center', cursor: user.emailVerified ? 'pointer' : 'not-allowed', gap: '8px' }}>
              <input 
                type="checkbox" 
                checked={emailEnabled}
                onChange={(e) => user.emailVerified && setEmailEnabled(e.target.checked)}
                disabled={!user.emailVerified}
                title={!user.emailVerified ? 'Please verify your email address first.' : ''}
                style={{ cursor: user.emailVerified ? 'pointer' : 'not-allowed' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {emailEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>
          
          {emailEnabled && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="configField">
                <label className="configLabel" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Recipient Email Address
                  <span style={{ fontSize: '10px', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-muted)' }}>Locked for Security</span>
                </label>
                <input 
                  type="email" 
                  className="configInput" 
                  value={emailRecipient}
                  disabled
                  style={{ opacity: 0.7, cursor: 'not-allowed', background: 'var(--bg-tertiary)' }}
                  title="Emails can only be routed to the registered account owner's email address to prevent open-relay abuse."
                />
              </div>
              <details style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>About Email Notifications</summary>
                <ul style={{ paddingLeft: '20px', marginTop: '12px', marginBottom: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>To prevent spam and open-relay abuse, email notifications can only be routed to the email address registered with this account.</li>
                  <li>Ensure your email address is verified to enable this feature.</li>
                  <li>Once enabled, any new form submissions will be automatically forwarded to your inbox.</li>
                  <li>Check your spam or junk folder if you don&apos;t see the notifications, and mark them as &quot;Not Spam&quot; to ensure future delivery.</li>
                </ul>
              </details>
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
  );
}
