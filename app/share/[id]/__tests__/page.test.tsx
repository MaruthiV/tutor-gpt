import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SharedConversationPage from '../page';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';

// Mock the notFound function
jest.mock('next/navigation', () => ({
  notFound: jest.fn()
}));

// Mock createClient
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn()
}));

interface MockSupabaseClient {
  from: jest.Mock;
  select: jest.Mock;
  eq: jest.Mock;
  single: jest.Mock;
}

describe('SharedConversationPage', () => {
  const mockConversation = {
    id: '123',
    title: 'Test Conversation',
    conversation_messages: [
      {
        id: '1',
        role: 'user',
        content: 'Hello',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        role: 'assistant',
        content: 'Hi there!',
        created_at: new Date().toISOString()
      }
    ]
  };

  it('should render shared conversation', async () => {
    const mockSupabase: MockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockConversation })
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    render(await SharedConversationPage({ params: { id: '123' } }));

    expect(screen.getByText('Test Conversation')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('should handle not found conversation', async () => {
    const mockSupabase: MockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null })
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    await SharedConversationPage({ params: { id: '123' } });

    expect(notFound).toHaveBeenCalled();
  });

  it('should handle error fetching conversation', async () => {
    const mockSupabase: MockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockRejectedValue(new Error('Database error'))
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    await SharedConversationPage({ params: { id: '123' } });

    expect(notFound).toHaveBeenCalled();
  });
}); 