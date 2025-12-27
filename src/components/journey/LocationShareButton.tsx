import { Share2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface LocationShareButtonProps {
  shareUrl: string | null;
  onCopy: () => Promise<boolean>;
}

export default function LocationShareButton({ shareUrl, onCopy }: LocationShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await onCopy();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!shareUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Track my location',
          text: 'Follow my journey in real-time on Noura Safety',
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or share failed, fall back to copy
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  if (!shareUrl) return null;

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        className="flex-1"
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share Location
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}
