'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Shield, User, Globe, ArrowRight, ArrowLeft, Key, Sparkles, Check, AlertCircle } from 'lucide-react';
import { registerUser, loginUser } from './actions';

export default function AuthForm() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Registration Form States
  const [registerStep, setRegisterStep] = useState(1);
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [platformName, setPlatformName] = useState('');
  const [platformUrl, setPlatformUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Login Form States
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Status and suggestions
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);

  // Automatically suggest a username when the ownerName changes in Step 1
  useEffect(() => {
    if (ownerName.trim() && !username) {
      const suggested = ownerName
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      setUsername(suggested);
    }
  }, [ownerName]);

  const handleNextStep = () => {
    setErrorMsg(null);
    if (registerStep === 1) {
      if (!ownerName.trim() || !email.trim() || !platformName.trim() || !platformUrl.trim()) {
        setErrorMsg('Please fill in all profile and platform fields.');
        return;
      }
      if (!email.includes('@')) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
      setRegisterStep(2);
    } else if (registerStep === 2) {
      if (!username.trim()) {
        setErrorMsg('Please choose a username.');
        return;
      }
      if (!/^[a-z0-9_]+$/.test(username.toLowerCase())) {
        setErrorMsg('Username must contain only letters, numbers, and underscores.');
        return;
      }
      setRegisterStep(3);
    }
  };

  const handleBackStep = () => {
    setErrorMsg(null);
    setRegisterStep(prev => Math.max(1, prev - 1));
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    setUsernameSuggestions([]);

    try {
      const response = await registerUser({
        name: ownerName,
        email,
        username,
        password: password.trim() || undefined, // leaves blank to get 12345678
        platformName,
        platformUrl
      });

      if (response.success) {
        window.location.reload();
      } else {
        if (response.error === 'username_taken' && response.recommendations) {
          setErrorMsg('That username is already taken. Please choose one of our recommendations below or write another.');
          setUsernameSuggestions(response.recommendations);
          setRegisterStep(2); // kick back to username step if taken
        } else {
          setErrorMsg(response.message || 'An error occurred during registration.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Server connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const response = await loginUser({
        identifier: loginIdentifier,
        password: loginPassword
      });

      if (response.success) {
        window.location.reload();
      } else {
        setErrorMsg(response.message || 'Invalid username/email or password.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Server connection failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100vw',
      background: 'radial-gradient(circle at 50% 50%, #181824 0%, var(--bg-primary) 100%)',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-color)',
        backdropFilter: 'blur(16px)',
        borderRadius: '16px',
        padding: '36px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        transition: 'all 0.3s ease'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--accent-glow)',
            color: 'var(--accent-light)',
            padding: '12px',
            borderRadius: '12px',
            marginBottom: '16px',
            border: '1px solid rgba(99, 102, 241, 0.2)'
          }}>
            <Sparkles size={28} />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.75px', marginBottom: '6px' }}>Strata</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Universal Communication & Message Routing Gateway
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          padding: '4px',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <button
            onClick={() => { setActiveTab('login'); setErrorMsg(null); }}
            style={{
              flex: 1,
              background: activeTab === 'login' ? 'var(--bg-tertiary)' : 'transparent',
              color: activeTab === 'login' ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Log In
          </button>
          <button
            onClick={() => { setActiveTab('register'); setErrorMsg(null); }}
            style={{
              flex: 1,
              background: activeTab === 'register' ? 'var(--bg-tertiary)' : 'transparent',
              color: activeTab === 'register' ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div style={{
            background: 'var(--danger-glow)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--danger)',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '12px',
            lineHeight: '1.5',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{errorMsg}</div>
          </div>
        )}

        {activeTab === 'login' ? (
          /* LOGIN VIEW */
          <form onSubmit={handleLoginSubmit}>
            <div className="configField" style={{ marginBottom: '16px' }}>
              <label className="configLabel" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={14} />
                <span>Username or Email</span>
              </label>
              <input
                type="text"
                required
                placeholder="johndoe or john@example.com"
                className="configInput"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
              />
            </div>

            <div className="configField" style={{ marginBottom: '24px' }}>
              <label className="configLabel" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={14} />
                <span>Password</span>
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="configInput"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="actionButton actionButtonAccent"
              style={{ width: '100%', padding: '10px 16px', fontWeight: '700' }}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        ) : (
          /* REGISTER 3-STEP WIZARD */
          <div>
            {/* Step Indicators */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '24px',
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              color: 'var(--text-muted)'
            }}>
              <span style={{ color: registerStep >= 1 ? 'var(--accent-light)' : 'inherit' }}>1. Onboarding</span>
              <span style={{ color: registerStep >= 2 ? 'var(--accent-light)' : 'inherit' }}>2. Username</span>
              <span style={{ color: registerStep >= 3 ? 'var(--accent-light)' : 'inherit' }}>3. Security</span>
            </div>

            {registerStep === 1 && (
              /* REGISTER STEP 1 */
              <div>
                <div className="configField" style={{ marginBottom: '16px' }}>
                  <label className="configLabel" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={14} />
                    <span>Owner Full Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="configInput"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                  />
                </div>

                <div className="configField" style={{ marginBottom: '16px' }}>
                  <label className="configLabel" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={14} />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    className="configInput"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="configField" style={{ marginBottom: '16px' }}>
                  <label className="configLabel" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={14} />
                    <span>Target Platform Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="My Portfolio"
                    className="configInput"
                    value={platformName}
                    onChange={(e) => setPlatformName(e.target.value)}
                  />
                </div>

                <div className="configField" style={{ marginBottom: '24px' }}>
                  <label className="configLabel" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Globe size={14} />
                    <span>Platform Origin URL</span>
                  </label>
                  <input
                    type="text"
                    placeholder="https://myportfolio.com"
                    className="configInput"
                    value={platformUrl}
                    onChange={(e) => setPlatformUrl(e.target.value)}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="actionButton actionButtonAccent"
                  style={{ width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '700' }}
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {registerStep === 2 && (
              /* REGISTER STEP 2 */
              <div>
                <div className="configField" style={{ marginBottom: '20px' }}>
                  <label className="configLabel" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={14} />
                    <span>Choose Username</span>
                  </label>
                  <input
                    type="text"
                    placeholder="johndoe"
                    className="configInput"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Only lowercase alphanumeric characters and underscores are allowed.
                  </span>
                </div>

                {/* Suggestions list */}
                {usernameSuggestions.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--accent-light)', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                      Suggested Available Usernames (Click to select):
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {usernameSuggestions.map(rec => (
                        <button
                          key={rec}
                          type="button"
                          onClick={() => setUsername(rec)}
                          style={{
                            background: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            color: 'var(--text-primary)',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                        >
                          {rec}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={handleBackStep}
                    className="actionButton"
                    style={{ flex: 1, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <ArrowLeft size={16} />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="actionButton actionButtonAccent"
                    style={{ flex: 1, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '700' }}
                  >
                    <span>Next</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {registerStep === 3 && (
              /* REGISTER STEP 3 */
              <form onSubmit={handleRegisterSubmit}>
                <div className="configField" style={{ marginBottom: '20px' }}>
                  <label className="configLabel" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Key size={14} />
                    <span>Set Password (Optional)</span>
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="configInput"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px', display: 'block', lineHeight: '1.4' }}>
                    ℹ️ Leave blank to use the default password: <code style={{ color: 'var(--accent-light)', fontFamily: 'var(--font-mono)' }}>12345678</code>. A confirmation email containing login details will be dispatched immediately.
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={handleBackStep}
                    disabled={loading}
                    className="actionButton"
                    style={{ flex: 1, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <ArrowLeft size={16} />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="actionButton actionButtonAccent"
                    style={{ flex: 2, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '700' }}
                  >
                    <span>{loading ? 'Registering...' : 'Register Account'}</span>
                    <Check size={16} />
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
