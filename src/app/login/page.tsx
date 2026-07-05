import React from 'react';
import { redirect } from 'next/navigation';
import AuthForm from '../AuthForm';
import { getCurrentUser } from '../actions';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log In | Strata',
  description: 'Log in to your Strata account or create a new one.',
};

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const user = await getCurrentUser();

  // If already authenticated, redirect back to the dashboard (root)
  if (user) {
    redirect('/');
  }

  return <AuthForm />;
}
