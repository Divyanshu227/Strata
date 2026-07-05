'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Key, Check, AlertCircle, Sparkles } from 'lucide-react';
import { resetPassword } from '../actions';

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-primary)' }}>
        <h2 style={{ marginBottom: '12px' }}>Invalid Link</h2>
        <p style={{ color: 'var(--text-secondary)' }}>No reset token provided in the URL.</p>
        <button 
          onClick={() => router.push('/')}
          className="actionButton"
          style={{ marginTop: '24px' }}
        >
          Return to Login
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await resetPassword(token, password);
      if (response.success) {
        setSuccess(true);
      } else {
        setErrorMsg(response.message || 'Failed to reset password.');
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
        maxWidth: '440px',
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-color)',
        backdropFilter: 'blur(16px)',
        borderRadius: '16px',
        padding: '36px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
      }}>
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
          <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '8px' }}>Set New Password</h1>
        </div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              color: 'var(--success)',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px',
              fontSize: '14px'
            }}>
              Your password has been successfully reset.
            </div>
            <button 
              onClick={() => router.push('/')}
              className="actionButton actionButtonAccent"
              style={{ width: '100%', padding: '12px', fontWeight: '700' }}
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {errorMsg && (
              <div style={{
                background: 'var(--danger-glow)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: 'var(--danger)',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <AlertCircle size={16} />
                <div>{errorMsg}</div>
              </div>
            )}

            <div className="configField" style={{ marginBottom: '16px' }}>
              <label className="configLabel" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={14} />
                <span>New Password</span>
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="configInput"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="configField" style={{ marginBottom: '28px' }}>
              <label className="configLabel" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={14} />
                <span>Confirm New Password</span>
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="configInput"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="actionButton actionButtonAccent"
              style={{ width: '100%', padding: '12px', fontWeight: '700' }}
            >
              {loading ? 'Saving...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
