import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isRateLimited } from '@/lib/rate-limiter';
import { publishMessageEvent } from '@/lib/kafka';
import { sendDiscordNotification, sendTelegramNotification, sendEmailNotification } from '@/lib/notifications';
import { analyzeSpam } from '@/lib/trustGateClient';

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-project-id',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}

/**
 * Regex-based lightweight mock AI sentiment, priority, and spam classification logic.
 * Fully optional and fail-open.
 */
function classifyMessage(messageText: string, subjectText?: string) {
  const text = `${subjectText || ''} ${messageText}`.toLowerCase();
  
  // 1. Spam Score Check
  const spamKeywords = ['cheap', 'watches', 'crypto', 'double money', 'rolex', 'invest', 'pills', 'buy now', 'click here', 'replica', 'viagra', 'earn money'];
  let matches = 0;
  spamKeywords.forEach(word => {
    if (text.includes(word)) matches++;
  });
  const spamScore = matches > 0 ? Math.min(0.25 + matches * 0.25, 0.99) : Math.random() * 0.05;

  // 2. Sentiment Check
  const positiveWords = ['great', 'love', 'awesome', 'good', 'cool', 'expert', 'perfect', 'thanks', 'thank you', 'pleasure'];
  const negativeWords = ['bad', 'hate', 'terrible', 'spambot', 'fake', 'scam', 'error', 'wrong', 'fail', 'poor'];
  let positiveScore = 0;
  let negativeScore = 0;
  positiveWords.forEach(word => { if (text.includes(word)) positiveScore++; });
  negativeWords.forEach(word => { if (text.includes(word)) negativeScore++; });

  let sentiment = 'neutral';
  if (positiveScore > negativeScore) sentiment = 'positive';
  else if (negativeScore > positiveScore) sentiment = 'negative';

  // 3. Priority Check
  const priorityKeywords = ['urgent', 'asap', 'emergency', 'critical', 'help', 'freelance', 'budget', 'immediately', 'hire'];
  const mediumKeywords = ['consultation', 'question', 'feedback', 'project', 'proposal'];
  let isHigh = false;
  let isMedium = false;
  priorityKeywords.forEach(word => { if (text.includes(word)) isHigh = true; });
  mediumKeywords.forEach(word => { if (text.includes(word)) isMedium = true; });

  let priority = 'low';
  if (isHigh) priority = 'high';
  else if (isMedium) priority = 'medium';

  return { spamScore, sentiment, priority };
}

/**
 * GET handler: Returns all messages associated with a project.
 * Requires Bearer Token Authentication matching a Project's API key.
 */
export async function GET(req: NextRequest) {
  const headers = getCorsHeaders();

  try {
    // 1. Authenticate API Key
    const authHeader = req.headers.get('authorization');
    const apiKey = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Unauthorized. Missing API token in Authorization header.' },
        { status: 401, headers }
      );
    }

    // Find the project matching this API key
    const project = await prisma.project.findUnique({
      where: { apiKey }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid API Key.' },
        { status: 401, headers }
      );
    }

    // 2. Fetch messages associated with this project
    console.log(`[API GET] Fetching latest messages for Project: ${project.name} (id: ${project.id})...`);
    const messages = await prisma.message.findMany({
      where: { projectId: project.id },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(
      { success: true, messages, project },
      { status: 200, headers }
    );
  } catch (error: any) {
    console.error('[API GET] Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500, headers }
    );
  }
}

/**
 * POST handler: Submits a contact message under a specific project.
 * Enforces Rate-limiting, Project authentication, and multi-channel events pipeline triggers.
 */
export async function POST(req: NextRequest) {
  const headers = getCorsHeaders();

  try {
    // 1. Redis Rate Limiting Check
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const throttled = await isRateLimited(ip);
    
    if (throttled) {
      console.warn(`[API POST] Rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        { error: 'Too many submissions. Please wait a few minutes and try again.' },
        { status: 429, headers }
      );
    }

    // 2. Authenticate Project ID + API Key headers
    const projectId = req.headers.get('x-project-id');
    const authHeader = req.headers.get('authorization');
    const apiKey = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!projectId || !apiKey) {
      return NextResponse.json(
        { error: 'Unauthorized. Missing x-project-id or Authorization header.' },
        { status: 401, headers }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project || project.apiKey !== apiKey) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid Project ID or API Key configuration.' },
        { status: 401, headers }
      );
    }

    // 3. Parse and Validate request body
    const body = await req.json();
    const { name, email, subject, message } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400, headers });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400, headers });
    }
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400, headers });
    }

    // 4. Perform Optional AI Post-processing Classification
    let aiMetrics: {
      spamScore: number | null;
      priority: string | null;
      sentiment: string | null;
    } = { spamScore: null, priority: null, sentiment: null };
    let spamClassification: string | null = null;
    try {
      const classification = classifyMessage(message, subject);
      aiMetrics.priority = classification.priority;
      aiMetrics.sentiment = classification.sentiment;

      const tgResult = await analyzeSpam(message);
      aiMetrics.spamScore = tgResult.threatScore / 10;
      spamClassification = tgResult.classification;
    } catch (aiErr) {
      console.warn('[API POST] Mock AI / TrustGate classification failed, continuing with empty metrics:', aiErr);
    }

    // 5. Save directly to Supabase Postgres (Prisma)
    console.log(`[API POST] Storing incoming message for project ${project.name}...`);
    const savedMessage = await prisma.message.create({
      data: {
        projectId: project.id,
        name: name.trim(),
        email: email.trim(),
        subject: subject ? subject.trim() : null,
        message: message.trim(),
        status: 'unread',
        ...aiMetrics
      },
    });
    console.log(`[API POST] Saved message ${savedMessage.id} under project ${project.id}.`);

    // 6. Publish to Kafka event stream for asynchronous parallel worker notifications
    const published = await publishMessageEvent({
      id: savedMessage.id,
      projectId: savedMessage.projectId,
      name: savedMessage.name,
      email: savedMessage.email,
      subject: savedMessage.subject,
      message: savedMessage.message,
      createdAt: savedMessage.createdAt,
      spamClassification,
      spamScore: aiMetrics.spamScore,
    });

    // Fail-open: Direct webhook dispatch fallback if Kafka is down
    if (!published) {
      console.log('[API POST] Kafka event stream is offline. Checking fallback direct channel dispatch...');
      
      if (project.discordEnabled && project.discordWebhook) {
        await sendDiscordNotification({
          name: savedMessage.name,
          email: savedMessage.email,
          subject: savedMessage.subject,
          message: savedMessage.message,
          spamClassification,
          spamScore: aiMetrics.spamScore,
        }, project.discordWebhook, project.name);
      }
      
      if (project.telegramEnabled && project.telegramToken && project.telegramChatId) {
        await sendTelegramNotification({
          name: savedMessage.name,
          email: savedMessage.email,
          subject: savedMessage.subject,
          message: savedMessage.message,
          spamClassification,
          spamScore: aiMetrics.spamScore,
        }, project.telegramToken, project.telegramChatId, project.name);
      }
      
      if (project.emailEnabled && project.emailRecipient) {
        await sendEmailNotification({
          name: savedMessage.name,
          email: savedMessage.email,
          subject: savedMessage.subject,
          message: savedMessage.message,
          spamClassification,
          spamScore: aiMetrics.spamScore,
        }, project.emailRecipient, project.name);
      }
    }

    return NextResponse.json(
      { success: true, message: 'Message processed and notification queued.', data: savedMessage },
      { status: 201, headers }
    );
  } catch (error: any) {
    console.error('[API POST] Error receiving message API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500, headers }
    );
  }
}
