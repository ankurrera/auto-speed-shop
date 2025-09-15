import { useState, useRef, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { useThrottle } from '@/hooks/use-debounce';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onTyping: () => void;
  disabled?: boolean;
}

const MessageInput = ({ onSendMessage, onTyping, disabled }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Throttle typing indicator calls to prevent database spam
  const throttledTyping = useThrottle(onTyping, 1000);

  const handleSend = async () => {
    if (!message.trim() || isSending || disabled) return;

    setIsSending(true);
    try {
      await onSendMessage(message);
      setMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      return;
    }

    // Handle typing indicator with throttling
    throttledTyping();
  };

  const handleInputChange = (value: string) => {
    setMessage(value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
    
    // Trigger typing indicator with throttling when user is typing
    if (value.trim()) {
      throttledTyping();
    }
  };

  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1 min-w-0">
        <Textarea
          ref={textareaRef}
          placeholder={disabled ? 'Sign in to chat with support...' : 'Type your message...'}
          value={message}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="min-h-[40px] max-h-[120px] resize-none"
          rows={1}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
      <Button
        onClick={handleSend}
        disabled={!message.trim() || isSending || disabled}
        size="icon"
        className="h-10 w-10 flex-shrink-0"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default MessageInput;