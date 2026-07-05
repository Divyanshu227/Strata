'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Zap, ShieldCheck, Code, MessageSquare, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'radial-gradient(circle at 50% 0%, #1a1a2e 0%, var(--bg-primary) 100%)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
      overflowX: 'hidden'
    }}>
      {/* Navigation */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px 48px',
        borderBottom: '1px solid var(--border-color)',
        background: 'rgba(10, 10, 16, 0.6)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'var(--accent-glow)',
            color: 'var(--accent-light)',
            padding: '8px',
            borderRadius: '8px',
            border: '1px solid rgba(99, 102, 241, 0.2)'
          }}>
            <Sparkles size={20} />
          </div>
          <span style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>Strata</span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button
            onClick={() => router.push('/login')}
            style={{
              background: 'transparent',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              padding: '8px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            Log In
          </button>
          <button
            onClick={() => router.push('/login')}
            className="actionButton actionButtonAccent"
            style={{ padding: '8px 20px', fontWeight: '700' }}
          >
            Get Started Free
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        padding: '120px 24px',
        textAlign: 'center',
        maxWidth: '900px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          color: 'var(--accent-light)',
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: '600',
          marginBottom: '16px'
        }}>
          <Zap size={14} />
          <span>v1.0 is now live</span>
        </div>
        
        <h1 style={{
          fontSize: '64px',
          fontWeight: '800',
          lineHeight: '1.1',
          letterSpacing: '-2px',
          margin: 0,
          background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          The Universal Message <br/> Routing Gateway
        </h1>
        
        <p style={{
          fontSize: '20px',
          color: 'var(--text-secondary)',
          lineHeight: '1.6',
          maxWidth: '600px',
          margin: '0 auto 16px'
        }}>
          Consolidate your application's contact forms and notifications. Route messages seamlessly to Email, Discord, and Telegram with real-time Kafka syncing.
        </p>
        
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <button
            onClick={() => router.push('/login')}
            className="actionButton actionButtonAccent"
            style={{ padding: '16px 32px', fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>Start Routing Now</span>
            <ArrowRight size={18} />
          </button>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              padding: '16px 32px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              textDecoration: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Code size={18} />
            <span>View Source</span>
          </a>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{
        padding: '64px 24px 120px',
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px'
      }}>
        <FeatureCard 
          icon={<MessageSquare size={24} />}
          title="Multi-Channel Delivery"
          desc="Instantly route incoming API messages to your preferred platform: Discord, Telegram, or Email via secure SMTP."
        />
        <FeatureCard 
          icon={<Zap size={24} />}
          title="Real-Time Kafka Sync"
          desc="Enterprise-grade message queuing powered by Aiven Kafka. Never drop a message during high traffic spikes."
        />
        <FeatureCard 
          icon={<ShieldCheck size={24} />}
          title="AI-Powered Analytics"
          desc="Automatically scan incoming messages for spam scores and sentiment priority using integrated AI models."
        />
        <FeatureCard 
          icon={<Code size={24} />}
          title="Seamless Developer API"
          desc="Drop-in REST endpoints that integrate in minutes with Next.js, React, or any backend architecture."
        />
      </section>
      
      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '48px 24px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '14px'
      }}>
        © {new Date().getFullYear()} Strata. Built for Developers.
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div style={{
      background: 'var(--bg-glass)',
      border: '1px solid var(--border-color)',
      padding: '32px',
      borderRadius: '16px',
      transition: 'all 0.3s ease',
      cursor: 'default'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
      e.currentTarget.style.boxShadow = '0 10px 30px rgba(99, 102, 241, 0.1)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.borderColor = 'var(--border-color)';
      e.currentTarget.style.boxShadow = 'none';
    }}
    >
      <div style={{
        background: 'var(--bg-tertiary)',
        color: 'var(--accent-light)',
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
        border: '1px solid var(--border-color)'
      }}>
        {icon}
      </div>
      <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '15px' }}>{desc}</p>
    </div>
  );
}
