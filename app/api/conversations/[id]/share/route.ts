import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

// Rate limiting map: userId -> { count: number, timestamp: number }
const rateLimits = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per minute

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimits.get(userId);

  if (!userLimit) {
    rateLimits.set(userId, { count: 1, timestamp: now });
    return false;
  }

  if (now - userLimit.timestamp > RATE_LIMIT_WINDOW) {
    rateLimits.set(userId, { count: 1, timestamp: now });
    return false;
  }

  if (userLimit.count >= MAX_REQUESTS) {
    return true;
  }

  userLimit.count++;
  return false;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const conversationId = params.id;

    // Validate conversation ID format
    if (!conversationId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      return NextResponse.json(
        { error: 'Invalid conversation ID format' },
        { status: 400 }
      );
    }

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 401 }
      );
    }
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check rate limit
    if (isRateLimited(user.id)) {
      return NextResponse.json(
        { error: 'Too many share requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Verify ownership
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('user_id, is_shared, share_url')
      .eq('id', conversationId)
      .single();

    if (conversationError) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    if (conversation.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // If already shared, return existing URL
    if (conversation.is_shared && conversation.share_url) {
      return NextResponse.json({ shareUrl: conversation.share_url });
    }

    // Generate share URL and update conversation
    const shareId = nanoid(10);
    const shareUrl = `/share/${shareId}`;

    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        is_shared: true,
        share_url: shareUrl,
      })
      .eq('id', conversationId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update conversation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ shareUrl });
  } catch (error) {
    console.error('Error sharing conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 