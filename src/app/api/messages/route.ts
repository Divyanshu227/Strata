import { NextRequest, NextResponse } from 'next/server';
import { saveIncomingMessage } from '@/lib/db-service';
import { isRateLimited } from '@/lib/rate-limiter';
import { publishMessageEvent } from '@/lib/kafka';
import { sendDiscordNotification } from '@/lib/notifications';

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}

export async function POST(req: NextRequest) {
  const headers = getCorsHeaders();

  try {
    // 1. Redis Rate Limiting Check
    // Handle standard header setups for client IP identification
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const throttled = await isRateLimited(ip);
    
    if (throttled) {
      return NextResponse.json(
        { error: 'Too many submissions. Please wait a few minutes and try again.' },
        { status: 429, headers }
      );
    }

    // 2. Authenticate Token
    const authHeader = req.headers.get('authorization');
    const token = process.env.API_TOKEN;

    if (!token) {
      console.error('API_TOKEN is not configured in .env.local');
      return NextResponse.json(
        { error: 'Server authentication is not configured.' },
        { status: 500, headers }
      );
    }

    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== token) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid API token.' },
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

    // 4. Save to Database (handles SQLite/Supabase synchronization)
    const savedMessage = await saveIncomingMessage({
      name: name.trim(),
      email: email.trim(),
      subject: subject ? subject.trim() : null,
      message: message.trim(),
    });

    // 5. Publish to Kafka event stream for asynchronous Discord notifications
    const published = await publishMessageEvent({
      id: savedMessage.id,
      name: savedMessage.name,
      email: savedMessage.email,
      subject: savedMessage.subject,
      message: savedMessage.message,
      createdAt: savedMessage.createdAt,
    });

    if (!published) {
      console.log('[DEBUG] [POST] Kafka event stream is offline. Falling back to direct Discord notification...');
      await sendDiscordNotification({
        name: savedMessage.name,
        email: savedMessage.email,
        subject: savedMessage.subject,
        message: savedMessage.message,
      });
    }

    return NextResponse.json(
      { success: true, message: 'Message processed and notification queued.', data: savedMessage },
      { status: 201, headers }
    );
  } catch (error: any) {
    console.error('Error receiving message API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500, headers }
    );
  }
}
