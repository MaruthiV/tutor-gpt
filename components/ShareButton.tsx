import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonProps {
  conversationId: string;
  isShared: boolean;
  initialShareUrl?: string;
}

export function ShareButton({
  conversationId,
  isShared,
  initialShareUrl,
}: ShareButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState(initialShareUrl);

  const handleShare = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/conversations/${conversationId}/share`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to share conversation');
      }

      const { shareUrl } = await response.json();
      setShareUrl(shareUrl);
      
      // Copy to clipboard
      const fullUrl = `${window.location.origin}${shareUrl}`;
      await navigator.clipboard.writeText(fullUrl);
      
      toast.success('Share link copied to clipboard!');
    } catch (error) {
      console.error('Error sharing conversation:', error);
      toast.error('Failed to share conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      const fullUrl = `${window.location.origin}${shareUrl}`;
      await navigator.clipboard.writeText(fullUrl);
      toast.success('Share link copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  if (!shareUrl && !isShared) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </>
        )}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
      >
        <Copy className="mr-2 h-4 w-4" />
        Copy Link
      </Button>
      <div className="flex items-center text-sm text-green-600">
        <Check className="mr-1 h-4 w-4" />
        Shared
      </div>
    </div>
  );
} 