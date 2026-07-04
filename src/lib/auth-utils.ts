import { pbkdf2Sync, randomBytes, createHmac, timingSafeEqual } from 'crypto';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/db';

const SECRET_KEY = process.env.SESSION_SECRET || 'strata-super-secret-key-1234567890';

/**
 * Hashes a plaintext password using crypto PBKDF2 with SHA-512.
 * Returns salt:hash format.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Constant-time password verification helper.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    const testHash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    
    const bufA = Buffer.from(hash, 'hex');
    const bufB = Buffer.from(testHash, 'hex');
    
    return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
  } catch (err) {
    return false;
  }
}

/**
 * Signs user session data to generate cookie tokens.
 */
export function signToken(data: string): string {
  const signature = createHmac('sha256', SECRET_KEY).update(data).digest('hex');
  return `${data}.${signature}`;
}

/**
 * Verifies and parses token, returning the decrypted string payload if valid.
 */
export function verifyToken(token: string): string | null {
  try {
    const [data, signature] = token.split('.');
    if (!data || !signature) return null;
    
    const expectedSignature = createHmac('sha256', SECRET_KEY).update(data).digest('hex');
    
    const bufA = Buffer.from(signature, 'hex');
    const bufB = Buffer.from(expectedSignature, 'hex');
    
    if (bufA.length === bufB.length && timingSafeEqual(bufA, bufB)) {
      return data;
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Scans database and recommends 3 unique available alternative usernames.
 */
export async function generateUsernameRecommendations(baseUsername: string): Promise<string[]> {
  const cleanBase = baseUsername.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
  const basePrefix = cleanBase || 'user';
  const recommendations: string[] = [];
  const suffixes = [
    () => Math.floor(100 + Math.random() * 900).toString(),
    () => 'dev',
    () => 'strata',
    () => Math.floor(10 + Math.random() * 90).toString(),
  ];

  let attempts = 0;
  while (recommendations.length < 3 && attempts < 25) {
    const suffix = suffixes[attempts % suffixes.length]();
    const candidate = `${basePrefix}_${suffix}`;
    
    // Check uniqueness in Supabase PostgreSQL
    const exists = await prisma.user.findUnique({
      where: { username: candidate }
    });
    if (!exists && !recommendations.includes(candidate)) {
      recommendations.push(candidate);
    }
    attempts++;
  }

  // Hard fallback suggestions if database matches didn't hit 3
  while (recommendations.length < 3) {
    recommendations.push(`${basePrefix}_${Math.floor(1000 + Math.random() * 9000)}`);
  }

  return recommendations;
}

/**
 * Triggers Welcome/Registration Success emails.
 * Integrates Nodemailer if SMTP details are configured, else writes mock files.
 */
export async function sendWelcomeEmail(email: string, name: string, username: string, isDefaultPassword: boolean) {
  const subject = 'Registration Successful on Strata';
  const body = `Welcome ${name}!

Registration is successful.

Kindly change password upon login, default password is 12345678.

Your Username: ${username}
Password Mode: ${isDefaultPassword ? 'Default password is 12345678' : 'Custom password configured'}`;

  const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: 587,
        secure: false,
        auth: { user: SMTP_USER, pass: SMTP_PASS }
      });

      await transporter.sendMail({
        from: SMTP_FROM || '"Strata Accounts" <no-reply@strata-app.com>',
        to: email,
        subject,
        text: body
      });
      console.log(`[Email Dispatch] Success: Real welcome email dispatched to ${email}`);
    } catch (err: any) {
      console.error('Welcome email dispatch via SMTP failed, logging to console:', err.message);
      logMockEmailConsole(email, subject, body);
    }
  } else {
    logMockEmailConsole(email, subject, body);
  }
}

function logMockEmailConsole(email: string, subject: string, body: string) {
  console.log(`
===================== MOCK WELCOME EMAIL =====================
Date: ${new Date().toISOString()}
To: ${email}
Subject: ${subject}
--------------------------------------------------------------
${body}
==============================================================
`);
}
