'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Zap, ShieldCheck, Code, MessageSquare, ArrowRight, Activity, Play } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      color: '#fff',
      fontFamily: 'var(--font-sans)',
      position: 'relative'
    }}>
      {/* Background Effects */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '20%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 70%)',
        filter: 'blur(60px)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        top: '40%',
        right: '-10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, rgba(0,0,0,0) 70%)',
        filter: 'blur(60px)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />

      {/* Navigation */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 48px',
        background: scrolled ? 'rgba(10, 10, 15, 0.8)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid transparent',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        transition: 'all 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            color: '#fff',
            padding: '8px',
            borderRadius: '10px',
            boxShadow: '0 0 20px rgba(99,102,241,0.4)'
          }}>
            <Sparkles size={20} />
          </div>
          <span style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px' }}>Strata</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button
            onClick={() => router.push('/login')}
            style={{
              background: 'transparent',
              color: '#e2e8f0',
              border: 'none',
              padding: '8px 20px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#e2e8f0'}
          >
            Log In
          </button>
          <button
            onClick={() => router.push('/login')}
            style={{
              background: '#fff',
              color: '#000',
              padding: '10px 24px',
              borderRadius: '30px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              border: 'none',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(255,255,255,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Get Started Free
          </button>
        </div>
      </nav>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up {
          animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .delay-4 { animation-delay: 0.4s; }
      `}} />

      {/* Hero Section */}
      <section style={{
        padding: '60px 24px 60px',
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '40px',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Video Showcase removed - moved to modal */}        <div style={{ textAlign: 'center', maxWidth: '800px' }} className="fade-in-up delay-1">
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#cbd5e1',
            padding: '6px 16px',
            borderRadius: '30px',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '24px',
            backdropFilter: 'blur(10px)'
          }}>
            <Activity size={14} color="#6366f1" />
            <span>Strata v1.0 is now live — Experience lightning fast routing</span>
          </div>
          
          <h1 style={{
            fontSize: '72px',
            fontWeight: '800',
            lineHeight: '1.05',
            letterSpacing: '-2.5px',
            margin: '0 0 24px 0',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #9ca3af 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.5))'
          }}>
            The Universal Message <br/> Routing Gateway
          </h1>
          
          <p style={{
            fontSize: '20px',
            color: '#94a3b8',
            lineHeight: '1.6',
            maxWidth: '640px',
            margin: '0 auto',
            fontWeight: '400'
          }}>
            Consolidate your application's contact forms and notifications. Route messages seamlessly to Email, Discord, and Telegram with real-time Kafka syncing.
          </p>
          
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '40px' }} className="fade-in-up delay-2">
            <button
              onClick={() => router.push('/login')}
              style={{
                padding: '16px 32px',
                fontSize: '16px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: '0 10px 30px rgba(99, 102, 241, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(99, 102, 241, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(99, 102, 241, 0.3)';
              }}
            >
              <span>Start Routing Now</span>
              <ArrowRight size={18} />
            </button>

            <button
              onClick={() => setShowVideo(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '16px 32px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              <Play size={18} fill="currentColor" />
              <span>Watch Demo</span>
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '16px 32px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              <Code size={18} />
              <span>View Source</span>
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{
        padding: '100px 24px',
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        position: 'relative',
        zIndex: 10
      }}>
        <FeatureCard 
          icon={<MessageSquare size={24} />}
          title="Multi-Channel Delivery"
          desc="Instantly route incoming API messages to your preferred platform: Discord, Telegram, or Email via secure SMTP."
          delay="0.1s"
        />
        <FeatureCard 
          icon={<Zap size={24} />}
          title="Real-Time Kafka Sync"
          desc="Enterprise-grade message queuing powered by Aiven Kafka. Never drop a message during high traffic spikes."
          delay="0.2s"
        />
        <FeatureCard 
          icon={<ShieldCheck size={24} />}
          title="AI-Powered Analytics"
          desc="Automatically scan incoming messages for spam scores and sentiment priority using integrated AI models."
          delay="0.3s"
        />
        <FeatureCard 
          icon={<Code size={24} />}
          title="Seamless Developer API"
          desc="Drop-in REST endpoints that integrate in minutes with Next.js, React, or any backend architecture."
          delay="0.4s"
        />
      </section>
      
      {/* CTA Section */}
      <section style={{
        padding: '80px 24px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px',
          padding: '64px',
          maxWidth: '800px',
          margin: '0 auto',
          backdropFilter: 'blur(20px)'
        }}>
          <h2 style={{ fontSize: '40px', fontWeight: '800', marginBottom: '16px', letterSpacing: '-1px' }}>Ready to simplify your routing?</h2>
          <p style={{ color: '#94a3b8', fontSize: '18px', marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' }}>
            Join thousands of developers building the next generation of robust web applications.
          </p>
          <button
            onClick={() => router.push('/login')}
            style={{
              padding: '16px 40px',
              fontSize: '16px',
              fontWeight: '700',
              background: '#fff',
              color: '#000',
              border: 'none',
              borderRadius: '30px',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(255,255,255,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Create Free Account
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '48px 24px',
        textAlign: 'center',
        color: '#64748b',
        fontSize: '14px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            <Sparkles size={16} style={{ display: 'inline' }} />
          </div>
          <span style={{ fontWeight: '700', color: '#e2e8f0' }}>Strata</span>
        </div>
        © {new Date().getFullYear()} Strata Gateway. Built for modern developers.
      </footer>

      {/* Video Modal */}
      {showVideo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }} onClick={() => setShowVideo(false)}>
          <div style={{
            position: 'relative',
            width: '90%',
            maxWidth: '1100px',
            aspectRatio: '16/9',
            backgroundColor: '#000',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255,255,255,0.1)'
          }} onClick={(e) => e.stopPropagation()}>
            <video 
              autoPlay 
              controls
              playsInline 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            >
              <source src={process.env.NEXT_PUBLIC_HERO_VIDEO_URL || ''} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <button 
              onClick={() => setShowVideo(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                backdropFilter: 'blur(4px)',
                zIndex: 10,
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FeatureCard({ icon, title, desc, delay }: { icon: React.ReactNode, title: string, desc: string, delay: string }) {
  return (
    <div 
      className="fade-in-up"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '32px',
        borderRadius: '20px',
        transition: 'all 0.3s ease',
        cursor: 'default',
        backdropFilter: 'blur(10px)',
        animationDelay: delay
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(168,85,247,0.1) 100%)',
        color: '#a855f7',
        width: '56px',
        height: '56px',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px',
        border: '1px solid rgba(99,102,241,0.2)'
      }}>
        {icon}
      </div>
      <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px', color: '#e2e8f0' }}>{title}</h3>
      <p style={{ color: '#94a3b8', lineHeight: '1.6', fontSize: '15px' }}>{desc}</p>
    </div>
  );
}
