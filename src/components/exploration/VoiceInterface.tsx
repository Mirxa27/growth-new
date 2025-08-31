import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceInterfaceProps {
  isRecording: boolean;
  isConnecting: boolean;
  isSpeaking: boolean;
  onToggleRecording: () => void;
}

export const VoiceInterface = ({
  isRecording,
  isConnecting,
  isSpeaking,
  onToggleRecording
}: VoiceInterfaceProps) => {
  return (
    <div className="flex flex-col items-center space-y-4">
      <Button
        onClick={onToggleRecording}
        disabled={isConnecting}
        className={cn(
          "w-24 h-24 rounded-full transition-all duration-300",
          isRecording
            ? "bg-red-500 hover:bg-red-600 animate-pulse"
            : isSpeaking
              ? "bg-secondary"
              : "bg-primary",
          isConnecting && "opacity-50 cursor-not-allowed"
        )}
      >
        {isConnecting ? (
          <Loader2 className="w-8 h-8 animate-spin" />
        ) : isSpeaking ? (
          <Volume2 className="w-8 h-8" />
        ) : isRecording ? (
          <MicOff className="w-8 h-8" />
        ) : (
          <Mic className="w-8 h-8" />
        )}
      </Button>
      <p className="text-sm text-muted-foreground">
        {isConnecting
          ? "Connecting..."
          : isSpeaking
            ? "NewMe is speaking..."
            : isRecording
              ? "Tap to stop recording"
              : "Tap to start recording"}
      </p>
    </div>
  );
};