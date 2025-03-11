import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

// Get all conversations for the current user
export async function GET() {
  try {
    const supabase = createClient();
    
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Error fetching conversations' }, { status: 500 });
  }
}

// Create a new conversation
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { title, messages } = await request.json();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Not authenticated');

    // Create the conversation
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .insert({
        title,
        user_id: user.id,
      })
      .select()
      .single();

    if (conversationError) throw conversationError;

    // Insert messages if provided
    if (messages && messages.length > 0) {
      const { error: messagesError } = await supabase
        .from('conversation_messages')
        .insert(
          messages.map((msg: any) => ({
            conversation_id: conversation.id,
            role: msg.role,
            content: msg.content,
          }))
        );

      if (messagesError) throw messagesError;
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: 'Error creating conversation' }, { status: 500 });
  }
} 