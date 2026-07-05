import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return new NextResponse('Missing verification token.', { status: 400 });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { verifyToken: token }
    });

    if (!user) {
      return new NextResponse('Invalid or expired verification token.', { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verifyToken: null
      }
    });

    return NextResponse.redirect(new URL('/?verified=true', request.url));
  } catch (error) {
    console.error('Email verification error:', error);
    return new NextResponse('Internal server error.', { status: 500 });
  }
}
