import React from 'react';
import { Mail, ChevronRight, ChevronLeft, Inbox, Settings, LogOut, Plus } from 'lucide-react';
import { UserData, ProjectData } from '@/types/dashboard';

interface SidebarProps {
  initialUser: UserData;
  projects: ProjectData[];
  project: ProjectData;
  setProject: (project: ProjectData) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  activeView: 'inbox' | 'settings';
  setActiveView: (view: 'inbox' | 'settings') => void;
  unreadCount: number;
  setIsCreateModalOpen: (open: boolean) => void;
  handleLogout: () => void;
}

export default function Sidebar({
  initialUser,
  projects,
  project,
  setProject,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  activeView,
  setActiveView,
  unreadCount,
  setIsCreateModalOpen,
  handleLogout
}: SidebarProps) {
  return (
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
          onClick={handleLogout}
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
  );
}
