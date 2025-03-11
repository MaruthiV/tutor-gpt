import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';

export const revalidate = 0;

async function getSharedConversation(shareUrl: string) {
  const supabase = createClient();
  
  const { data: conversation, error } = await supabase
    .from('conversations')
    .select(`
      *,
      conversation_messages (
        *
      )
    `)
    .eq('share_url', `/share/${shareUrl}`)
    .eq('is_shared', true)
    .single();

  if (error || !conversation) {
    return null;
  }

  return conversation;
}

export default async function SharedConversationPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  try {
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*, conversation_messages(*)')
      .eq('id', params.id)
      .single();

    if (!conversation) {
      notFound();
      return null; // This is needed for TypeScript
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">{conversation.title}</h1>
        <div className="space-y-4">
          {conversation.conversation_messages.map((message: any) => (
            <div
              key={message.id}
              className={`p-4 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-100 ml-auto'
                  : 'bg-gray-100 mr-auto'
              } max-w-3xl`}
            >
              <p className="text-sm font-semibold mb-2">
                {message.role === 'user' ? 'You' : 'Assistant'}
              </p>
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading shared conversation:', error);
    notFound();
    return null; // This is needed for TypeScript
  }
} 