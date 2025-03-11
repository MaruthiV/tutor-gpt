'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonProps {
  conversationId: string;
  isShared: boolean;
  initialShareUrl: string | null;
}

export default function ShareButton({
  conversationId,
  isShared,
  initialShareUrl,
}: ShareButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleShare = async () => {
    try {
      setIsLoading(true);

      // If already shared, just copy the URL
      if (isShared && initialShareUrl) {
        await navigator.clipboard.writeText(`${window.location.origin}${initialShareUrl}`);
        toast.success('Share link copied to clipboard!');
        return;
      }

      // Generate new share URL
      const response = await fetch(`/api/conversations/${conversationId}/share`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to share conversation');
      }

      const { shareUrl } = await response.json();
      await navigator.clipboard.writeText(`${window.location.origin}${shareUrl}`);
      toast.success('Share link copied to clipboard!');
    } catch (error) {
      console.error('Error sharing conversation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to share conversation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleShare}
      disabled={isLoading}
      title="Share conversation"
      aria-label="Share conversation"
    >
      <Share2 className="h-4 w-4" />
    </Button>
  );
} 