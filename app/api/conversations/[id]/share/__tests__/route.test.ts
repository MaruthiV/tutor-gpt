import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '../route';
import { nanoid } from 'nanoid';

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// Mock cookies
const mockCookies = new Map<string, string>();
jest.mock('next/headers', () => ({
  cookies: () => ({
    get: (key: string) => ({ value: mockCookies.get(key) }),
    getAll: () => Array.from(mockCookies.entries()).map(([key, value]) => ({ name: key, value })),
  }),
}));

// Mock nanoid
jest.mock('nanoid', () => ({
  nanoid: jest.fn().mockReturnValue('test-share-id')
}));

// Mock next/server
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data: any, init?: { status?: number }) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200
    }))
  }
}));

// Mock Supabase client
interface MockSupabase {
  auth: {
    getUser: jest.Mock;
  };
  from: jest.Mock;
  select: jest.Mock;
  eq: jest.Mock;
  single: jest.Mock;
  insert: jest.Mock;
}

jest.mock('@/utils/supabase/middleware', () => {
  const mockSupabase: MockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn(),
  };

  return {
    createClient: jest.fn(() => mockSupabase),
  };
});

describe('Share API Route', () => {
  let mockSupabase: MockSupabase;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCookies.clear();
    mockSupabase = jest.requireMock('@/utils/supabase/middleware').createClient();

    // Set up NextRequest mock for each test
    (NextRequest as jest.Mock).mockImplementation((url: string) => ({
      url,
      method: 'POST',
      nextUrl: new URL(url),
      cookies: {
        get: (key: string) => ({ value: mockCookies.get(key) }),
        getAll: () => Array.from(mockCookies.entries()).map(([key, value]) => ({ name: key, value })),
      }
    }));
  });

  it('should create a share URL for an owned conversation', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });

    mockSupabase.single.mockResolvedValue({
      data: {
        user_id: 'user-123',
        id: '123',
        title: 'Test Conversation',
      },
    });

    mockSupabase.insert.mockResolvedValue({
      data: { id: 'test-share-id' },
    });

    const request = new NextRequest('http://localhost/api/conversations/123/share', {
      method: 'POST',
    });
    const context = { params: { id: '123' } };

    const response = await POST(request, context);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.shareUrl).toBe('/share/test-share-id');
  });

  it('should return 401 for unauthenticated requests', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const request = new NextRequest('http://localhost/api/conversations/123/share', {
      method: 'POST',
    });
    const context = { params: { id: '123' } };

    const response = await POST(request, context);
    expect(response.status).toBe(401);
  });

  it('should return 404 for non-existent conversation', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });
    mockSupabase.single.mockResolvedValue({ data: null });

    const request = new NextRequest('http://localhost/api/conversations/123/share', {
      method: 'POST',
    });
    const context = { params: { id: '123' } };

    const response = await POST(request, context);
    expect(response.status).toBe(404);
  });

  it('should return 401 for unauthorized access', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });

    mockSupabase.single.mockResolvedValue({
      data: {
        user_id: 'different-user',
        id: '123',
        title: 'Test Conversation',
      },
    });

    const request = new NextRequest('http://localhost/api/conversations/123/share', {
      method: 'POST',
    });
    const context = { params: { id: '123' } };

    const response = await POST(request, context);
    expect(response.status).toBe(401);
  });

  it('should handle rate limiting', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });

    mockSupabase.single.mockResolvedValue({
      data: {
        user_id: 'user-123',
        id: '123',
        title: 'Test Conversation',
      },
    });

    mockSupabase.insert.mockRejectedValue(new Error('Too many requests'));

    const request = new NextRequest('http://localhost/api/conversations/123/share', {
      method: 'POST',
    });
    const context = { params: { id: '123' } };

    const response = await POST(request, context);
    expect(response.status).toBe(429);
  });

  it('should validate conversation ID format', async () => {
    const request = new NextRequest('http://localhost/api/conversations/invalid-id/share', {
      method: 'POST',
    });
    const context = { params: { id: 'invalid-id' } };

    const response = await POST(request, context);
    expect(response.status).toBe(400);
  });
}); 