// ENV REQUIRED: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM (optional)
import { NextRequest, NextResponse } from 'next/server';
import { sendInviteEmail } from './emailer';
import { User } from '@/lib/user-model';

function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const { emails } = await req.json();
    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'No emails provided' }, { status: 400 });
    }
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const invited: string[] = [];
    const ignored: string[] = [];
    for (const email of emails) {
      if (!isValidEmail(email)) {
        ignored.push(email);
        continue;
      }
      const existing = await User.findByEmail(email);
      if (existing) {
        ignored.push(email);
        continue;
      }
      try {
        await sendInviteEmail(email, origin);
        invited.push(email);
      } catch (err) {
        ignored.push(email); // treat failed sends as ignored for now
      }
    }
    return NextResponse.json({ invited, ignored });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to send invites' }, { status: 500 });
  }
}
