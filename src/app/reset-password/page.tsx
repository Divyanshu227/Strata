import React, { Suspense } from 'react';
import ResetPasswordClient from './ResetPasswordClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password | Strata',
  description: 'Reset your Strata account password.',
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ padding: '24px', color: 'var(--text-secondary)' }}>Loading...</div>}>
      <ResetPasswordClient />
    </Suspense>
  );
}
