'use server';

import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { 
  hashPassword, 
  verifyPassword, 
  signToken, 
  verifyToken, 
  generateUsernameRecommendations, 
  sendWelcomeEmail 
} from '@/lib/auth-utils';

/**
 * Retrieves the currently logged-in User from secure HTTP-only cookies session.
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('strata-session')?.value;
    if (!sessionCookie) return null;

    const userId = verifyToken(sessionCookie);
    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        emailVerified: true,
        createdAt: true
      }
    });

    if (!user) return null;
    return user;
  } catch (err) {
    return null;
  }
}

/**
 * Registers a new Developer account, seeds their first Project, sets session cookie, and sends confirmation mail.
 */
export async function registerUser(data: {
  name: string;
  email: string;
  username: string;
  password?: string;
  platformName: string;
  platformUrl: string;
}) {
  try {
    const email = data.email.trim().toLowerCase();
    const username = data.username.trim().toLowerCase();
    const name = data.name.trim();
    const platformName = data.platformName.trim();
    const platformUrl = data.platformUrl.trim();

    // Default password fallback
    const isDefaultPassword = !data.password || data.password.trim() === '';
    const passwordRaw = isDefaultPassword ? '12345678' : data.password!.trim();

    // Basic Input Validations
    if (!username || !email || !name || !platformName) {
      return { success: false, error: 'validation', message: 'All onboarding fields are required.' };
    }
    if (!/^[a-z0-9_]+$/.test(username)) {
      return { success: false, error: 'validation', message: 'Username must contain only lowercase alphanumeric characters and underscores.' };
    }

    // Check email uniqueness
    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (emailExists) {
      return { success: false, error: 'email_taken', message: 'Email address is already in use.' };
    }

    // Check username uniqueness
    const usernameExists = await prisma.user.findUnique({ where: { username } });
    if (usernameExists) {
      const recommendations = await generateUsernameRecommendations(username);
      return {
        success: false,
        error: 'username_taken',
        message: 'Username is already taken.',
        recommendations
      };
    }

    // Save hashed password User
    const hashedPassword = hashPassword(passwordRaw);
    const verifyTokenStr = crypto.randomBytes(32).toString('hex');
    const user = await prisma.user.create({
      data: {
        name,
        email,
        username,
        password: hashedPassword,
        verifyToken: verifyTokenStr,
        emailVerified: false
      }
    });

    // Seed default Project using provided platform configs
    const apiKey = `strata_token_${user.username}_${Math.random().toString(36).slice(2, 8)}`;
    const project = await prisma.project.create({
      data: {
        ownerId: user.id,
        name: platformName,
        apiKey,
        platform: platformName,
        platformUrl: platformUrl || null
      }
    });

    // Write secure signed Session Cookie
    const token = signToken(user.id);
    const cookieStore = await cookies();
    cookieStore.set('strata-session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    // Dispatch welcome email success check
    sendWelcomeEmail(email, name, username, isDefaultPassword, verifyTokenStr).catch(err => {
      console.error('Welcome email failed:', err);
    });

    return { 
      success: true, 
      user: { id: user.id, name: user.name, username: user.username, email: user.email, emailVerified: user.emailVerified } 
    };
  } catch (error: any) {
    console.error('Registration failed:', error);
    return { success: false, error: 'server', message: error.message };
  }
}

export async function resendVerificationEmail() {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: 'Unauthorized.' };
    if (user.emailVerified) return { success: false, message: 'Email already verified.' };

    const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!fullUser) return { success: false, message: 'User not found.' };

    const verifyTokenStr = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: { verifyToken: verifyTokenStr }
    });

    await sendWelcomeEmail(fullUser.email, fullUser.name, fullUser.username, false, verifyTokenStr);
    return { success: true, message: 'Verification email sent successfully!' };
  } catch (error: any) {
    console.error('Failed to resend verification email:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Logs in a Developer using username/email and password.
 */
export async function loginUser(data: {
  identifier: string;
  password: string;
}) {
  try {
    const identifier = data.identifier.trim().toLowerCase();
    const password = data.password.trim();

    if (!identifier || !password) {
      return { success: false, message: 'Username/Email and Password are required.' };
    }

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      }
    });

    if (!user || !verifyPassword(password, user.password)) {
      return { success: false, message: 'Invalid credentials. Please verify details.' };
    }

    // Set secure cookie session
    const token = signToken(user.id);
    const cookieStore = await cookies();
    cookieStore.set('strata-session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7
    });

    return { 
      success: true, 
      user: { id: user.id, name: user.name, username: user.username, email: user.email } 
    };
  } catch (error: any) {
    console.error('Login failed:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Removes session token to log out.
 */
export async function logoutUser() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('strata-session');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

/**
 * Creates a new project workspace under the current User.
 */
export async function createNewProject(data: {
  name: string;
  platform: string;
  platformUrl: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized.');

    const name = data.name.trim();
    const platform = data.platform.trim();
    const platformUrl = data.platformUrl.trim();

    if (!name || !platform) throw new Error('Project name and platform are required.');

    const apiKey = `strata_token_${user.username}_${Math.random().toString(36).slice(2, 8)}`;
    const newProject = await prisma.project.create({
      data: {
        ownerId: user.id,
        name,
        apiKey,
        platform,
        platformUrl: platformUrl || null
      }
    });

    revalidatePath('/');
    return { success: true, project: newProject };
  } catch (error: any) {
    console.error('Failed to create project:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Marks a message as read. Validates owner access.
 */
export async function markMessageAsRead(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const message = await prisma.message.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!message || message.project.ownerId !== user.id) {
      throw new Error('Unauthorized message access.');
    }

    const updated = await prisma.message.update({
      where: { id },
      data: { status: 'read' },
    });
    revalidatePath('/');
    return updated;
  } catch (error: any) {
    console.error('Failed to mark message read:', error);
    throw new Error(error.message || 'Database connection failed.');
  }
}

/**
 * Toggles a message's archive status. Validates owner access.
 */
export async function toggleMessageArchive(id: string, currentStatus: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const message = await prisma.message.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!message || message.project.ownerId !== user.id) {
      throw new Error('Unauthorized message access.');
    }

    const nextStatus = currentStatus === 'archived' ? 'read' : 'archived';
    const updated = await prisma.message.update({
      where: { id },
      data: { status: nextStatus },
    });
    revalidatePath('/');
    return updated;
  } catch (error: any) {
    console.error('Failed to toggle archive status:', error);
    throw new Error(error.message || 'Database connection failed.');
  }
}

/**
 * Deletes a message permanently. Validates owner access.
 */
export async function deleteMessage(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const message = await prisma.message.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!message || message.project.ownerId !== user.id) {
      throw new Error('Unauthorized message access.');
    }

    const deleted = await prisma.message.delete({
      where: { id },
    });
    revalidatePath('/');
    return deleted;
  } catch (error: any) {
    console.error('Failed to delete message:', error);
    throw new Error(error.message || 'Database connection failed.');
  }
}

