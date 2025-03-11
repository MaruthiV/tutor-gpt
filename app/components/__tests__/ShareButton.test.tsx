import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ShareButton from '@/app/components/ShareButton';

describe('ShareButton', () => {
  const originalFetch = global.fetch;
  const originalClipboard = navigator.clipboard;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original implementations
    global.fetch = originalFetch;
    Object.assign(navigator, { clipboard: originalClipboard });
  });

  it('should generate and copy share URL', async () => {
    const mockShareUrl = '/share/abc123';
    let fetchCalled = false;
    let clipboardCalled = false;
    let clipboardText = '';

    // Mock fetch
    global.fetch = async () => {
      fetchCalled = true;
      return {
        ok: true,
        json: async () => ({ shareUrl: mockShareUrl }),
      } as Response;
    };

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: async (text: string) => {
          clipboardCalled = true;
          clipboardText = text;
        },
      },
    });

    render(
      <ShareButton
        conversationId="123"
        isShared={false}
        initialShareUrl={null}
      />
    );

    // Simulate click
    const button = screen.getByRole('button', { name: /share conversation/i });
    await act(async () => {
      await fireEvent.click(button);
    });

    // Check if API was called
    expect(fetchCalled).toBe(true);

    // Check if URL was copied
    expect(clipboardCalled).toBe(true);
    expect(clipboardText.endsWith(mockShareUrl)).toBe(true);
  });

  it('should copy existing share URL', async () => {
    const mockShareUrl = '/share/abc123';
    let fetchCalled = false;
    let clipboardCalled = false;
    let clipboardText = '';

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: async (text: string) => {
          clipboardCalled = true;
          clipboardText = text;
        },
      },
    });

    render(
      <ShareButton
        conversationId="123"
        isShared={true}
        initialShareUrl={mockShareUrl}
      />
    );

    // Simulate click
    const button = screen.getByRole('button', { name: /share conversation/i });
    await act(async () => {
      await fireEvent.click(button);
    });

    // Check that API was not called
    expect(fetchCalled).toBe(false);

    // Check if URL was copied
    expect(clipboardCalled).toBe(true);
    expect(clipboardText.endsWith(mockShareUrl)).toBe(true);
  });

  it('should handle API errors', async () => {
    let fetchCalled = false;
    let clipboardCalled = false;

    // Mock fetch with error
    global.fetch = async () => {
      fetchCalled = true;
      return {
        ok: false,
        status: 429,
        json: async () => ({ error: 'Too many requests' }),
      } as Response;
    };

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: async () => {
          clipboardCalled = true;
        },
      },
    });

    render(
      <ShareButton
        conversationId="123"
        isShared={false}
        initialShareUrl={null}
      />
    );

    // Simulate click
    const button = screen.getByRole('button', { name: /share conversation/i });
    await act(async () => {
      await fireEvent.click(button);
    });

    // Check if API was called
    expect(fetchCalled).toBe(true);

    // Check that clipboard was not called
    expect(clipboardCalled).toBe(false);
  });

  it('should handle clipboard errors', async () => {
    const mockShareUrl = '/share/abc123';
    let fetchCalled = false;
    let clipboardCalled = false;

    // Mock fetch
    global.fetch = async () => {
      fetchCalled = true;
      return {
        ok: true,
        json: async () => ({ shareUrl: mockShareUrl }),
      } as Response;
    };

    // Mock clipboard with error
    Object.assign(navigator, {
      clipboard: {
        writeText: async () => {
          clipboardCalled = true;
          throw new Error('Clipboard error');
        },
      },
    });

    render(
      <ShareButton
        conversationId="123"
        isShared={false}
        initialShareUrl={null}
      />
    );

    // Simulate click
    const button = screen.getByRole('button', { name: /share conversation/i });
    await act(async () => {
      await fireEvent.click(button);
    });

    // Check if API was called
    expect(fetchCalled).toBe(true);

    // Check that clipboard was called but failed
    expect(clipboardCalled).toBe(true);
  });
}); 