/**
 * Computes statistics for a specific project. Validates owner access.
 */
export async function getStats(projectId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { total: 0, unread: 0, archived: 0, inbox: 0 };

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.ownerId !== user.id) {
      return { total: 0, unread: 0, archived: 0, inbox: 0 };
    }

    const total = await prisma.message.count({ where: { projectId } });
    const unread = await prisma.message.count({ where: { projectId, status: 'unread' } });
    const archived = await prisma.message.count({ where: { projectId, status: 'archived' } });
    const inbox = total - archived;
    return { total, unread, archived, inbox };
  } catch (error) {
    return { total: 0, unread: 0, archived: 0, inbox: 0 };
  }
}

/**
 * Updates settings for a project. Validates owner access.
 */
export async function updateProjectSettings(projectId: string, data: {
  discordEnabled?: boolean;
  discordWebhook?: string | null;
  telegramEnabled?: boolean;
  telegramToken?: string | null;
  telegramChatId?: string | null;
  emailEnabled?: boolean;
  emailRecipient?: string | null;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.ownerId !== user.id) {
      throw new Error('Unauthorized project access.');
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        discordEnabled: data.discordEnabled,
        discordWebhook: data.discordWebhook,
        telegramEnabled: data.telegramEnabled,
        telegramToken: data.telegramToken,
        telegramChatId: data.telegramChatId,
        emailEnabled: data.emailEnabled,
        emailRecipient: user.email, // SECURITY FIX: Lock to owner's email to prevent open relay abuse
      }
    });
    revalidatePath('/');
    return updated;
  } catch (error: any) {
    throw new Error(error.message || 'Database connection failed.');
  }
}
